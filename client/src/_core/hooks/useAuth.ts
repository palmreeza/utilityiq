import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  platformRole: "platform_owner" | "member";
};

// ── REST helpers ────────────────────────────────────────────────────────────

export async function authLogin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  return data as AuthUser;
}

export async function authRegister(name: string, email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Registration failed");
  return data as AuthUser;
}

export async function authLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

// ── Shared singleton cache (avoids duplicate fetches across component tree) ──

type AuthCache = {
  user: AuthUser | null;
  loading: boolean;
  promise: Promise<void> | null;
};

const cache: AuthCache = { user: null, loading: true, promise: null };
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach(fn => fn());
}

function fetchCurrentUser(): Promise<void> {
  if (cache.promise) return cache.promise;
  cache.promise = fetch("/api/auth/me", { credentials: "include" })
    .then(async res => {
      cache.user = res.ok ? await res.json() : null;
    })
    .catch(() => {
      cache.user = null;
    })
    .finally(() => {
      cache.loading = false;
      cache.promise = null;
      notifyAll();
    });
  return cache.promise;
}

// Kick off the initial fetch immediately so it's ready by first render
fetchCurrentUser();

// ── Hook ─────────────────────────────────────────────────────────────────────

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/" } = options ?? {};

  // Local state mirrors the shared cache so React re-renders on change
  const [, tick] = useState(0);

  useEffect(() => {
    const rerender = () => tick(n => n + 1);
    listeners.add(rerender);
    // If the cache is still loading, ensure the fetch is running
    if (cache.loading) fetchCurrentUser();
    return () => { listeners.delete(rerender); };
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    cache.user = null;
    cache.loading = false;
    notifyAll();
    window.location.href = "/";
  }, []);

  const refresh = useCallback(async () => {
    cache.loading = true;
    cache.promise = null;
    notifyAll();
    await fetchCurrentUser();
  }, []);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (cache.loading) return;
    if (cache.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  });

  return {
    user: cache.user,
    loading: cache.loading,
    error: null as Error | null,
    isAuthenticated: Boolean(cache.user),
    logout,
    refresh,
  };
}
