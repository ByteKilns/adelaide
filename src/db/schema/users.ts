import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // Small resized image stored as a data URL — no blob storage is wired up
  // yet, so this is the simplest thing that works; swap for a real storage
  // URL later without changing callers.
  image: text("image"),
  // Login lockout state (see src/lib/login-lockout.ts) — stored per-user
  // rather than in-memory so it holds up across serverless invocations.
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
