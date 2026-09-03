import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signMobileToken, verifyMobileToken } from "./mobile-auth";

const TEST_SECRET = "test-secret-at-least-32-bytes-long-for-hmac";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", TEST_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signMobileToken / verifyMobileToken", () => {
  it("round-trips a userId through sign then verify", async () => {
    const token = await signMobileToken("user-123");
    expect(await verifyMobileToken(token)).toBe("user-123");
  });

  it("rejects a tampered token", async () => {
    const token = await signMobileToken("user-123");
    const mid = Math.floor(token.length / 2);
    const tampered = token.slice(0, mid) + (token[mid] === "a" ? "b" : "a") + token.slice(mid + 1);
    expect(await verifyMobileToken(tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const otherToken = await new SignJWT({ sub: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("90d")
      .sign(new TextEncoder().encode("a-completely-different-secret-value"));
    expect(await verifyMobileToken(otherToken)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifyMobileToken("not-a-jwt")).toBeNull();
  });
});
