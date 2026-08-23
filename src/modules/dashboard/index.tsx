import Link from "next/link";

import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import {
  getBudgetItemsForMonth,
  getIncomesForMonth,
} from "@/modules/budget/api/budget.actions";
import { budgetVsActual, dashboardSummary } from "@/modules/budget/lib/calculations";
import { listCategories } from "@/modules/categories/api/categories";
import { DashboardHeader } from "@/modules/dashboard/components/DashboardHeader";
import { DashboardPanel } from "@/modules/dashboard/components/DashboardPanel";
import { DashboardSavingsCard } from "@/modules/dashboard/components/DashboardSavingsCard";
import { OwnerTabs } from "@/modules/dashboard/components/OwnerTabs";
import { RecentExpenses } from "@/modules/dashboard/components/RecentExpenses";
import { SummaryCards } from "@/modules/dashboard/components/SummaryCards";
import { toBudgetItemInputs, toExpenseInputs, toIncomeInputs } from "@/modules/dashboard/lib/map-rows";
import { classifyOwnerLabel } from "@/modules/dashboard/lib/owner-label";
import { listExpensesForMonth, listRecentExpenses } from "@/modules/expenses/api/expenses.actions";
import { checkBudgetReminder } from "@/modules/notifications/api/notifications.actions";
import { SafeToSpendCard } from "@/modules/reports/components/SafeToSpendCard";
import { daysLeftInMonth, safeToSpendToday } from "@/modules/reports/lib/reports-stats";
import { listSavingsContributions, listSavingsGoals } from "@/modules/savings-goals/api/savings-goals.actions";
import { savingsOverviewStats } from "@/modules/savings-goals/lib/savings-stats";

function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function DashboardPage() {
  const { householdId, memberId } = await getEffectiveMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prev = previousMonth(year, month);

  const [
    members,
    categories,
    incomeRows,
    budgetItemRows,
    expenseRows,
    prevIncomeRows,
    prevExpenseRows,
    recentExpenseRows,
    goalRows,
    contributionRows,
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
    getIncomesForMonth(prev.year, prev.month),
    listExpensesForMonth(prev.year, prev.month),
    listRecentExpenses(5),
    listSavingsGoals(householdId),
    listSavingsContributions(householdId),
  ]);

  await checkBudgetReminder(householdId, year, month, budgetItemRows.length);

  const incomes = toIncomeInputs(incomeRows);
  const expenses = toExpenseInputs(expenseRows);
  const budgetItems = toBudgetItemInputs(budgetItemRows);

  const summary = dashboardSummary(incomes, expenses);
  const vsActual = budgetVsActual(budgetItems, expenses);

  // Previous-month budget-vs-actual is deliberately NOT computed here — only
  // dashboardSummary (for the trend lines above). Nothing on this page shows
  // a previous-month budget-vs-actual breakdown, so there's no need to fetch
  // budget items for the previous month at all.
  const prevSummary = dashboardSummary(
    toIncomeInputs(prevIncomeRows),
    toExpenseInputs(prevExpenseRows),
  );

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";

  const ownerLabel = (id: string | null) => classifyOwnerLabel(id, memberId, members);

  const partner = members.find((m) => m.id !== memberId);
  const ownerViews = [
    {
      key: "me",
      label: "Me",
      income: incomes.find((i) => i.memberId === memberId)?.amount ?? 0,
      expenses: expenses
        .filter((e) => e.ownerMemberId === memberId)
        .reduce((s, e) => s + e.amount, 0),
      remaining: 0,
    },
    ...(partner
      ? [
          {
            key: "partner",
            label: partner.user.name,
            income: incomes.find((i) => i.memberId === partner.id)?.amount ?? 0,
            expenses: expenses
              .filter((e) => e.ownerMemberId === partner.id)
              .reduce((s, e) => s + e.amount, 0),
            remaining: 0,
          },
        ]
      : []),
    {
      key: "shared",
      label: "Shared",
      income: 0,
      expenses: expenses.filter((e) => e.ownerMemberId === null).reduce((s, e) => s + e.amount, 0),
      remaining: 0,
    },
  ].map((v) => ({ ...v, remaining: v.income - v.expenses }));

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentMemberName = members.find((m) => m.id === memberId)?.user.name ?? "there";

  const totalPlanned = budgetItems.reduce((s, b) => s + b.plannedAmount, 0);
  const totalActual = vsActual.reduce((s, row) => s + row.actual, 0);
  const safeToSpend = safeToSpendToday(totalPlanned, summary.totalExpenses, year, month);
  const daysLeft = daysLeftInMonth(year, month);

  const savingsStats = savingsOverviewStats(
    goalRows.map((g) => ({ createdAt: g.createdAt, id: g.id, targetAmount: Number(g.targetAmount), targetDate: g.targetDate })),
    contributionRows.map((c) => ({ amount: Number(c.amount), date: c.date, goalId: c.goalId })),
    year,
    month,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <DashboardHeader monthLabel={monthLabel} name={currentMemberName} />

      <SummaryCards
        combinedIncome={summary.combinedIncome}
        expenseTrendPct={trendPct(summary.totalExpenses, prevSummary.totalExpenses)}
        incomeTrendPct={trendPct(summary.combinedIncome, prevSummary.combinedIncome)}
        totalExpenses={summary.totalExpenses}
        unallocated={summary.unallocated}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardPanel title="Overview">
            <OwnerTabs views={ownerViews} />
          </DashboardPanel>

          <SafeToSpendCard daysLeft={daysLeft} monthLabel={monthLabel} safeToSpend={safeToSpend} />

          <DashboardPanel title="Budget">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {vsActual.length === 0 ? (
                  "No budget set for this month yet."
                ) : (
                  <>
                    NPR {totalActual.toLocaleString()} spent of NPR {totalPlanned.toLocaleString()} budgeted across{" "}
                    {vsActual.length} categor{vsActual.length === 1 ? "y" : "ies"}
                  </>
                )}
              </p>
              <Link className="shrink-0 text-sm text-primary underline" href="/budget">
                View budget
              </Link>
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <RecentExpenses
            rows={recentExpenseRows.map((e) => ({
              id: e.id,
              categoryName: categoryName(e.categoryId),
              categoryGroupName: category(e.categoryId)?.groupName ?? "",
              ownerLabel: ownerLabel(e.ownerMemberId),
              amount: Number(e.amount),
              date: e.date,
            }))}
          />

          <DashboardSavingsCard
            averageProgress={savingsStats.averageProgress}
            monthlyContribution={savingsStats.monthlyContribution}
            totalGoals={savingsStats.totalGoals}
          />
        </div>
      </div>
    </div>
  );
}
