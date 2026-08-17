import { pgTable, uuid, integer, numeric, unique } from "drizzle-orm/pg-core";
import { households } from "./households";
import { categories } from "./categories";
import { householdMembers } from "./householdMembers";

export const monthlyBudgets = pgTable(
  "monthly_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
  },
  (table) => [unique().on(table.householdId, table.year, table.month)],
);

export const budgetItems = pgTable(
  "budget_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    monthlyBudgetId: uuid("monthly_budget_id")
      .notNull()
      .references(() => monthlyBudgets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    // null = shared
    ownerMemberId: uuid("owner_member_id").references(() => householdMembers.id, {
      onDelete: "cascade",
    }),
    plannedAmount: numeric("planned_amount", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    unique().on(table.monthlyBudgetId, table.categoryId, table.ownerMemberId),
  ],
);
