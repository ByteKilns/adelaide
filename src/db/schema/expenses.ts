import { date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { categories } from "./categories";
import { householdMembers } from "./householdMembers";
import { households } from "./households";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  // null = shared
  ownerMemberId: uuid("owner_member_id").references(() => householdMembers.id, {
    onDelete: "cascade",
  }),
  paidByMemberId: uuid("paid_by_member_id")
    .notNull()
    .references(() => householdMembers.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
