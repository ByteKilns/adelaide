# Dhuku (rotating savings group) feature

## Problem

The user (and partner) participate in multiple "dhuku" groups — informal
rotating savings pools common in Nepali communities (a ROSCA). Each month
every member of a fixed-size group contributes a fixed amount; one member
takes the full pot. Once you've taken your payout, you keep contributing
the same monthly amount plus a fixed extra "interest" amount for the
remaining months of the cycle. There's currently nowhere in the app to
track this — it's not a loan (multi-party, cyclical, no counterparty) and
not a savings goal (no target amount, fixed monthly cadence with a defined
end).

## Scope decisions (from brainstorming)

- Participants other than the user are **not tracked** — no per-person
  ledger, no linking to household members as "the other 12 people". The
  user only records their own contributions/payout per dhuku.
- New standalone feature + nav item, same tier as Loans/Savings Goals —
  not folded into Loans or Recurring.
- Interest (once you've taken your payout) is a **fixed extra amount per
  month**, not a percentage — entered directly, no rate math.
- Detail is logged **per month** (a running entry log), not just
  high-level parameters with computed-only state — mirrors
  `loans`/`loan_payments`.
- Due-soon notifications, same pattern as loans/recurring installments.

## Data model

`src/db/schema/dhukus.ts`:

```ts
export const dhukuEntryTypeEnum = pgEnum("dhuku_entry_type", ["contribution", "payout"]);

export const dhukus = pgTable("dhukus", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  // null = shared/joint, same convention as loans.ownerMemberId
  ownerMemberId: uuid("owner_member_id").references(() => householdMembers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalMembers: integer("total_members").notNull(), // cycle length in months
  monthlyContribution: numeric("monthly_contribution", { precision: 12, scale: 2 }).notNull(),
  interestPerMonth: numeric("interest_per_month", { precision: 12, scale: 2 }), // extra owed/month after payout taken
  startDate: date("start_date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dhukuEntries = pgTable("dhuku_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  dhukuId: uuid("dhuku_id").notNull().references(() => dhukus.id, { onDelete: "cascade" }),
  type: dhukuEntryTypeEnum("type").notNull(),
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Whether a dhuku has been "taken" is derived from entries (a `type: "payout"`
row exists), not a stored flag — one source of truth.

Add `dhukus`/`dhukuEntries` to `src/db/schema/index.ts` re-exports and to
the drizzle relations alongside `loans`/`loanPayments`. New drizzle
migration generated via `npm run db:generate`.

## Module layout (mirrors `src/modules/loans/`)

```
src/modules/dhuku/
  index.tsx                    # exports DhukuPage
  pages/DhukuPage.tsx
  components/
    DhukuCard.tsx               # progress ("month 5 of 13"), taken-status, total contributed
    DhukuForm.tsx                # create/edit a dhuku's terms
    DhukuEntryForm.tsx           # log a month's entry (contribution or payout)
    DhukuManager.tsx             # client shell: list + add/edit dialogs, mirrors LoansManager
  lib/
    dhuku-stats.ts               # pure calculation helpers (see below) + tests
  schemas/
    dhuku.schema.ts              # dhukuSchema, dhukuEntrySchema (zod)
  api/
    dhuku.actions.ts             # CRUD server actions + queries

src/app/(app)/dhuku/page.tsx     # export { DhukuPage as default } from "@/modules/dhuku";
```

## Calculation helpers (`dhuku-stats.ts`)

Pure functions, unit-tested like `loan-stats.ts`:

- `monthsElapsed(startDate, totalMembers, today)` → clamped `[0, totalMembers]`
- `hasTakenPayout(entries)` → `boolean` (any `type: "payout"` entry)
- `expectedNextAmount(dhuku, entries)` → `monthlyContribution`, plus
  `interestPerMonth` if `hasTakenPayout`. Used as a prefill in
  `DhukuEntryForm`, not enforced.
- `totalContributed(entries)` → sum of `contribution` entries
- `cycleStatus(dhuku, today)` → `"active" | "completed"`
- `buildDhukuCards(...)` → view-model shaping, same role as `buildLoanCards`

## Nav

Add to `NAV_ITEMS` in `src/components/nav/SidebarNav.tsx` (and the
equivalent bottom-nav list if separate): label "Dhuku", route `/dhuku`,
icon `Users` (lucide-react) — placed after Loans.

## Notifications

Extend `src/modules/notifications/api/notifications.actions.ts` with a
dhuku due-soon check, same shape as the existing loan-installment and
recurring-expense checks: for each active dhuku, compute the expected date
of the next unlogged month's entry (start date + months-already-logged);
if it's within the existing due-soon window and no entry exists yet for
that month, surface a notification.

## Non-goals

- No tracking of other participants, no group-wide ledger.
- No percentage-based interest.
- No automatic entry creation — user logs each month manually (with a
  prefilled expected amount).

## Testing

- `dhuku-stats.test.ts` covering `monthsElapsed`, `hasTakenPayout`,
  `expectedNextAmount` (pre- and post-payout), `cycleStatus`.
- `npx tsc --noEmit` and `npm run build` as the completion gate (also
  enforced by the pre-commit hook).
