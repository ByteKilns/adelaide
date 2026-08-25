import { date, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { householdMembers } from "./householdMembers";
import { households } from "./households";

export const loanDirectionEnum = pgEnum("loan_direction", ["given", "taken"]);
export const loanInstallmentFrequencyEnum = pgEnum("loan_installment_frequency", ["weekly", "monthly"]);

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  // null = shared/joint
  ownerMemberId: uuid("owner_member_id").references(() => householdMembers.id, {
    onDelete: "cascade",
  }),
  // "given" = we lent this out (an asset — they owe us); "taken" = we
  // borrowed this (a liability — we owe them).
  direction: loanDirectionEnum("direction").notNull(),
  counterpartyName: text("counterparty_name").notNull(),
  principalAmount: numeric("principal_amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  dueDate: date("due_date"),
  // Optional repayment plan — all three are null together (no plan) or all
  // set together. When set, nextInstallmentDate advances by
  // installmentFrequency each time a payment is recorded, and drives the
  // "due soon" notification in notifications.actions.ts, same as
  // recurringExpenses.nextDueDate does for bills.
  installmentAmount: numeric("installment_amount", { precision: 12, scale: 2 }),
  installmentFrequency: loanInstallmentFrequencyEnum("installment_frequency"),
  nextInstallmentDate: date("next_installment_date"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loanPayments = pgTable("loan_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => householdMembers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
