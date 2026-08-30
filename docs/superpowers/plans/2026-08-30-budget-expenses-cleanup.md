# Budget/Expenses Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead code and fake controls from Budget and Expenses, fix Budget's misleading "Over budget" labeling for unset budgets, resolve a label collision between Budget's and Home's "Unallocated" tiles, and shrink Expenses down to its one job (find/search/manage transactions) by removing its Overview tab and relocating the one non-duplicated piece of it (`SpendingPaceCard`) into Reports.

**Architecture:** No schema changes. Mostly deletions and prop/computation trims, plus one small pure-function enhancement (`computeBudgetStatus`'s new "No budget set" branch, TDD'd). Work proceeds in dependency order: Budget's independent fixes first (dead files, status logic, fake control, label), then Expenses' simplification, then Reports gains `SpendingPaceCard`.

**Tech Stack:** Next.js (App Router, Server Components), React 19, Tailwind v4, Recharts, Vitest.

Full design: `docs/superpowers/specs/2026-08-30-budget-expenses-cleanup-design.md`

---

### Task 1: Delete dead Budget files and fix stale comments

**Files:**
- Delete: `src/modules/budget/components/BudgetCard.tsx`
- Delete: `src/modules/budget/components/BudgetVsActualTable.tsx`
- Modify: `src/modules/budget/lib/budget-status.ts`
- Modify: `src/components/DataTable.tsx`

Both deleted files are confirmed imported nowhere in the app (`BudgetCard`/`BudgetVsActualTable` only self-match in their own files, plus two stale doc comments).

- [ ] **Step 1: Delete the two dead component files**

Delete `src/modules/budget/components/BudgetCard.tsx` and `src/modules/budget/components/BudgetVsActualTable.tsx`.

- [ ] **Step 2: Fix the stale comment in `budget-status.ts`**

Change:

```ts
// Shared by BudgetCard and BudgetVsActualTable so the two views can never
// disagree on what counts as "over budget" vs "approaching limit."
```

to:

```ts
// Used by BudgetGroupTable so every category row in the Budget page agrees
// on what counts as "over budget" vs "approaching limit."
```

- [ ] **Step 3: Fix the stale comment in `DataTable.tsx`**

Change:

```ts
// The Table/TableHeader/TableBody/TableRow/TableCell scaffolding was
// identical across every table in the app (BudgetGroupTable,
// BudgetVsActualTable, ExpenseTable, CategoriesManager) — only the column
// definitions and per-row rendering differed. This is that shared shell.
```

to:

```ts
// The Table/TableHeader/TableBody/TableRow/TableCell scaffolding was
// identical across every table in the app (BudgetGroupTable, ExpenseTable,
// CategoriesManager) — only the column definitions and per-row rendering
// differed. This is that shared shell.
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all existing tests pass (no test files reference the deleted components).

- [ ] **Step 5: Commit**

```bash
git add -A -- src/modules/budget/components/BudgetCard.tsx src/modules/budget/components/BudgetVsActualTable.tsx src/modules/budget/lib/budget-status.ts src/components/DataTable.tsx
git commit -m "refactor: delete dead BudgetCard/BudgetVsActualTable, fix stale comments"
```

---

### Task 2: Add a "No budget set" status, distinct from "Over budget"

**Files:**
- Modify: `src/modules/budget/lib/budget-status.ts`
- Test: `src/modules/budget/lib/budget-status.test.ts` (new file — none exists today)
- Modify: `src/modules/budget/components/BudgetGroupTable.tsx`

Today, any spend against an unset (₨0) budget renders identically to a real budget genuinely exceeded — both show a red "Over budget" badge at 100%. This adds a third, neutral state for the unset case.

- [ ] **Step 1: Write the failing tests**

Create `src/modules/budget/lib/budget-status.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { computeBudgetStatus } from "./budget-status";

describe("computeBudgetStatus", () => {
  it("returns 'No budget set' when there's spend but no planned amount", () => {
    expect(computeBudgetStatus(0, 500)).toEqual({ label: "No budget set", pct: 100, variant: "outline" });
  });

  it("returns 'On track' when there's no planned amount and no spend", () => {
    expect(computeBudgetStatus(0, 0)).toEqual({ label: "On track", pct: 0, variant: "default" });
  });

  it("returns 'Over budget' when spend meets or exceeds a real planned amount", () => {
    expect(computeBudgetStatus(1000, 1200)).toEqual({ label: "Over budget", pct: 120, variant: "destructive" });
  });

  it("returns 'Approaching limit' between 80% and 99% of a real planned amount", () => {
    expect(computeBudgetStatus(1000, 850)).toEqual({ label: "Approaching limit", pct: 85, variant: "secondary" });
  });

  it("returns 'On track' below 80% of a real planned amount", () => {
    expect(computeBudgetStatus(1000, 400)).toEqual({ label: "On track", pct: 40, variant: "default" });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/modules/budget/lib/budget-status.test.ts`
Expected: FAIL — the first test expects `"No budget set"`/`"outline"`, but the current implementation returns `"Over budget"`/`"destructive"` for `computeBudgetStatus(0, 500)`.

- [ ] **Step 3: Implement the new branch**

In `src/modules/budget/lib/budget-status.ts`, replace the whole file with:

```ts
export type BudgetStatusVariant = "default" | "destructive" | "outline" | "secondary";

export type BudgetStatus = {
  label: string;
  pct: number;
  variant: BudgetStatusVariant;
};

// Used by BudgetGroupTable so every category row in the Budget page agrees
// on what counts as "over budget" vs "approaching limit."
export function computeBudgetStatus(planned: number, actual: number): BudgetStatus {
  // planned can be 0 for a category with untracked/uncovered spend (no
  // budget item set for it this month). That's a distinct situation from a
  // real budget being exceeded — labeling it "No budget set" (neutral)
  // instead of "Over budget" (red) avoids implying the household did
  // something wrong when they simply haven't planned this category yet.
  if (planned <= 0 && actual > 0) {
    return { label: "No budget set", pct: 100, variant: "outline" };
  }
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  if (pct >= 100) return { label: "Over budget", variant: "destructive", pct };
  if (pct >= 80) return { label: "Approaching limit", variant: "secondary", pct };
  return { label: "On track", variant: "default", pct };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/modules/budget/lib/budget-status.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Add the neutral color case to `BudgetGroupTable.tsx`**

In `src/modules/budget/components/BudgetGroupTable.tsx`, the Progress column's bar-color ternary currently reads:

```tsx
              className={`h-full rounded-full ${
                status.variant === "destructive"
                  ? "bg-destructive"
                  : status.variant === "secondary"
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
```

Change it to:

```tsx
              className={`h-full rounded-full ${
                status.variant === "destructive"
                  ? "bg-destructive"
                  : status.variant === "secondary"
                    ? "bg-amber-500"
                    : status.variant === "outline"
                      ? "bg-muted-foreground"
                      : "bg-green-500"
              }`}
```

The `Badge` in the same file's `Status` column already renders whatever `variant` `computeBudgetStatus` returns generically (`<Badge variant={status.variant}>{status.label}</Badge>`) — `Badge`'s own `outline` variant (`border-border text-foreground`, already used elsewhere in this same file for the "Flexible" type tag) needs no changes.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all tests pass (5 new).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/modules/budget/lib/budget-status.ts src/modules/budget/lib/budget-status.test.ts src/modules/budget/components/BudgetGroupTable.tsx
git commit -m "fix: distinguish 'no budget set' from 'over budget' in category status"
```

---

### Task 3: Delete `RecommendationsCard`

**Files:**
- Delete: `src/modules/budget/components/RecommendationsCard.tsx`
- Modify: `src/modules/budget/pages/BudgetPage.tsx`

A permanently-disabled stub with no real feature behind it and no near-term plan to build one.

- [ ] **Step 1: Delete the component file**

Delete `src/modules/budget/components/RecommendationsCard.tsx`.

- [ ] **Step 2: Remove its usage from `BudgetPage.tsx`**

Delete the import line:

```ts
import { RecommendationsCard } from "@/modules/budget/components/RecommendationsCard";
```

Delete the `<RecommendationsCard />` line from the right-column JSX (it's the last child, right after `<TopBudgetCategoriesCard categories={topCategories} />`).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A -- src/modules/budget/components/RecommendationsCard.tsx src/modules/budget/pages/BudgetPage.tsx
git commit -m "fix: remove RecommendationsCard, a permanently-disabled stub"
```

---

### Task 4: Rename Budget's "Unallocated" tile to "Unbudgeted"

**Files:**
- Modify: `src/modules/budget/components/BudgetSummaryCards.tsx`

Home's "Unallocated" (income − actual expenses) and Budget's "Unallocated" (income − allocated budget) are two different formulas sharing one label — a user comparing the two pages would reasonably expect them to mean the same thing. This is a label-only change; the formula/prop (`unallocated`) is unchanged.

- [ ] **Step 1: Change the tile title**

In `src/modules/budget/components/BudgetSummaryCards.tsx`, in the fourth card object, change:

```ts
      icon: PiggyBank,
      title: "Unallocated",
      tone: "amber",
```

to:

```ts
      icon: PiggyBank,
      title: "Unbudgeted",
      tone: "amber",
```

No other changes — the prop name `unallocated`, its computation in `BudgetPage.tsx`, and the card's content/percentage line all stay exactly as they are.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/budget/components/BudgetSummaryCards.tsx
git commit -m "fix: rename Budget's Unallocated tile to Unbudgeted, distinct from Home's"
```

---

### Task 5: Expenses — remove the Overview tab

**Files:**
- Delete: `src/modules/expenses/components/ExpensesPageTabs.tsx`
- Delete: `src/modules/expenses/components/ExpenseSummaryTabs.tsx`
- Modify: `src/modules/expenses/pages/ExpensesPage.tsx`
- Modify: `src/modules/expenses/components/ExpenseSummaryCard.tsx`

`ExpensesPageTabs` (Expenses/Overview tab switcher) and `ExpenseSummaryTabs` (the Summary/Breakdown sub-tab nested inside Overview) both become fully dead once the Overview tab's content is removed — neither has any other caller. `ExpensesPage.tsx` sheds every computation that only existed to feed that removed tab.

- [ ] **Step 1: Delete the two now-dead component files**

Delete `src/modules/expenses/components/ExpensesPageTabs.tsx` and `src/modules/expenses/components/ExpenseSummaryTabs.tsx`.

- [ ] **Step 2: Un-export `ExpenseSummaryContent`**

In `src/modules/expenses/components/ExpenseSummaryCard.tsx`, change:

```tsx
export function ExpenseSummaryContent({ pctOfIncome, slices, total }: ContentProps) {
```

to:

```tsx
function ExpenseSummaryContent({ pctOfIncome, slices, total }: ContentProps) {
```

(After Step 1, its only remaining use is internal — by `ExpenseSummaryCard` in this same file, a few lines below. `ExpenseSummaryCard` itself keeps its `export` — it's still used by `ReportsTabs.tsx`.)

- [ ] **Step 3: Rewrite `ExpensesPage.tsx`**

Replace the entire file with:

```tsx
import { getDateFormatPref } from "@/lib/date-format-cookie";
import { nextMonth, parseMonthParam, previousMonth } from "@/lib/month-nav";
import { currentPeriodYearMonth, formatPeriodLabel, MAX_NAVIGABLE_YEAR, MIN_NAVIGABLE_YEAR } from "@/lib/month-period";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";
import { ExpenseHeader } from "@/modules/expenses/components/ExpenseHeader";
import { ExpenseTable } from "@/modules/expenses/components/ExpenseTable";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";

type Props = { searchParams: Promise<{ month?: string; year?: string }> };

export async function ExpensesPage({ searchParams }: Props) {
  const { householdId, memberId } = await getEffectiveMember();
  const dateFormat = await getDateFormatPref(householdId);
  const params = await searchParams;
  const { year: currentYear, month: currentMonth } = currentPeriodYearMonth(dateFormat);
  const year = parseMonthParam(params.year, currentYear, MAX_NAVIGABLE_YEAR[dateFormat], MIN_NAVIGABLE_YEAR[dateFormat]);
  const month = parseMonthParam(params.month, currentMonth, 12);
  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  const [members, categories, expenseRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listExpensesForMonth(year, month, dateFormat),
  ]);

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";
  const memberName = (id: string) => members.find((m) => m.id === id)?.user.name ?? "Unknown";
  const partner = members.find((m) => m.id !== memberId) ?? null;

  const rows = expenseRows.map((e) => ({
    amount: Number(e.amount),
    categoryGroupName: category(e.categoryId)?.groupName ?? "",
    categoryName: categoryName(e.categoryId),
    date: e.date,
    id: e.id,
    note: e.note,
    ownerMemberId: e.ownerMemberId,
    ownerName: e.ownerMemberId ? memberName(e.ownerMemberId) : null,
    paidByMemberId: e.paidByMemberId,
    paidByName: memberName(e.paidByMemberId),
  }));

  const exportRows = expenseRows.map((e) => ({
    amount: Number(e.amount),
    category: categoryName(e.categoryId),
    date: e.date,
    name: e.note ?? categoryName(e.categoryId),
    owner: e.ownerMemberId ? roleForOwner(e.ownerMemberId, memberId) : "shared",
  }));

  const monthLabel = formatPeriodLabel(year, month, dateFormat);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <ExpenseHeader
        categories={categories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }))}
        currentMemberId={memberId}
        exportRows={exportRows}
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        monthLabel={monthLabel}
        nextHref={`/expenses?year=${next.year}&month=${next.month}`}
        prevHref={`/expenses?year=${prev.year}&month=${prev.month}`}
      />

      <ExpenseTable dateFormat={dateFormat} partnerName={partner?.user.name ?? null} realMemberId={memberId} rows={rows} />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all tests pass.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A -- src/modules/expenses/components/ExpensesPageTabs.tsx src/modules/expenses/components/ExpenseSummaryTabs.tsx src/modules/expenses/pages/ExpensesPage.tsx src/modules/expenses/components/ExpenseSummaryCard.tsx
git commit -m "feat: remove Expenses' Overview tab, keep the page focused on the transaction table"
```

---

### Task 6: Add a "View full report" link to Expenses

**Files:**
- Modify: `src/modules/expenses/components/ExpenseHeader.tsx`

With the Overview tab gone, anyone wanting the analytics view (trend charts, breakdowns) needs a way to get to Reports.

- [ ] **Step 1: Add the import**

Add `ArrowUpRight` to the existing `lucide-react` import:

```tsx
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, FileDown, ListPlus } from "lucide-react";
```

- [ ] **Step 2: Add the link**

In the button row (the `<div className="flex items-center gap-3">` containing "Bulk add"/"Export"/the month-nav pill), add the link as the first child, before the "Bulk add" button:

```tsx
        <Link className="flex items-center gap-1 text-sm font-medium text-primary" href="/reports">
          View full report
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
```

`Link` from `next/link` is already imported in this file. The full button row becomes:

```tsx
      <div className="flex items-center gap-3">
        <Link className="flex items-center gap-1 text-sm font-medium text-primary" href="/reports">
          View full report
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Button
          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          onClick={() => setBulkOpen(true)}
          type="button"
          variant="outline"
        >
          <ListPlus className="h-4 w-4" />
          Bulk add
        </Button>
        <Button
          className="border-foreground/20 font-medium"
          onClick={() => downloadExpensesCsv(exportRows, monthLabel)}
          type="button"
          variant="secondary"
        >
          <FileDown className="h-4 w-4" />
          Export
        </Button>
        <div className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground">
          <Link aria-label="Previous month" className="rounded-full p-1 hover:bg-accent" href={prevHref}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="flex items-center gap-1 px-2 text-sm font-medium">
            {monthLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <Link aria-label="Next month" className="rounded-full p-1 hover:bg-accent" href={nextHref}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/modules/expenses/components/ExpenseHeader.tsx
git commit -m "feat: add a View full report link from Expenses to Reports"
```

---

### Task 7: Reports — add `SpendingPaceCard` to the Expenses tab

**Files:**
- Modify: `src/modules/reports/pages/ReportsPage.tsx`
- Modify: `src/modules/reports/components/ReportsTabs.tsx`

`SpendingPaceCard` was the one piece of Expenses' now-removed Overview tab not duplicated elsewhere. It already lives in `reports/components/` (previously true only because Expenses borrowed it; now genuinely its home).

- [ ] **Step 1: Add budget-item fetching and pace computation to `ReportsPage.tsx`**

Add `getBudgetItemsForMonth` to the existing budget-actions import:

```ts
import { getBudgetItemsForMonth, getIncomesForMonth, listAllIncomes } from "@/modules/budget/api/budget.actions";
```

Add `dailySpendingPace` to the existing `reports-stats` import:

```ts
import { categoryBreakdown, dailySpendingPace, monthlyIncomeExpenseTrend, spendingInsight } from "@/modules/reports/lib/reports-stats";
```

Add `budgetItemRows` to the `Promise.all` destructure and call (any position is fine; alphabetical order isn't enforced for this array, but for consistency insert it right after `allIncomeRows`/`listAllIncomes()`):

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
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const pacePoints = dailySpendingPace(
    expenseRows.map((e) => ({ amount: Number(e.amount), date: e.date })),
    year,
    month,
    totalPlanned,
    dateFormat,
  );
```

- [ ] **Step 2: Pass the new props to `<ReportsTabs>`**

Add `pacePoints={pacePoints}` and `totalPlanned={totalPlanned}` to the `<ReportsTabs ... />` call, alphabetically:

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
        pacePoints={pacePoints}
        partnerName={partner?.user.name ?? null}
        pctOfIncome={pctOfIncome(totalExpenses, combinedIncome)}
        realMemberId={memberId}
        recentContributions={recentContributions}
        savingsAverageProgress={savingsStats.averageProgress}
        savingsMonthlyContribution={savingsStats.monthlyContribution}
        savingsPoints={savingsPoints}
        savingsVsLastMonthPct={savingsVsLastMonthPct}
        totalExpenses={totalExpenses}
        totalPlanned={totalPlanned}
        trendPoints={trendPoints}
      />
```

- [ ] **Step 3: Update `ReportsTabs.tsx`**

Add the import (alphabetically among the existing `@/modules/reports/components/...` block):

```ts
import { SpendingPaceCard } from "@/modules/reports/components/SpendingPaceCard";
```

Add `PacePoint` to the existing `reports-stats` type import:

```ts
import type { CategorySlice, MonthPoint, PacePoint } from "@/modules/reports/lib/reports-stats";
```

Add `pacePoints: PacePoint[];` and `totalPlanned: number;` to `Props` (alphabetically — `pacePoints` goes right after `ownerSlices`, `totalPlanned` goes right after `savingsVsLastMonthPct`):

```ts
type Props = {
  combinedIncome: number;
  dailyPoints: DayPoint[];
  dateFormat: DateFormat;
  expenseRows: ExpenseRow[];
  expenseSlices: CategorySlice[];
  goals: GoalCardData[];
  goalStatusCounts: Record<GoalStatus, number>;
  incomeSlices: OwnerSlice[];
  insightMessage: string;
  monthLabel: string;
  ownerSlices: OwnerSlice[];
  pacePoints: PacePoint[];
  partnerName: null | string;
  pctOfIncome: null | number;
  realMemberId: string;
  recentContributions: ContributionEntry[];
  savingsAverageProgress: number;
  savingsMonthlyContribution: number;
  savingsPoints: { cumulative: number; label: string }[];
  savingsVsLastMonthPct: null | number;
  totalExpenses: number;
  totalPlanned: number;
  trendPoints: MonthPoint[];
};
```

Add `<SpendingPaceCard>` as the first child of the Expenses tab's grid, above the existing two-column split:

```tsx
      {tab === "expenses" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SpendingPaceCard points={props.pacePoints} totalPlanned={props.totalPlanned} />

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

(`SpendingPaceCard` renders its own `lg:col-span-3` on its root `<Card>`, so it spans the full grid width and pushes the two-column split below it — no extra wrapper needed.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

Run: `npx vitest run`
Expected: all tests pass (this task adds no new pure-function logic — `dailySpendingPace` is reused as-is with a second call site).

- [ ] **Step 5: Commit**

```bash
git add src/modules/reports/pages/ReportsPage.tsx src/modules/reports/components/ReportsTabs.tsx
git commit -m "feat: add Spending Pace chart to Reports' Expenses tab"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the new `budget-status.test.ts`.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 3: Manually verify in the browser using the existing Playwright setup**

Start the dev server, log in using `.playwright/auth.json` (regenerate via `node .playwright/login.mjs` if expired), and screenshot:
- `/budget` — confirm categories with spend but no set budget show a neutral "No budget set" badge (not red "Over budget"), the "Unallocated" tile now reads "Unbudgeted", and there's no "Need Help Planning?"/Recommendations card in the right column.
- `/expenses` — confirm there's no "Overview" tab (just the transaction table), and a "View full report" link appears near the header pointing to `/reports`.
- `/reports`, Expenses tab — confirm a "Spending Pace" chart now appears above the table/cash-flow-chart/cards layout.

- [ ] **Step 4: Fix any issues found, then re-run Steps 1-2 before considering the task done.**
