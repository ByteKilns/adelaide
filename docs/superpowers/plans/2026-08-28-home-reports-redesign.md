# Home/Reports Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Home and Reports each a distinct job — Home becomes a fast, non-tabbed "how am I doing right now" glance page with a single canonical Safe-to-Spend number; Reports becomes the tabbed drill-down page, with its redundant Overview tab removed.

**Architecture:** No schema or data-model changes — this is component composition/relocation plus two small pure-function relocations (`safeToSpendToday`/`daysLeftInMonth` move from `reports/lib/` to `dashboard/lib/`, since only Dashboard uses them once Reports/Expenses drop their own copies). Work proceeds in dependency order: relocate shared functions first (so every later task builds on a stable base), delete dead code next, then remove the three divergent Safe-to-Spend copies down to one, then restructure Reports' tabs, then restyle/restructure Home.

**Tech Stack:** Next.js (App Router, Server Components), React 19, Tailwind v4, Recharts, Vitest.

Full design: `docs/superpowers/specs/2026-08-28-home-reports-redesign-design.md`

---

### Task 1: Relocate `safeToSpendToday`/`daysLeftInMonth` to `dashboard/lib/cash-flow.ts`

**Files:**
- Modify: `src/modules/dashboard/lib/cash-flow.ts`
- Test: `src/modules/dashboard/lib/cash-flow.test.ts`
- Modify: `src/modules/reports/lib/reports-stats.ts`
- Modify: `src/modules/dashboard/index.tsx`
- Modify: `src/modules/reports/pages/ReportsPage.tsx`
- Modify: `src/modules/expenses/pages/ExpensesPage.tsx`

These two functions currently have **zero test coverage** (there is no `reports-stats.test.ts` — confirmed by search). This task adds tests for the first time as part of the move, covering the deterministic "not the current month" branch (the "is this actually today" branch can't be tested without mocking the real clock, which neither function supports — that's presumably why it was never tested before; out of scope here).

- [ ] **Step 1: Write the failing tests**

Add to the end of `src/modules/dashboard/lib/cash-flow.test.ts` (after the existing `netMonthlyOutflow` describe block):

```ts
describe("daysLeftInMonth", () => {
  it("returns the full day count for a month that isn't the current one", () => {
    expect(daysLeftInMonth(2020, 2, "english")).toBe(29); // Feb 2020 is a leap year
  });

  it("returns the full day count for a 30-day past month", () => {
    expect(daysLeftInMonth(2020, 4, "english")).toBe(30);
  });
});

describe("safeToSpendToday", () => {
  it("divides remaining budget by the full day count for a past month", () => {
    expect(safeToSpendToday(3000, 1000, 2020, 4, "english")).toBe(Math.round(2000 / 30));
  });

  it("clamps to 0 when already over budget", () => {
    expect(safeToSpendToday(1000, 5000, 2020, 4, "english")).toBe(0);
  });
});
```

Update the import at the top of the same file to include the two new names:

```ts
import {
  type CashFlowEvent,
  dailyCashFlowPoints,
  daysLeftInMonth,
  dhukuCashFlow,
  loanPaymentCashFlow,
  netMonthlyOutflow,
  safeToSpendToday,
} from "./cash-flow";
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/modules/dashboard/lib/cash-flow.test.ts`
Expected: FAIL — `daysLeftInMonth`/`safeToSpendToday` are not exported by `./cash-flow` yet.

- [ ] **Step 3: Move the functions into `cash-flow.ts`**

Change the import at the top of `src/modules/dashboard/lib/cash-flow.ts` from:

```ts
import { dayNumberInPeriod, resolvePeriod } from "@/lib/month-period";
```

to:

```ts
import { currentPeriodYearMonth, dayNumberInPeriod, daysElapsedInPeriod, resolvePeriod } from "@/lib/month-period";
```

Append these two functions to the end of the file (after `netMonthlyOutflow`), copied verbatim from their current location in `reports-stats.ts`:

```ts

// (Remaining budget for the month) / (days left, inclusive of today) — a
// simple daily spending allowance, not a forecast. Clamped at 0 so an
// already-overspent month shows "NPR 0" instead of a negative number.
export function safeToSpendToday(
  totalPlanned: number,
  totalActual: number,
  year: number,
  month: number,
  dateFormat: DateFormat,
): number {
  const period = resolvePeriod(year, month, dateFormat);
  const current = currentPeriodYearMonth(dateFormat);
  const isCurrent = year === current.year && month === current.month;
  const daysLeft = isCurrent
    ? Math.max(1, period.daysInPeriod - daysElapsedInPeriod(period) + 1)
    : period.daysInPeriod;
  const remaining = totalPlanned - totalActual;
  return Math.max(0, Math.round(remaining / daysLeft));
}

export function daysLeftInMonth(year: number, month: number, dateFormat: DateFormat): number {
  const period = resolvePeriod(year, month, dateFormat);
  const current = currentPeriodYearMonth(dateFormat);
  if (year !== current.year || month !== current.month) return period.daysInPeriod;
  return Math.max(0, period.daysInPeriod - daysElapsedInPeriod(period) + 1);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/modules/dashboard/lib/cash-flow.test.ts`
Expected: PASS, 10 tests (6 existing + 4 new).

- [ ] **Step 5: Remove the two functions from `reports-stats.ts`**

In `src/modules/reports/lib/reports-stats.ts`, delete the `safeToSpendToday` function (lines 66-84, including its leading comment) and the `daysLeftInMonth` function (lines 127-132). Leave `trendPct`, `categoryBreakdown`, `monthlyIncomeExpenseTrend`, `dailySpendingPace`, and `spendingInsight` untouched — they're still used elsewhere.

- [ ] **Step 6: Fix the three call sites' imports**

`src/modules/dashboard/index.tsx` — merge the two names into the existing `dashboard/lib/cash-flow` import (currently `import { dailyCashFlowPoints, dhukuCashFlow, loanPaymentCashFlow, netMonthlyOutflow } from "@/modules/dashboard/lib/cash-flow";`) and delete the now-empty `reports-stats` import line entirely:

```ts
import { dailyCashFlowPoints, daysLeftInMonth, dhukuCashFlow, loanPaymentCashFlow, netMonthlyOutflow, safeToSpendToday } from "@/modules/dashboard/lib/cash-flow";
```

Delete this line entirely (it becomes unused):

```ts
import { daysLeftInMonth, safeToSpendToday } from "@/modules/reports/lib/reports-stats";
```

`src/modules/reports/pages/ReportsPage.tsx` — change:

```ts
import { categoryBreakdown, daysLeftInMonth, monthlyIncomeExpenseTrend, safeToSpendToday, spendingInsight } from "@/modules/reports/lib/reports-stats";
```

to:

```ts
import { daysLeftInMonth, safeToSpendToday } from "@/modules/dashboard/lib/cash-flow";
```

placed alphabetically among the existing `@/modules/...` import block (right after `@/modules/categories/api/categories`, before `@/modules/dashboard/lib/format`), and:

```ts
import { categoryBreakdown, monthlyIncomeExpenseTrend, spendingInsight } from "@/modules/reports/lib/reports-stats";
```

in its original position. (This file's `safeToSpendToday`/`daysLeftInMonth` usage is fully removed in Task 5 — this step only fixes the import path so the file keeps compiling in the meantime.)

`src/modules/expenses/pages/ExpensesPage.tsx` — change:

```ts
import {
  categoryBreakdown,
  dailySpendingPace,
  daysLeftInMonth,
  monthlyIncomeExpenseTrend,
  safeToSpendToday,
} from "@/modules/reports/lib/reports-stats";
```

to:

```ts
import { daysLeftInMonth, safeToSpendToday } from "@/modules/dashboard/lib/cash-flow";
```

placed alphabetically (right after `@/modules/categories/api/categories`, before `@/modules/dashboard/lib/format`), and:

```ts
import { categoryBreakdown, dailySpendingPace, monthlyIncomeExpenseTrend } from "@/modules/reports/lib/reports-stats";
```

in its original position. (This file's `safeToSpendToday`/`daysLeftInMonth`/`SafeToSpendCard` usage is fully removed in Task 3 — this step only fixes the import path.)

- [ ] **Step 7: Verify everything compiles and all tests still pass**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all tests pass (74 existing + 4 new = 78... actual count may differ slightly if the suite has grown since; the point is zero failures).

- [ ] **Step 8: Commit**

```bash
git add src/modules/dashboard/lib/cash-flow.ts src/modules/dashboard/lib/cash-flow.test.ts src/modules/reports/lib/reports-stats.ts src/modules/dashboard/index.tsx src/modules/reports/pages/ReportsPage.tsx src/modules/expenses/pages/ExpensesPage.tsx
git commit -m "refactor: move safeToSpendToday/daysLeftInMonth into dashboard/lib"
```

---

### Task 2: Delete `TopCategoriesCard` and its `topCategories()` lib function

**Files:**
- Delete: `src/modules/expenses/components/TopCategoriesCard.tsx`
- Modify: `src/modules/expenses/lib/expense-breakdown.ts`
- Modify: `src/modules/expenses/lib/expense-breakdown.test.ts`
- Modify: `src/modules/reports/components/ReportsTabs.tsx`
- Modify: `src/modules/reports/pages/ReportsPage.tsx`

`TopCategoriesCard` renders the same top-5 categories `ExpenseBreakdownCard` already shows as a pie+list, just as plain bars — no new information. It currently renders in both Reports' Overview and Expenses tabs (confirmed: grep shows no other call sites anywhere in the app). Deleting it now, before the tab restructure in Task 4, keeps that later task's diff focused on tab structure rather than mixing in this cleanup.

- [ ] **Step 1: Delete the component file**

Delete `src/modules/expenses/components/TopCategoriesCard.tsx`.

- [ ] **Step 2: Remove `topCategories()` from `expense-breakdown.ts`**

In `src/modules/expenses/lib/expense-breakdown.ts`, delete the `TopCategory` type and the `topCategories` function (everything from `export type TopCategory = ...` to the end of the file). The file should end with the closing brace of `ownerBreakdown` — `OwnerSlice`/`ownerBreakdown` are still used elsewhere and stay.

- [ ] **Step 3: Remove its tests**

In `src/modules/expenses/lib/expense-breakdown.test.ts`, delete the entire `describe("topCategories", ...)` block (all three of its `it` cases), and change the top import from:

```ts
import { ownerBreakdown, topCategories } from "./expense-breakdown";
```

to:

```ts
import { ownerBreakdown } from "./expense-breakdown";
```

- [ ] **Step 4: Remove its usage from `ReportsTabs.tsx`**

In `src/modules/reports/components/ReportsTabs.tsx`:
- Delete the import line `import { TopCategoriesCard } from "@/modules/expenses/components/TopCategoriesCard";`.
- Delete the `topCategories: (TopCategory & { groupName: string })[];` line from the `Props` type, and delete the now-unused `TopCategory` import from `import type { OwnerSlice, TopCategory } from "@/modules/expenses/lib/expense-breakdown";` (becomes `import type { OwnerSlice } from "@/modules/expenses/lib/expense-breakdown";`).
- Delete both `<TopCategoriesCard categories={props.topCategories} />` lines (one in the `tab === "overview"` block, one in the `tab === "expenses"` block).

- [ ] **Step 5: Remove its usage from `ReportsPage.tsx`**

In `src/modules/reports/pages/ReportsPage.tsx`:
- Delete `topCategories` from the import `import { ownerBreakdown, topCategories } from "@/modules/expenses/lib/expense-breakdown";` (becomes `import { ownerBreakdown } from "@/modules/expenses/lib/expense-breakdown";`).
- Delete the `topCats` computation:

```ts
  const topCats = topCategories(expenses, categories, 5).map((c) => ({
    ...c,
    groupName: category(c.categoryId)?.groupName ?? "",
  }));
```

- Delete the `topCategories={topCats}` prop from the `<ReportsTabs ... />` call.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all tests pass (3 fewer than before — the deleted `topCategories` tests).

- [ ] **Step 7: Commit**

```bash
git add -A -- src/modules/expenses/components/TopCategoriesCard.tsx src/modules/expenses/lib/expense-breakdown.ts src/modules/expenses/lib/expense-breakdown.test.ts src/modules/reports/components/ReportsTabs.tsx src/modules/reports/pages/ReportsPage.tsx
git commit -m "refactor: delete TopCategoriesCard, redundant with ExpenseBreakdownCard"
```

---

### Task 3: Remove `SafeToSpendCard` from the Expenses page

**Files:**
- Modify: `src/modules/expenses/pages/ExpensesPage.tsx`

This is the third divergent Safe-to-Spend copy (discovered during plan-writing, not in the original spec's Home/Reports comparison) — same simple, non-cash-flow-inclusive formula Reports had. Home becomes the only place this number appears anywhere in the app.

- [ ] **Step 1: Remove the import and computed values**

In `src/modules/expenses/pages/ExpensesPage.tsx`, delete this import line entirely (added in Task 1, now fully removable):

```ts
import { daysLeftInMonth, safeToSpendToday } from "@/modules/dashboard/lib/cash-flow";
```

Delete this import line:

```ts
import { SafeToSpendCard } from "@/modules/reports/components/SafeToSpendCard";
```

Delete these two lines from the computed-values section:

```ts
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month, dateFormat);
  const daysLeft = daysLeftInMonth(year, month, dateFormat);
```

`totalPlanned` itself stays — it's still used by `pacePoints` and passed to `ExpensesPageTabs`.

- [ ] **Step 2: Remove the JSX**

Delete this block from the render:

```tsx
      <SafeToSpendCard
        daysLeft={daysLeft}
        monthLabel={monthLabel}
        safeToSpend={safeToSpend}
        totalActual={totalExpenses}
        totalPlanned={totalPlanned}
      />

```

`ExpenseHeader` should now be immediately followed by `ExpensesPageTabs` in the JSX.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds (this also re-runs TypeScript across the whole app, catching anything Step 1/2 missed).

- [ ] **Step 4: Commit**

```bash
git add src/modules/expenses/pages/ExpensesPage.tsx
git commit -m "fix: remove Expenses page's own divergent Safe-to-Spend calculation"
```

---

### Task 4: Restructure Reports — drop the Overview tab, default to Expenses

**Files:**
- Modify: `src/modules/reports/pages/ReportsPage.tsx`
- Modify: `src/modules/reports/components/ReportsTabs.tsx`

This is the largest task: Reports gains its own dhuku/loan/cash-flow data fetching (independent of Home's, which is being kept for the safe-to-spend calculation only) to feed a relocated `DailyCashFlowChart`, the Overview tab is deleted, and `SmartInsightCard`/`ExpenseSummaryCard`/`DailyCashFlowChart` move into the Expenses tab alongside the two cards it already had.

- [ ] **Step 1: Add cash-flow data fetching to `ReportsPage.tsx`**

Add these two imports (alphabetically among the existing `@/modules/...` block):

```ts
import { dailyCashFlowPoints, dhukuCashFlow, loanPaymentCashFlow } from "@/modules/dashboard/lib/cash-flow";
```
(placed right after the `daysLeftInMonth, safeToSpendToday` import from the same module added in Task 1 — merge into one import line: `import { dailyCashFlowPoints, daysLeftInMonth, dhukuCashFlow, loanPaymentCashFlow, safeToSpendToday } from "@/modules/dashboard/lib/cash-flow";`)

```ts
import { listDhukuEntries } from "@/modules/dhuku/api/dhuku.actions";
```

```ts
import { listLoanPayments, listLoans } from "@/modules/loans/api/loans.actions";
```

Add three new entries to the existing `Promise.all` array (both the destructured names and the promises, keeping every existing entry in place):

```ts
  const [
    members,
    categories,
    incomeRows,
    allIncomeRows,
    budgetItemRows,
    expenseRows,
    prevExpenseRows,
    rangeExpenseRows,
    goalRows,
    contributionRows,
    dhukuEntryRows,
    loanRows,
    loanPaymentRows,
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    listAllIncomes(),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month, dateFormat),
    listExpensesForMonth(prev.year, prev.month, dateFormat),
    listExpensesForRange(rangeStart, rangeEnd),
    listSavingsGoals(householdId),
    listSavingsContributions(householdId),
    listDhukuEntries(householdId),
    listLoans(householdId),
    listLoanPayments(householdId),
  ]);
```

After the existing `const insightMessage = spendingInsight(totalExpenses, prevTotalExpenses);` line, add:

```ts
  const cashFlowEvents = [...dhukuCashFlow(dhukuEntryRows), ...loanPaymentCashFlow(loanPaymentRows, loanRows)];
  const dailyPoints = dailyCashFlowPoints(expenseRows, incomeRows, cashFlowEvents, year, month, dateFormat);
```

- [ ] **Step 2: Remove Safe-to-Spend from `ReportsPage.tsx`**

Verified: `totalPlanned`/`budgetItemRows`/`getBudgetItemsForMonth` have no other use in this file besides feeding `safeToSpendToday` and the `totalPlanned` prop passed to `ReportsTabs` (which Step 3 below also removes) — all three are deleted outright, not kept.

Delete these three lines:

```ts
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month, dateFormat);
  const daysLeft = daysLeftInMonth(year, month, dateFormat);
```

Remove `daysLeftInMonth, safeToSpendToday` from the merged `dashboard/lib/cash-flow` import added in Step 1, leaving just `dailyCashFlowPoints, dhukuCashFlow, loanPaymentCashFlow`.

Remove `getBudgetItemsForMonth` from `import { getBudgetItemsForMonth, getIncomesForMonth, listAllIncomes } from "@/modules/budget/api/budget.actions";`, leaving `import { getIncomesForMonth, listAllIncomes } from "@/modules/budget/api/budget.actions";`.

Remove `budgetItemRows` from the `Promise.all` destructure array and remove the corresponding `getBudgetItemsForMonth(year, month),` line from the `Promise.all` call array.

- [ ] **Step 3: Update the `<ReportsTabs>` call in `ReportsPage.tsx`**

Remove the `daysLeft={daysLeft}`, `safeToSpend={safeToSpend}`, `totalPlanned={totalPlanned}` props (`topCategories={topCats}` was already removed in Task 2). Add `dailyPoints={dailyPoints}`:

```tsx
      <ReportsTabs
        combinedIncome={combinedIncome}
        dailyPoints={dailyPoints}
        dateFormat={dateFormat}
        expenseRows={expenseTableRows}
        expenseSlices={expenseSlices}
        goals={goals}
        goalStatusCounts={statusCounts}
        incomeSlices={incomeSlices}
        insightMessage={insightMessage}
        monthLabel={monthLabel}
        ownerSlices={ownerSlices}
        partnerName={partner?.user.name ?? null}
        pctOfIncome={pctOfIncome(totalExpenses, combinedIncome)}
        realMemberId={memberId}
        recentContributions={recentContributions}
        savingsAverageProgress={savingsStats.averageProgress}
        savingsMonthlyContribution={savingsStats.monthlyContribution}
        savingsPoints={savingsPoints}
        savingsVsLastMonthPct={savingsVsLastMonthPct}
        totalExpenses={totalExpenses}
        trendPoints={trendPoints}
      />
```

- [ ] **Step 4: Restructure `ReportsTabs.tsx`**

Update imports: add `import { DailyCashFlowChart } from "@/modules/dashboard/components/DailyCashFlowChart";` and `import type { DayPoint } from "@/modules/dashboard/lib/cash-flow";` (both alphabetically among the existing `@/modules/...` block); remove the now-unused `SafeToSpendCard` import (`import { SafeToSpendCard } from "@/modules/reports/components/SafeToSpendCard";`).

Change the `Tab` type and default state:

```ts
type Tab = "expenses" | "income" | "savings";
```

```ts
  const [tab, setTab] = useState<Tab>("expenses");
```

Update the `Props` type: remove `daysLeft: number;`, `safeToSpend: number;`, `totalPlanned: number;`; add `dailyPoints: DayPoint[];` (alphabetically, right after `combinedIncome`).

Remove the `{ label: "Overview", value: "overview" }` entry from the `TabSwitcher`'s `tabs` array, leaving Expenses/Income/Savings.

Delete the entire `{tab === "overview" && (...)}` block.

Replace the `{tab === "expenses" && (...)}` block with:

```tsx
      {tab === "expenses" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ExpenseTable
              dateFormat={props.dateFormat}
              partnerName={props.partnerName}
              realMemberId={props.realMemberId}
              rows={props.expenseRows}
            />
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

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

Run: `npx vitest run`
Expected: all tests still pass (this task adds no new pure-function logic, so no new tests are needed — it's component composition).

- [ ] **Step 6: Commit**

```bash
git add src/modules/reports/pages/ReportsPage.tsx src/modules/reports/components/ReportsTabs.tsx
git commit -m "feat: remove Reports' redundant Overview tab, default to Expenses"
```

---

### Task 5: Home — hero Safe-to-Spend, remove Daily Cash Flow chart

**Files:**
- Modify: `src/modules/reports/components/SafeToSpendCard.tsx`
- Modify: `src/modules/dashboard/index.tsx`

`SafeToSpendCard` doesn't move files (it's still a small, focused, single-purpose component) — it just gains its only remaining caller, and gets a visual pass to read as the hero of the page it's now the header of.

- [ ] **Step 1: Enlarge the amount in `SafeToSpendCard`**

In `src/modules/reports/components/SafeToSpendCard.tsx`, change:

```tsx
        <p className={`text-lg font-extrabold ${tone.amount}`}>{formatNPR(safeToSpend)}</p>
```

to:

```tsx
        <p className={`text-3xl font-extrabold ${tone.amount}`}>{formatNPR(safeToSpend)}</p>
```

- [ ] **Step 2: Reorder `dashboard/index.tsx` — move Safe-to-Spend to the top, remove the chart**

Move the `<SafeToSpendCard ... />` block (currently at the very end of the JSX, lines 236-242) to immediately after `<DashboardHeader ... />` and before `<SummaryCards ... />`. Delete the `<DailyCashFlowChart dateFormat={dateFormat} monthLabel={monthLabel} points={dailyPoints} />` line entirely. The JSX should read, top to bottom: `DashboardHeader`, `SafeToSpendCard`, `SummaryCards`, the two-column `DashboardPanel`/`RecentExpenses`+`DashboardSavingsCard` section.

Delete the now-unused `dailyPoints` computation:

```ts
  const dailyPoints = dailyCashFlowPoints(expenseRows, incomeRows, cashFlowEvents, year, month, dateFormat);
```

Delete the now-unused `DailyCashFlowChart` import (`import { DailyCashFlowChart } from "@/modules/dashboard/components/DailyCashFlowChart";`) and remove `dailyCashFlowPoints` from the `dashboard/lib/cash-flow` import (keep `daysLeftInMonth, dhukuCashFlow, loanPaymentCashFlow, netMonthlyOutflow, safeToSpendToday` — all still used for the safe-to-spend calculation).

`cashFlowEvents` and `netOutflow` stay exactly as they are — they still feed `safeToSpendToday`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/modules/reports/components/SafeToSpendCard.tsx src/modules/dashboard/index.tsx
git commit -m "feat: make Safe-to-Spend the hero of Home, drop the Daily Cash Flow chart"
```

---

### Task 6: Home — replace the Me/Karuna/Shared tabs with a side-by-side view

**Files:**
- Create: `src/modules/dashboard/components/OwnerComparison.tsx`
- Delete: `src/modules/dashboard/components/OwnerTabs.tsx`
- Modify: `src/modules/dashboard/index.tsx`

`OwnerTabs` doesn't use hooks or event handlers of its own — its only reason for needing `"use client"` was `TabSwitcher` (a Radix-based client component). The replacement needs no client-side interactivity at all (`StatAmount`/`ToneIcon`/`TrendLine` are all plain server-renderable components), so `OwnerComparison` is a plain server component — one fewer client bundle on this page.

- [ ] **Step 1: Create `OwnerComparison.tsx`**

```tsx
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { ToneIcon } from "@/components/ToneIcon";
import { TrendLine } from "@/components/TrendLine";
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";

type OwnerView = {
  expenses: number;
  expenseTrendPct: null | number;
  income: number;
  incomeTrendPct: null | number;
  key: string;
  label: string;
  remaining: number;
};

export function OwnerComparison({ views }: { views: OwnerView[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {views.map((v) => {
        const percent = pctOfIncome(v.expenses, v.income) ?? 0;
        const remainingPercent = Math.max(0, 100 - percent);

        return (
          <div className="space-y-4 rounded-xl border p-4" key={v.key}>
            <p className="text-sm font-medium">{v.label}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ToneIcon icon={ArrowDownLeft} tone="green" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <StatAmount>{formatNPR(v.income)}</StatAmount>
                  <TrendLine pct={v.incomeTrendPct} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ToneIcon icon={ArrowUpRight} tone="pink" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <StatAmount>{formatNPR(v.expenses)}</StatAmount>
                  <p className="mt-1 text-xs text-muted-foreground">{percent}% of income</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ToneIcon icon={CheckCircle2} tone="blue" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <StatAmount>{formatNPR(v.remaining)}</StatAmount>
                  <p className="mt-1 text-xs text-muted-foreground">{remainingPercent}% available</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Income used</span>
                <span className="font-medium">{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${percent > 100 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(Math.max(percent, 3), 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {v.expenses === 0
                  ? "No expenses recorded yet. You're fully on track."
                  : percent > 100
                    ? "You've gone over your available income this month."
                    : "Your spending is within the monthly plan."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Delete `OwnerTabs.tsx`**

Delete `src/modules/dashboard/components/OwnerTabs.tsx`.

- [ ] **Step 3: Wire it into `dashboard/index.tsx`**

Change the import from:

```ts
import { OwnerTabs } from "@/modules/dashboard/components/OwnerTabs";
```

to:

```ts
import { OwnerComparison } from "@/modules/dashboard/components/OwnerComparison";
```

(keep it in the same alphabetical position in the import block — `OwnerComparison` sorts the same relative to its neighbors as `OwnerTabs` did).

Change:

```tsx
          <DashboardPanel className="min-h-full" title="Overview">
            <OwnerTabs views={ownerViews} />
          </DashboardPanel>
```

to:

```tsx
          <DashboardPanel className="min-h-full" title="Overview">
            <OwnerComparison views={ownerViews} />
          </DashboardPanel>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

Run: `npx vitest run`
Expected: all tests pass (this task adds no new pure-function logic).

- [ ] **Step 5: Commit**

```bash
git add -A -- src/modules/dashboard/components/OwnerComparison.tsx src/modules/dashboard/components/OwnerTabs.tsx src/modules/dashboard/index.tsx
git commit -m "feat: replace Home's Me/Karuna/Shared tabs with a side-by-side view"
```

---

### Task 7: Fix the stale Reports README

**Files:**
- Modify: `src/modules/reports/README.md`

- [ ] **Step 1: Replace the stale content**

Current content:

```md
# Reports module

Not yet built — sidebar entry is disabled. When implemented, follows the
standard module shape: `components/`, `lib/`, `constants/`, `schemas/`,
`hooks/`, `api/`, plus an `index.tsx` entry wired from
`src/app/(app)/reports/page.tsx`.
```

Replace with:

```md
# Reports module

Tabbed drill-down view (Expenses/Income/Savings) complementing Home's
at-a-glance summary. Standard module shape: `components/`, `lib/`,
`pages/`, plus `src/modules/reports/index.tsx` re-exporting the page,
wired from `src/app/(app)/reports/page.tsx`.
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/reports/README.md
git commit -m "docs: fix stale Reports module README"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 3: Manually verify in the browser using the existing Playwright setup**

Start the dev server, log in using `.playwright/auth.json` (regenerate via `node .playwright/login.mjs` if expired), and screenshot:
- `/dashboard` — confirm Safe-to-Spend is now the hero at the top (large amount), no Daily Cash Flow chart anywhere, and the Me/Karuna/Shared section is a side-by-side grid (not tabs).
- `/reports` — confirm it opens directly to the Expenses tab (no Overview tab in the switcher), and that tab shows the expense table, the Daily Cash Flow chart, the owner-split pie, the category breakdown, and the smart insight — with no `TopCategoriesCard` bars anywhere.
- `/expenses` — confirm there's no Safe-to-Spend banner between the header and the tabs.

- [ ] **Step 4: Fix any issues found, then re-run Steps 1-2 before considering the task done.**
