import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { isLockedOut, recordFailedAttempt, resetAttempts } from "@/lib/login-lockout";
import { getPasswordHashForComparison } from "@/lib/password-comparison";

const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

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
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.userId = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) session.user.id = token.userId as string;
      return session;
    },
  },
});

export const { GET, POST } = handlers;
export { signIn, signOut, auth };
