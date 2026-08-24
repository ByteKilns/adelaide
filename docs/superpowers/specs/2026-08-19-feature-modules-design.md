# Feature-module architecture

## Problem

All feature code currently lives under one flat `src/components/` and a flat
`src/lib/` (actions, calculations, data all split by *kind* rather than by
*feature*). There's no boundary between "shared across the app" and
"belongs to the Expenses page" — everything is reachable from everywhere,
and it's not obvious from the folder structure which sidebar feature owns
which file.

## Goals

- Each sidebar item (Home/Dashboard, Expenses, Budget, Recurring, Savings
  Goals, Reports, Categories, Notifications, Settings) becomes its own
  self-contained module: components, lib, constants, schemas (form
  validation), hooks, and api (server actions / data access) all live
  together under one folder.
- `src/app/**/page.tsx` files become thin route wiring: they import a
  module's entry file and render it. All fetching/rendering logic for a
  route lives in the module, not in `app/`.
- `src/components/` is reserved for components genuinely shared by more
  than one module (shadcn UI primitives, the sidebar/bottom-nav shell).
- Modules may import from other modules' `api`/`lib` when they need another
  feature's domain data (e.g. Dashboard reads Expenses' `listRecentExpenses`
  and Categories' `listCategories`). This is allowed and expected — it's
  not a layering violation, since the alternative (duplicating the query)
  is worse.
- Session/auth/viewing-as stay in shared `src/lib/` — they aren't owned by
  any one sidebar item.

## Non-goals

- No behavior change. This is a structural move: file relocations, import
  rewrites, and splitting a few files (e.g. pulling an inline zod schema
  out of an actions file into its own `schemas/` file). No component's
  rendered output or server action's logic changes.
- Not building out Recurring/Savings Goals/Reports/Notifications/Settings
  features. Their modules are scaffolded (empty subfolders) but get no
  `index.tsx` and no route wiring, since there's nothing to render yet.

## Target layout

```
src/
  modules/
    dashboard/
      index.tsx              # DashboardPage (Server Component) — current dashboard/page.tsx body
      components/             # SummaryCards, OwnerTabs, DashboardHeader, DashboardPanel, ComingSoonCard, ToneIcon, RecentExpenses
      lib/                     # format.ts, map-rows.ts, owner-label.ts
      constants/
      schemas/
      hooks/
      api/
    expenses/
      index.tsx               # exports ExpensesPage, NewExpensePage, EditExpensePage
      components/              # ExpenseForm, ExpenseListItem
      lib/
      constants/
      schemas/                  # expenseSchema (extracted from lib/actions/expenses.ts)
      hooks/
      api/                       # actions.ts: createExpenseAction, updateExpenseAction, deleteExpenseAction, listExpensesForMonth, listRecentExpenses
    budget/
      index.tsx                 # BudgetPage
      components/                # IncomeForm, BudgetItemRow, BudgetCard, BudgetVsActualTable
      lib/                        # budget-status.ts, calculations/budget.ts (+ its test)
      constants/
      schemas/                     # income/budget-item schemas (extracted from actions files)
      hooks/
      api/                          # actions.ts: budget + income server actions
    categories/
      components/
      lib/
      constants/
      schemas/
      hooks/
      api/                          # categories.ts: listCategories (moved from lib/data/categories.ts)
    recurring/
    savings-goals/
    reports/
    notifications/
    settings/
      components/  lib/  constants/  schemas/  hooks/  api/   # empty scaffolds, no index.tsx

  components/                  # truly shared only
    ui/                          # unchanged: shadcn primitives
    nav/                          # sidebar_nav, bottom_nav, viewing_as_switcher

  lib/                         # cross-cutting infra, not feature-owned
    session.ts
    viewing-as-cookie.ts
    utils.ts
    format-date.ts
    actions/
      auth.ts
      viewing-as.ts

  app/
    (app)/
      dashboard/page.tsx        # export { DashboardPage as default } from "@/modules/dashboard";
      expenses/page.tsx          # export { ExpensesPage as default } from "@/modules/expenses";
      expenses/new/page.tsx       # export { NewExpensePage as default } from "@/modules/expenses";
      expenses/[id]/edit/page.tsx  # export { EditExpensePage as default } from "@/modules/expenses";
      budget/page.tsx              # export { BudgetPage as default } from "@/modules/budget";
      layout.tsx                   # unchanged, uses shared components/nav
```

## File-by-file moves

**Dashboard module** (from `src/app/(app)/dashboard/page.tsx` and
`src/components/dashboard/*` and `src/lib/dashboard/*`):
- `dashboard/page.tsx` body → `modules/dashboard/index.tsx`, exported as
  `DashboardPage`
- `components/dashboard/summary_cards.tsx` → `modules/dashboard/components/summary_cards.tsx`
- `components/dashboard/owner_tabs.tsx` → `modules/dashboard/components/owner_tabs.tsx`
- `components/dashboard/dashboard_header.tsx` → `modules/dashboard/components/dashboard_header.tsx`
- `components/dashboard/dashboard_panel.tsx` → `modules/dashboard/components/dashboard_panel.tsx`
- `components/dashboard/coming_soon_card.tsx` → `modules/dashboard/components/coming_soon_card.tsx`
- `components/dashboard/tone_icon.tsx` → `modules/dashboard/components/tone_icon.tsx`
- `lib/dashboard/format.ts` → `modules/dashboard/lib/format.ts`
- `lib/dashboard/map-rows.ts` → `modules/dashboard/lib/map-rows.ts`
- `lib/dashboard/owner-label.ts` → `modules/dashboard/lib/owner-label.ts`
- `lib/category-icons.tsx` is used by `budget_card.tsx` and
  `recent_expenses.tsx` (a dashboard component) — not dashboard-owned, so
  it moves to `modules/categories/lib/category-icons.tsx` instead (see
  Categories module below).

**Expenses module**:
- 3 page bodies → `modules/expenses/index.tsx`, exported as
  `ExpensesPage`, `NewExpensePage`, `EditExpensePage`
- `components/expenses/expense_form.tsx`, `expense_list_item.tsx` →
  `modules/expenses/components/`
- `components/expenses/recent_expenses.tsx` → `modules/dashboard/components/recent_expenses.tsx`
  (it's presentational — takes already-shaped rows as props — and its only
  consumer is the dashboard page, despite living under `expenses/` today)
- `lib/actions/expenses.ts` → split into `modules/expenses/api/actions.ts`
  (server actions + queries) and `modules/expenses/schemas/expense.ts`
  (the `expenseSchema` zod object)

**Budget module**:
- `budget/page.tsx` body → `modules/budget/index.tsx`, exported as
  `BudgetPage`
- `components/budget/income_form.tsx`, `budget_item_row.tsx`,
  `budget_card.tsx`, `budget_vs_actual_table.tsx` → `modules/budget/components/`
- `lib/budget-status.ts` → `modules/budget/lib/budget-status.ts`
- `lib/calculations/budget.ts` (+ `budget.test.ts`) → `modules/budget/lib/calculations.ts`
  (+ test)
- `lib/actions/budget.ts`, `lib/actions/income.ts` → `modules/budget/api/actions.ts`,
  schemas extracted to `modules/budget/schemas/`

**Categories module**:
- `lib/data/categories.ts` → `modules/categories/api/categories.ts`
- `lib/category-icons.tsx` → `modules/categories/lib/category-icons.tsx` (see
  note above — confirm no dashboard-only usage first)

**Stays in shared `src/lib/`**: `session.ts`, `viewing-as-cookie.ts`,
`utils.ts`, `format-date.ts`, `lib/actions/auth.ts`, `lib/actions/viewing-as.ts`.

**Stays in shared `src/components/`**: everything under `ui/`, and
`nav/sidebar_nav.tsx`, `nav/bottom_nav.tsx`, `nav/viewing_as_switcher.tsx`.

## Cross-module imports (expected, not a smell)

- `modules/dashboard/index.tsx` imports `listCategories` from
  `@/modules/categories/api/categories`, and `listRecentExpenses` from
  `@/modules/expenses/api/actions`.
- `modules/budget/index.tsx` and `modules/expenses/index.tsx` both import
  `listCategories` from `@/modules/categories/api/categories`.
- `modules/budget/components/budget_card.tsx` imports category icon lookup
  from `@/modules/categories/lib/category-icons`.

## Testing

- `budget.test.ts` moves with `calculations.ts` into
  `modules/budget/lib/`; no test content changes, just the import path for
  the module under test.
- After the move, run `npx tsc --noEmit` and the existing test suite to
  confirm nothing broke — this is a pure relocation, so any red output
  means an import was missed, not a logic bug.

## Risks

- Import-path churn touches nearly every file in `src/app` and
  `src/components`; the main risk is a missed/stale import. Mitigated by
  running `tsc --noEmit` as the completion gate, same as the earlier
  snake_case rename.
- `category-icons.tsx` and a couple of dashboard `lib/` files are used
  from more than one place — this doc's call-site notes were confirmed by
  grep as of 2026-08-19; re-check before moving if the implementation
  session happens later, since usage may have shifted since.
