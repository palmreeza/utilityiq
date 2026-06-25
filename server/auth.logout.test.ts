import { describe, expect, it, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken, parseCookies } from "./auth";

/**
 * Tests for the self-contained email/password auth module.
 * The tRPC auth.logout procedure was replaced by POST /api/auth/logout (REST).
 * These tests cover the JWT session token lifecycle instead.
 */
describe("auth — session token lifecycle", () => {
  const testSecret = "test-jwt-secret-that-is-long-enough-32chars";

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  it("creates and verifies a session token", async () => {
    const token = await createSessionToken(42, "user@example.com");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(42);
    expect(payload?.email).toBe("user@example.com");
  });

  it("returns null for an invalid token", async () => {
    const result = await verifySessionToken("not.a.valid.token");
    expect(result).toBeNull();
  });

  it("returns null for an empty token", async () => {
    const result = await verifySessionToken("");
    expect(result).toBeNull();
  });

  it("parseCookies parses a cookie header correctly", () => {
    const cookies = parseCookies("uiq_session=abc123; other=xyz");
    expect(cookies.get("uiq_session")).toBe("abc123");
    expect(cookies.get("other")).toBe("xyz");
  });

  it("parseCookies returns empty map for undefined header", () => {
    const cookies = parseCookies(undefined);
    expect(cookies.size).toBe(0);
  });
});
