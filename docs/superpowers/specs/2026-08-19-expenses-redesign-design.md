# Expenses page redesign

## Problem

The Expenses page today is a bare title + "Add Expense" button + a flat
list of rows (category name, "owner · date · note", amount, inline
Edit/Delete). The user supplied a reference mockup with a much richer
layout: month nav, owner tabs, a filter bar, a data table with avatars and
a row-actions menu, a row count, and a right-hand sidebar with an expense
summary donut chart, a top-categories breakdown, and a "safe to spend"
widget.

## Scope (agreed during brainstorming)

- **Visual redesign, not a full functional rebuild.** Owner tabs (already
  buildable from data the page already fetches) are real. Search, date
  range, category/owner/paid-by filter dropdowns, month navigation, and
  Export are rendered as visually-present but disabled placeholders —
  building their backing logic is explicitly out of scope for this pass.
- **No fake pagination.** The mockup's numbered page buttons imply
  pagination that doesn't exist; rendering clickable-looking page numbers
  that do nothing would be misleading. Replaced with an honest
  "Showing all N expenses this month" count line.
- **Expense Summary and Top Categories are real**, computed from the
  month's actual expense data (already fetched) plus one new income fetch
  (for the "% of income" figure).
- **Safe to Spend Today is `ComingSoonCard`.** The dashboard already
  treats this exact feature as unbuilt (`Financial Health — coming soon`);
  this redesign keeps that decision consistent rather than quietly
  building budget-pacing logic as a side effect of a visual pass.
- **New dependencies**: `recharts` (donut chart), and two new shadcn
  primitives (`dropdown-menu`, `avatar`) — already installed/added during
  brainstorming.
- **No schema change.** The mockup's bold "Description" line (e.g.
  "Bhatbhateni") implies a title field the `expenses` table doesn't have.
  Per the agreed resolution, the table's category column shows the
  category name (bold) with the optional `note` as a subtitle — and the
  mockup's separate Description/Category columns are merged into one,
  since showing category name twice would be pointless duplication once
  there's no separate title field to fill the other column.
- **Owner/paid-by color coding**: simplified from the mockup's likely
  per-widget-inconsistent colors to one fixed rule used everywhere in this
  redesign — the real/current member is `green`, the partner is `orange`,
  `Shared` uses the existing `Tone` system's `blue` (the palette's only
  neutral-leaning option — there is no "gray" `Tone`) and a generic person
  icon instead of an initial, on a muted background rather than a tinted
  one. This is a design simplification, not a pixel-match to the
  screenshot.

## Component/file plan

```
src/modules/expenses/
  index.tsx                     <- barrel: re-exports the 3 page components
  pages/
    ExpensesPage.tsx             <- moved out of index.tsx (was already
                                     planned separately; bundled in here
                                     since this redesign substantially
                                     grows this component anyway)
    NewExpensePage.tsx
    EditExpensePage.tsx
  components/
    ExpenseForm.tsx               (unchanged)
    ExpenseHeader.tsx              (new) title/subtitle + disabled month-nav
                                     + disabled Export + real "Add Expense"
    ExpenseFilters.tsx              (new) search/date-range/category/owner/
                                     paid-by/clear-filters, all disabled
    ExpenseTable.tsx                 (new, "use client") owner tabs +
                                     table + row actions dropdown + count
                                     line. Replaces ExpenseListItem.
    OwnerAvatar.tsx                   (new) colored-initial / gray-icon
                                     avatar, shared by the table and the
                                     summary card's legend
    ExpenseSummaryCard.tsx             (new) donut chart + total + % of
                                     income + legend
    TopCategoriesCard.tsx               (new) top-5 categories, proportional
                                     bars
  lib/
    expense-breakdown.ts                (new) pure calculation functions
    expense-breakdown.test.ts            (new)
    member-tone.ts                        (new) real/partner/shared -> Tone
  api/
    expenses.actions.ts (unchanged)
  schemas/
    expense.schema.ts (unchanged)
```

`ExpenseListItem.tsx` is deleted — `ExpenseTable` fully replaces it and
nothing else imports it.

## Data flow

`ExpensesPage` (Server Component) fetches, in parallel: household
members, categories, this month's expenses (existing), and — newly —
this month's incomes (`getIncomesForMonth` from
`@/modules/budget/api/budget.actions`, the same cross-module import
pattern the dashboard already uses). It computes:

- `ownerBreakdown(expenses, members, realMemberId)` → `{ label, amount,
  tone }[]` for the donut + legend (Shared / Me / Partner)
- `topCategories(expenses, categories, 5)` → top 5 by spend, each with a
  bar width relative to the largest of the five
- `totalExpenses` and `pctOfIncome(totalExpenses, combinedIncome)`,
  reusing the existing helper from `@/modules/dashboard/lib/format`
  rather than re-implementing the same formula a third time

It renders a `max-w-7xl` two-column grid (same pattern as the dashboard):
left column (`lg:col-span-2`) holds `ExpenseHeader`, `ExpenseFilters`,
`ExpenseTable`; right column holds `ExpenseSummaryCard`,
`TopCategoriesCard`, `ComingSoonCard` ("Safe to Spend Today").

`ExpenseTable` receives the full row list (already shaped with owner
label, paid-by label, category name/group, amount, date, note) and does
owner-tab filtering client-side — no new fetch, since the whole month's
data is already on the page.

## Testing

`expense-breakdown.ts` is pure and gets unit tests in
`expense-breakdown.test.ts`, following the same pattern as
`modules/budget/lib/calculations.test.ts`: verify `ownerBreakdown` sums
correctly across shared/me/partner including zero-expense cases, and
`topCategories` sorts descending, caps at the limit, and computes bar
widths relative to the top category.

## Risks

- Cross-module import direction: `expenses` now imports from both
  `budget` (income) and `dashboard` (format helpers). This continues the
  precedent already set by the dashboard module importing from
  `budget`/`expenses`/`categories` — modules borrowing each other's
  domain logic is an accepted pattern here, not a new violation.
- Deleting `ExpenseListItem.tsx` is safe only if nothing else references
  it — confirmed via `grep` before deletion during implementation.
