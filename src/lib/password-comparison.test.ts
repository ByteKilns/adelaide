import { describe, expect, it } from "vitest";

import { getPasswordHashForComparison } from "./password-comparison";

describe("getPasswordHashForComparison", () => {
  it("returns the user's own hash when a user is found", () => {
    expect(getPasswordHashForComparison({ passwordHash: "$2b$12$abcdefghijklmnopqrstuv" })).toBe(
      "$2b$12$abcdefghijklmnopqrstuv",
    );
  });

  it("returns a valid bcrypt-shaped dummy hash when no user is found", () => {
    const hash = getPasswordHashForComparison(undefined);
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it("returns the same dummy hash every call, so its cost factor stays representative", () => {
    expect(getPasswordHashForComparison(undefined)).toBe(getPasswordHashForComparison(undefined));
  });
});
