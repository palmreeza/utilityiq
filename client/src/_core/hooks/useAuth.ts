import { useCallback, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  platformRole: "platform_owner" | "member";
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// Simple fetch wrapper for our REST auth endpoints
async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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

// Singleton state so all useAuth() calls share the same data
let _user: AuthUser | null = null;
let _loading = true;
let _listeners: Array<() => void> = [];
let _fetched = false;

function notify() {
  _listeners.forEach(fn => fn());
}

async function loadUser() {
  if (_fetched) return;
  _fetched = true;
  _loading = true;
  notify();
  _user = await fetchMe();
  _loading = false;
  notify();
}

loadUser();

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/" } = options ?? {};
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    _user = null;
    _fetched = false;
    notify();
    window.location.href = "/";
  }, []);

  const refresh = useCallback(async () => {
    _fetched = false;
    await loadUser();
  }, []);

  const state = useMemo<AuthState>(() => ({
    user: _user,
    loading: _loading,
    error: null,
    isAuthenticated: Boolean(_user),
  }), []);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (_loading) return;
    if (_user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath]);

  return { ...state, logout, refresh };
}
