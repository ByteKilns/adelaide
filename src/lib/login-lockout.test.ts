import { describe, expect, it } from "vitest";

import { isLockedOut, LOCKOUT_DURATION_MS, MAX_FAILED_ATTEMPTS, recordFailedAttempt, resetAttempts } from "./login-lockout";

describe("isLockedOut", () => {
  it("is false when lockedUntil is null", () => {
    expect(isLockedOut({ lockedUntil: null }, new Date())).toBe(false);
  });

  it("is true when lockedUntil is in the future", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const lockedUntil = new Date("2026-01-01T00:05:00Z");
    expect(isLockedOut({ lockedUntil }, now)).toBe(true);
  });

  it("is false once lockedUntil has passed", () => {
    const now = new Date("2026-01-01T00:10:00Z");
    const lockedUntil = new Date("2026-01-01T00:05:00Z");
    expect(isLockedOut({ lockedUntil }, now)).toBe(false);
  });
});

describe("recordFailedAttempt", () => {
  it("increments the attempt count without locking below the threshold", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const next = recordFailedAttempt({ failedLoginAttempts: 1 }, now);
    expect(next).toEqual({ failedLoginAttempts: 2, lockedUntil: null });
  });

  it("locks the account once the max attempt count is reached", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const next = recordFailedAttempt({ failedLoginAttempts: MAX_FAILED_ATTEMPTS - 1 }, now);
    expect(next.failedLoginAttempts).toBe(MAX_FAILED_ATTEMPTS);
    expect(next.lockedUntil).toEqual(new Date(now.getTime() + LOCKOUT_DURATION_MS));
  });
});

describe("resetAttempts", () => {
  it("clears the attempt count and lock", () => {
    expect(resetAttempts()).toEqual({ failedLoginAttempts: 0, lockedUntil: null });
  });
});
