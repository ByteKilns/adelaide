import { pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { households } from "./households";

export const notificationCategoryEnum = pgEnum("notification_category", ["budget", "goal", "payment", "shared"]);
export const notificationSeverityEnum = pgEnum("notification_severity", ["danger", "info", "success", "warning"]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    category: notificationCategoryEnum("category").notNull(),
    severity: notificationSeverityEnum("severity").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // Identifies the real-world event this notification represents (e.g. a
    // specific recurring item's current due date, or "category X crossed
    // 80% for May 2026") so the generating code can safely run on every
    // relevant page load / mutation without ever inserting a duplicate —
    // see insertNotification's onConflictDoNothing against this.
    dedupeKey: text("dedupe_key").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.householdId, table.dedupeKey)],
);
