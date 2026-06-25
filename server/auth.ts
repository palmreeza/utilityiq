/**
 * Self-contained email/password authentication.
 * No external OAuth provider required — works on any Node.js host.
 * Uses bcryptjs for password hashing and jose for JWT session tokens.
 */
import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "uiq_session";
const SALT_ROUNDS = 12;
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

function getCookieOptions(req: Request) {
  const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export async function createSessionToken(userId: number, email: string): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(nanoid())
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const { userId, email } = payload as Record<string, unknown>;
    if (typeof userId !== "number" || typeof email !== "string") return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) map.set(k.trim(), decodeURIComponent(v.join("=")));
  }
  return map;
}

export async function getSessionUser(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return result[0] ?? null;
}

export function registerAuthRoutes(app: Express) {
  // POST /api/auth/register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

      // Check if email already exists
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const openId = `local_${nanoid(16)}`;

      // First user ever becomes platform_owner + admin
      const allUsers = await db.select({ id: users.id }).from(users).limit(1);
      const isFirst = allUsers.length === 0;

      await db.insert(users).values({
        openId,
        name,
        email,
        passwordHash,
        loginMethod: "email",
        role: isFirst ? "admin" : "user",
        platformRole: isFirst ? "platform_owner" : "member",
        lastSignedIn: new Date(),
      });

      const created = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = created[0];
      if (!user) { res.status(500).json({ error: "Failed to create user" }); return; }

      const token = await createSessionToken(user.id, user.email ?? "");
      res.cookie(COOKIE_NAME, token, getCookieOptions(req));
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        platformRole: user.platformRole,
      });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = result[0];
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Update lastSignedIn
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const token = await createSessionToken(user.id, user.email ?? "");
      res.cookie(COOKIE_NAME, token, getCookieOptions(req));
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        platformRole: user.platformRole,
      });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const opts = getCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
    res.json({ success: true });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const user = await getSessionUser(req);
    if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      platformRole: user.platformRole,
    });
  });
}

export { COOKIE_NAME };
