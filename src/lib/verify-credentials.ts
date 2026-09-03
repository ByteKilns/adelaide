import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { isLockedOut, recordFailedAttempt, resetAttempts } from "@/lib/login-lockout";
import { getPasswordHashForComparison } from "@/lib/password-comparison";

export type VerifiedUser = { email: string; id: string; name: string };

export async function verifyCredentials(email: string, password: string): Promise<VerifiedUser | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  const now = new Date();
  if (user && isLockedOut(user, now)) return null;

  // Always compare against *some* bcrypt hash, even when no user was
  // found, so a nonexistent email can't be distinguished from a wrong
  // password by response time.
  const valid = await bcrypt.compare(password, getPasswordHashForComparison(user));
  if (!user || !valid) {
    if (user) {
      const next = recordFailedAttempt(user, now);
      await db.update(users).set(next).where(eq(users.id, user.id));
    }
    return null;
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.update(users).set(resetAttempts()).where(eq(users.id, user.id));
  }

  return { id: user.id, email: user.email, name: user.name };
}
