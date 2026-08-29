# Home/Reports redesign: give each page a distinct job

## Problem

Home and Reports independently show several of the same numbers, computed
via different code paths — most seriously, `SafeToSpendCard` appears on both
pages with two different formulas (Home folds dhuku/loan cash flow into
`totalActual`, Reports doesn't), so the same day can show two different
"safe to spend" figures depending which page you're on. Reports' own
"Overview" tab is also a near-duplicate of its Expenses/Income tabs
(`ExpenseBreakdownCard`, `TopCategoriesCard`, and `IncomeExpenseTrendCard`
each render twice across tabs), confirmed visually — clicking between tabs
shows the same two charts three separate times.

Separately, Home's own usability doesn't match its purpose. A "Home" page
should answer "how am I doing right now, can I spend today" in a glance.
Today: the headline safe-to-spend number is a footer banner below a full
day-by-day bar chart; the day-by-day chart is a drill-down view (arguably
Reports' job) taking ~300px on a glance page; and the Me/Karuna/Shared
breakdown is tabbed, showing one-third of the household by default when a
2-person household would be better served seeing both people at once.

## Scope decisions (from brainstorming)

- **Home** becomes the single source of truth for Safe-to-Spend (the
  cash-flow-inclusive formula), moved to the hero position at the top.
  Reports drops its own Safe-to-Spend entirely — no more possible
  disagreement between the two pages.
- **Home** drops `DailyCashFlowChart` — it moves to Reports' Expenses tab.
  Home keeps fetching dhuku/loan data (still needed for the safe-to-spend
  calculation) even though it no longer renders the chart.
- **Home**'s Me/Karuna/Shared `TabSwitcher` is replaced with a responsive
  grid showing all owners side by side (`grid-cols-1 sm:grid-cols-3`) —
  stacked on phone widths, side-by-side from small-tablet width up. Same
  per-owner content (income/expenses/remaining/progress bar), no tabs.
- **Reports**' "Overview" tab is removed entirely. `ReportsTabs` defaults to
  the **Expenses** tab.
- Two things that only lived in Overview move into the **Expenses** tab:
  `SmartInsightCard` and the relocated `DailyCashFlowChart` (Reports gains
  its own dhuku/loan/cash-flow data fetching to feed it — this is
  independent of Home's copy, which is being removed, not shared state).
- `ExpenseSummaryCard` (the Me/Karuna/Shared expense-split pie, previously
  Overview-only) also moves into the Expenses tab's right column, next to
  `ExpenseBreakdownCard` — otherwise it would have no home once Overview is
  gone.
- `TopCategoriesCard` is dropped from the Expenses tab — it showed the same
  top-5 categories as `ExpenseBreakdownCard`'s pie+list, just as bars, with
  no new information. Since this was its only remaining call site anywhere
  in the app, the component file and its supporting `topCategories()` lib
  function + tests are deleted outright rather than left as dead code.
- `safeToSpendToday`/`daysLeftInMonth` move from `reports/lib/reports-stats.ts`
  to `dashboard/lib/` (only Dashboard will call them after this change) —
  this also fixes the existing backwards dependency where Dashboard
  imported functions out of the Reports module.
- `src/modules/reports/README.md`'s stale "Not yet built" note gets
  corrected while this module is being touched anyway.
- Explicitly **out of scope**: moving `formatNPR` to a neutral shared
  location (flagged in earlier review as a separate, smaller cleanup, not
  bundled into this IA change); Reports' non-functional month-nav control
  (separate bug, separate fix); any change to Income/Savings tab content
  beyond the tab list shrinking to 3.

## Home (`src/modules/dashboard/`)

`index.tsx` render order changes to: `DashboardHeader` → `SafeToSpendCard`
(hero) → `SummaryCards` → the owner-comparison grid + `RecentExpenses`/
`DashboardSavingsCard` two-column section. `DailyCashFlowChart` and its
`dailyPoints` computation (`dailyCashFlowPoints(...)`) are removed from this
file; `cashFlowEvents`/`netOutflow` stay (still feed `safeToSpendToday`).

`SafeToSpendCard` (`reports/components/SafeToSpendCard.tsx` — this file
doesn't move modules, just gains its only remaining caller) gets a visual
pass for hero prominence: enlarge the amount text (e.g. `text-lg` →
`text-3xl`) since it's now the single most important number on the page,
not one banner among several. No prop/shape changes — same
`daysLeft`/`monthLabel`/`safeToSpend`/`totalActual`/`totalPlanned`.

`OwnerTabs.tsx` is replaced by a new `OwnerComparison.tsx` in the same
`dashboard/components/` folder — same `OwnerView[]` prop shape, same
per-owner card content (income/expenses/remaining, progress bar, trend
lines), but rendered in a `grid grid-cols-1 gap-4 sm:grid-cols-3` of cards
instead of a `TabSwitcher`. `TabSwitcher`/`TabsContent` imports and the
per-tab wrapping go away; each owner's block becomes a self-contained
`<Card>`-style block within the grid.

## Reports (`src/modules/reports/`)

`ReportsTabs.tsx`: `Tab` type drops `"overview"` (becomes
`"expenses" | "income" | "savings"`), default `useState` value becomes
`"expenses"`, and the tab list drops the "Overview" entry. The
`tab === "overview"` block is deleted. The `tab === "expenses"` block
becomes:

```tsx
{tab === "expenses" && (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div className="space-y-6 lg:col-span-2">
      <ExpenseTable ... />
      <DailyCashFlowChart dateFormat={props.dateFormat} monthLabel={props.monthLabel} points={props.dailyPoints} />
    </div>
    <div className="space-y-6">
      <ExpenseSummaryCard pctOfIncome={props.pctOfIncome} slices={props.ownerSlices} total={props.totalExpenses} />
      <ExpenseBreakdownCard slices={props.expenseSlices} total={props.totalExpenses} viewAllHref="/expenses" />
      <SmartInsightCard message={props.insightMessage} />
    </div>
  </div>
)}
```

`ReportsTabs`' `Props` type: removes `daysLeft`, `safeToSpend`,
`totalPlanned`, `topCategories`; adds `dailyPoints: DayPoint[]` (imported
type from `dashboard/lib/cash-flow`). `insightMessage`/`ownerSlices`/
`pctOfIncome` props are unchanged in shape, just consumed by the Expenses
block instead of the Overview block.

`ReportsPage.tsx`:
- Adds `listDhukuEntries` (from `modules/dhuku/api/dhuku.actions`),
  `listLoans`/`listLoanPayments` (from `modules/loans/api/loans.actions`)
  to the existing `Promise.all` data-fetch block.
- Computes `cashFlowEvents` (`dhukuCashFlow(...)` + `loanPaymentCashFlow(...)`)
  and `dailyPoints` (`dailyCashFlowPoints(...)`) the same way `dashboard/index.tsx`
  currently does — this is intentionally a second, independent call site of
  the same pure `dashboard/lib/cash-flow.ts` functions, not shared state,
  since Reports and Home now show this data in different contexts (Reports:
  a drill-down chart; Home: an input to its safe-to-spend number, no
  chart).
- Removes `safeToSpendToday`/`daysLeftInMonth` calls and the `safeToSpend`/
  `daysLeft` values passed to `ReportsTabs` (now imported from
  `dashboard/lib/` if ReportsPage needs them for anything else — it
  doesn't, once `SafeToSpendCard` is gone from Reports, so these calls are
  deleted outright, not just re-imported).
- Removes the `topCategories(...)` call and `topCats` value/prop.
- Passes `dailyPoints` to `ReportsTabs` instead of `daysLeft`/`safeToSpend`/
  `totalPlanned`.

`src/modules/expenses/components/TopCategoriesCard.tsx` — deleted.
`src/modules/expenses/lib/expense-breakdown.ts`'s `topCategories()`
function — deleted, along with its test cases in
`expense-breakdown.test.ts` (the file itself stays, since `ownerBreakdown`/
`categoryBreakdown`-adjacent functions there are still used).

## Shared lib move

`safeToSpendToday` and `daysLeftInMonth` move from
`src/modules/reports/lib/reports-stats.ts` to
`src/modules/dashboard/lib/cash-flow.ts` (they operate on the same
month/cash-flow domain already owned by that file). Their existing test
cases move from `reports-stats.test.ts` to `cash-flow.test.ts`.
`dashboard/index.tsx`'s import changes from
`@/modules/reports/lib/reports-stats` to a same-module import.

## Testing

- Moved `safeToSpendToday`/`daysLeftInMonth` tests carry over unchanged
  (pure function relocation, no behavior change) — just moved files/import
  paths.
- Deleted `topCategories` tests are removed, not carried over (the function
  is gone).
- No new unit-testable logic is introduced by this change — it's
  component composition/relocation, not new calculations. Manual browser
  verification (via the Playwright setup) covers the rest: Home shows the
  hero Safe-to-Spend + side-by-side owners + no daily chart; Reports opens
  to Expenses by default with the relocated chart/insight/owner-pie and no
  Overview tab.
