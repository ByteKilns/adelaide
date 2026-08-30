import bcrypt from "bcryptjs";

// A bcrypt.compare against a nonexistent user's hash never runs, so looking
// up a registered email takes measurably longer (~400ms) than a nonexistent
// one (~20ms) — an attacker can enumerate accounts purely by timing. Always
// comparing against *some* hash of the same cost, even when no user was
// found, keeps both paths the same shape.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-timing-safety", 12);

export function getPasswordHashForComparison(user: { passwordHash: string } | undefined): string {
  return user?.passwordHash ?? DUMMY_PASSWORD_HASH;
}
