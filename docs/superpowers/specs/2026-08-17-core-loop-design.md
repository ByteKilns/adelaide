# Couple Budget Planner — V1 Slice 1: Core Loop Design

Source PRD: `couple_budget_planner_prd(1).md` (58-section full V1 spec). This document scopes the **first build slice** — a thin, end-to-end vertical of the core loop (login → set budget → log expenses → see dashboard) — and defers the rest of V1 to follow-up specs.

## 1. Goal of this slice

Get the core loop (Plan → Spend → Compare) working end-to-end for two seeded household members, deployed and usable on mobile, before layering on savings, recurring expenses, notifications, forecasting, and PWA/offline behavior.

## 2. Tech stack

- **Framework**: Next.js 15 (App Router), TypeScript
- **UI**: Tailwind CSS, shadcn/ui components, mobile-first layout with bottom navigation
- **Forms/validation**: React Hook Form + Zod
- **Database**: Supabase Postgres (connection string supplied via env var)
- **ORM**: Drizzle ORM + drizzle-kit for migrations
- **Auth**: Auth.js (NextAuth) v5, Credentials provider only, bcrypt password hashing
- **Hosting**: Vercel

No OAuth, no registration UI, no password reset UI in this slice. Two users are created by a seed script with pre-hashed passwords. The architecture must not preclude adding Auth.js OAuth providers or a registration flow later (per PRD §43).

## 3. Data model (slice 1)

Only the tables needed for the core loop. Additional PRD entities (SavingsGoal, SavingsContribution, RecurringExpense, Notification, NotificationPreference) are intentionally not created yet — they attach to `households`/`categories`/`household_members` later without requiring changes to these tables.

```
users
  id, email, password_hash, name, created_at

households
  id, name, created_at

household_members
  id, household_id (fk), user_id (fk), display_role ('me' | 'partner')
  -- exactly two rows per household in this slice

categories
  id, household_id (fk), name, group_name, budget_type ('fixed' | 'flexible'), archived (bool)

monthly_budgets
  id, household_id (fk), year, month
  unique (household_id, year, month)

budget_items
  id, monthly_budget_id (fk), category_id (fk), owner ('me' | 'partner' | 'shared'), planned_amount

incomes
  id, household_id (fk), member_id (fk), year, month, amount, note

expenses
  id, household_id (fk), amount, category_id (fk), owner_member_id (fk, nullable — null means shared),
  paid_by_member_id (fk), date, note, created_at, updated_at
```

Household-level data isolation is enforced server-side on every query: every read/write is scoped by the household the authenticated user belongs to. The household ID is never trusted from client input — it is derived server-side from the session.

## 4. Seed data

A `seed` script creates:
- One household ("Nirjal & Partner" or user-provided name)
- Two users with bcrypt-hashed passwords (values supplied via env/script args, never committed)
- Two `household_members` rows linking the users to the household with roles `me`/`partner`
- The PRD's recommended default categories (§15), grouped as listed, all `budget_type` initially `flexible` except obligations/family/household groups which default to `fixed`

## 5. Auth flow

- `/login`: email + password form → Auth.js Credentials provider verifies against `users.password_hash` (bcrypt compare) → session cookie issued
- All routes under the app shell require a valid session; unauthenticated requests redirect to `/login`
- Session carries `userId`; server code resolves `household_member` / `household_id` from that on every request — never accepted as a client parameter
- Logout clears the session

## 6. Core flows in scope

### 6.1 Monthly setup (manual)
- Income entry: separate amount fields for "my income" and "partner income" for the current year/month (PRD §9)
- Budget allocation: for each category, set a planned amount and an owner (Me/Partner/Shared) for the current month (PRD §10–11). No requirement to allocate 100% of income (PRD Rule 8).
- No "copy previous month" yet — each month's budget starts empty and is filled manually. (Deferred; PRD §39.)

### 6.2 Add/Edit/Delete Expense
- Fast entry form: Amount, Category, Owner (Me/Partner/Shared), Paid by (Me/Partner), Date (defaults to today), optional Note (PRD §14)
- Selecting Owner = Me or Partner auto-defaults Paid by to the same member; user can still override. Owner = Shared requires explicit payer selection.
- Edit and delete update the relevant month's totals immediately (PRD Rule 10, scoped to what this slice tracks: category spent, remaining budget, overall spending — forecast/notifications recalculation deferred since those features don't exist yet).

### 6.3 Dashboard
- Top-level: combined income, total expenses, unallocated amount for the current month (PRD §20, savings line omitted until Slice 2)
- Tab switch: Overview / Me / Partner / Shared (PRD §21–22), each showing income (where applicable), expenses, and remaining
- Budget cards per category: planned vs actual, percentage used, remaining amount, with a non-color-only status indicator (healthy/approaching/over) (PRD §23)
- Budget vs Actual table view (PRD §24)
- No Safe-to-Spend, spending velocity, or overspend forecast yet (Slice 2+) — these require history/data density this slice doesn't yet accumulate meaningfully.

## 7. Navigation & layout

- Mobile: bottom nav bar — Home / Expenses / Budget / More — with a persistent prominent "+ Add Expense" action (PRD §40)
- Desktop: sidebar nav, wider dashboard layout, same functionality
- "More" (mobile) / sidebar (desktop) hosts settings and category management for this slice

## 8. Explicitly deferred to later specs

- Savings & savings goals (PRD §17–18)
- Recurring expenses (PRD §19)
- Notifications: in-app, push, email, quiet hours (PRD §28–32)
- Safe-to-Spend, spending velocity, overspend forecasting (PRD §25–27, §53)
- Monthly history view, copy-previous-month (PRD §35, §39)
- Monthly summary generation (PRD §54)
- PWA installability, offline queueing/sync (PRD §41–42)
- Self-service registration, email verification, password reset (PRD §43)
- Expense search/filter beyond basic listing (PRD §34)

Each of these becomes its own brainstorm → design → plan cycle once the core loop is live and in use.

## 9. Out of scope entirely for V1 (per PRD §3)

Bank integrations, eSewa/Khalti, WhatsApp, investment/net-worth tracking, tax, crypto, multi-currency, complex debt management, multi-household, complex expense splitting/settlement — unchanged from the PRD, not addressed by any slice planned so far.
