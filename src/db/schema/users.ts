import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // Small resized image stored as a data URL — no blob storage is wired up
  // yet, so this is the simplest thing that works; swap for a real storage
  // URL later without changing callers.
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
