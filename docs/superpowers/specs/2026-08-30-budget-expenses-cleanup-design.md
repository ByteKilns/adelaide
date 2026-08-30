# Budget/Expenses cleanup: dead code, fake controls, status labeling, and Expenses/Reports overlap

## Problem

A follow-up review of Budget and Expenses (after the Home/Reports redesign) found:

1. **Dead files**: `BudgetCard.tsx` and `BudgetVsActualTable.tsx` are imported nowhere, and a stale comment in `budget-status.ts` still credits them as consumers.
2. **A "fake control" pattern, repeated three times across the app** (Reports' old month-nav was the first, already fixed): Budget's `RecommendationsCard` is a permanently-disabled stub, and `ExpenseTable`'s Category/Owner/Paid-by filter buttons are permanently disabled. A control that looks clickable but never works reads as "the app is broken," not "not built yet."
3. **Misleading budget status**: `computeBudgetStatus` labels ANY spend against an unset (₨0) budget as "Over budget" in bright red, identically to a real budget genuinely exceeded. Screenshotted evidence: a household that hasn't set most category budgets sees a wall of red "Over budget" badges. The app already has the right concept elsewhere — `SafeToSpendCard` has a distinct "No budget set" neutral state — just not applied here.
4. **A label collision**: Budget's "Unallocated" tile (income − allocated budget) and Home's "Unallocated" tile (income − actual expenses, via `dashboardSummary()`) show the same label for two different formulas on two pages a user would reasonably compare.
5. **Expenses ↔ Reports overlap** (pre-existing, not introduced by the Home/Reports redesign — that work relocated Reports' already-duplicate Overview-tab content into Reports' new Expenses tab, it didn't create the duplication): Expenses page's "Overview" tab and Reports' "Expenses" tab both independently fetch and render `ExpenseTable`, `ExpenseSummaryCard` (owner pie), `ExpenseBreakdownCard` (category pie); `IncomeExpenseTrendCard` is similarly duplicated between Expenses' Overview tab and Reports' Income tab. A user can see the same "how did I spend" story in two places, each computed via independent queries.

## Scope decisions (from brainstorming)

- **Expenses' "Overview" tab is removed entirely.** Expenses page keeps its one job — find/search/manage transactions (the always-visible `ExpenseTable`). A "View full report" link near the header points to `/reports` for anyone wanting the analytics view.
- **`SpendingPaceCard`** (cumulative spend vs. even daily pace) — the one piece of Overview-tab content genuinely not duplicated elsewhere — moves into Reports' Expenses tab rather than being dropped. It already lives in `reports/components/` (previously "misfiled" since only Expenses used it; that's now simply correct).
- **Budget status**: a third state, "No budget set" (neutral/gray, not red), for `planned<=0 && actual>0`. "Over budget" is reserved for a real budget that was actually exceeded.
- **Fake controls**: `RecommendationsCard` is deleted outright (no real feature behind it, no near-term plan to build one). `ExpenseTable`'s disabled Category/Owner/Paid-by buttons are explicitly **left in place** as a visible TODO — the owner sub-tabs already cover owner-filtering, and category/paid-by filtering is planned as a real future feature, not being cut this round.
- **Label collision**: Budget's tile is renamed "Unbudgeted" (distinct wording for a distinct concept — income with no category plan yet). Home's "Unallocated" (income after actual spending) is unchanged — it correctly matches Home's at-a-glance purpose.
- Explicitly **out of scope**: `ExpenseBreakdownCard`'s existing `viewAllHref="/expenses"` link (used in Reports' Expenses tab, pointing back to the full table) is left as-is even though the full table already sits in the same tab now — a minor, separate wrinkle not part of this round's decisions. No changes to Budget's tab/edit-modal behavior (`BudgetGroups.tsx`), Savings/Income tab content, or any calculation formula other than the status-label logic itself.

## Budget changes

- Delete `src/modules/budget/components/BudgetCard.tsx` and `BudgetVsActualTable.tsx`.
- `src/modules/budget/lib/budget-status.ts`: `computeBudgetStatus(planned, actual)` gains a "No budget set" branch, checked before the existing logic:
  ```ts
  export type BudgetStatusVariant = "default" | "destructive" | "outline" | "secondary";

  export function computeBudgetStatus(planned: number, actual: number): BudgetStatus {
    if (planned <= 0 && actual > 0) {
      return { label: "No budget set", variant: "outline", pct: 100 };
    }
    const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
    if (pct >= 100) return { label: "Over budget", variant: "destructive", pct };
    if (pct >= 80) return { label: "Approaching limit", variant: "secondary", pct };
    return { label: "On track", variant: "default", pct };
  }
  ```
  (`pct: 100` for the no-budget case renders the progress bar as a full neutral-gray bar — "fully untracked" — rather than a 0% bar that would misleadingly look identical to "on track, no spend yet.")
- `src/modules/budget/components/BudgetGroupTable.tsx`: the progress-bar color mapping gains an `outline` branch (neutral gray, e.g. `bg-muted-foreground`), alongside the existing `destructive`/`secondary`/default-green branches. The stale "Shared by BudgetCard and BudgetVsActualTable" comment (now referring to two deleted files) is rewritten to describe the real remaining consumer (`BudgetGroupTable`).
- `src/modules/budget/components/BudgetSummaryCards.tsx`: the fourth stat tile's `title` changes from `"Unallocated"` to `"Unbudgeted"`. No prop/formula changes.
- Delete `src/modules/budget/components/RecommendationsCard.tsx`; remove its import and `<RecommendationsCard />` usage from `src/modules/budget/pages/BudgetPage.tsx`.

## Expenses changes

- Delete `src/modules/expenses/components/ExpensesPageTabs.tsx` and `src/modules/expenses/components/ExpenseSummaryTabs.tsx`.
- `src/modules/expenses/pages/ExpensesPage.tsx` renders `<ExpenseTable>` directly in place of `<ExpensesPageTabs>`, and drops everything that only existed to feed the removed Overview tab: `combinedIncome`, `ownerBreakdown()`/`slices`, `categoryBreakdown()`/`expenseSlices`, `monthlyIncomeExpenseTrend()`/`trendPoints`, `dailySpendingPace()`/`pacePoints`/`totalPlanned`, and the fetches that only fed those (`getIncomesForMonth`, `getBudgetItemsForMonth`, `listAllIncomes`, `listExpensesForRange`, and the `rangeStart`/`rangeEnd`/`rangeStartYm` computation). It keeps: `getHouseholdMembers`, `listCategories`, `listExpensesForMonth`, and everything `ExpenseTable`/`ExpenseHeader`/CSV export (`exportRows`) need.
- `src/modules/expenses/components/ExpenseSummaryCard.tsx`: `ExpenseSummaryContent` loses its `export` keyword — after this change its only remaining use is internal, from `ExpenseSummaryCard` in the same file.
- `src/modules/expenses/components/ExpenseHeader.tsx` gains a "View full report" link to `/reports`, styled like `ExpenseBreakdownCard`'s existing link (`ArrowUpRight` icon, `text-sm font-medium text-primary`), placed in the header's button row.

## Reports changes (receiving `SpendingPaceCard`)

- `src/modules/reports/pages/ReportsPage.tsx`: re-adds `getBudgetItemsForMonth` (from `budget/api/budget.actions`) to its data-fetch `Promise.all`, computes `totalPlanned` from the result, and computes `pacePoints` via `dailySpendingPace()` (imported from `reports/lib/reports-stats`, re-added to that import). Passes `pacePoints`/`totalPlanned` as new props to `<ReportsTabs>`.
- `src/modules/reports/components/ReportsTabs.tsx`: imports `SpendingPaceCard` and the `PacePoint` type; `Props` gains `pacePoints: PacePoint[]` and `totalPlanned: number`; the Expenses tab's grid gains `<SpendingPaceCard points={props.pacePoints} totalPlanned={props.totalPlanned} />` as a new full-width child (the component's own `lg:col-span-3` className handles the width within the existing `grid-cols-1 lg:grid-cols-3` layout), placed above the existing two-column split (table+cash-flow-chart / summary+breakdown+insight cards).

## Testing

- No new pure-function logic beyond `computeBudgetStatus`'s new branch — add unit test cases for `budget-status.test.ts` (create this file; none exists today) covering: no-budget-with-spend → "No budget set"/outline; a real budget exceeded → "Over budget"/destructive; a real budget within 80-99% → "Approaching limit"/secondary; a real budget under 80% → "On track"/default; and the existing zero-budget-zero-spend case → "On track" (unchanged).
- No other new calculations are introduced — `dailySpendingPace` is being reused as-is (already tested in `reports-stats.test.ts` — no `dailySpendingPace` changes are being made here beyond adding a second call site).
- Manual browser verification (existing Playwright setup): Budget page shows neutral "No budget set" badges instead of red for unset categories with spend, no `RecommendationsCard`, "Unbudgeted" label; Expenses page has no "Overview" tab and shows a "View full report" link; Reports' Expenses tab shows the Spending Pace chart above the existing table/cash-flow/cards layout.
