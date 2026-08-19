import { Gauge, PiggyBank } from "lucide-react";

import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import {
  getBudgetItemsForMonth,
  getIncomesForMonth,
} from "@/modules/budget/api/budget.actions";
import { BudgetCard } from "@/modules/budget/components/BudgetCard";
import { BudgetVsActualTable } from "@/modules/budget/components/BudgetVsActualTable";
import { budgetVsActual, dashboardSummary } from "@/modules/budget/lib/calculations";
import { listCategories } from "@/modules/categories/api/categories";
import { ComingSoonCard } from "@/modules/dashboard/components/ComingSoonCard";
import { DashboardHeader } from "@/modules/dashboard/components/DashboardHeader";
import { DashboardPanel } from "@/modules/dashboard/components/DashboardPanel";
import { OwnerTabs } from "@/modules/dashboard/components/OwnerTabs";
import { RecentExpenses } from "@/modules/dashboard/components/RecentExpenses";
import { SummaryCards } from "@/modules/dashboard/components/SummaryCards";
import { toBudgetItemInputs, toExpenseInputs, toIncomeInputs } from "@/modules/dashboard/lib/map-rows";
import { classifyOwnerLabel } from "@/modules/dashboard/lib/owner-label";
import { listExpensesForMonth, listRecentExpenses } from "@/modules/expenses/api/expenses.actions";

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
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
    getIncomesForMonth(prev.year, prev.month),
    listExpensesForMonth(prev.year, prev.month),
    listRecentExpenses(5),
  ]);

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

          <ComingSoonCard
            description="A safe-to-spend forecast based on your budget and spending pace is coming soon."
            icon={Gauge}
            title="Financial Health"
          />

          <DashboardPanel actionHref="/budget" actionLabel="View all budgets" title="Budget Overview">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vsActual.map((row) => (
                <BudgetCard
                  actual={row.actual}
                  categoryGroupName={category(row.categoryId)?.groupName ?? ""}
                  categoryName={categoryName(row.categoryId)}
                  key={`${row.categoryId}-${row.ownerMemberId ?? "shared"}`}
                  ownerLabel={ownerLabel(row.ownerMemberId)}
                  planned={row.planned}
                />
              ))}
              {vsActual.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No budget set for this month yet.
                </p>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Budget vs Actual">
            <BudgetVsActualTable
              rows={vsActual.map((row) => ({
                categoryId: row.categoryId,
                ownerMemberId: row.ownerMemberId,
                categoryName: categoryName(row.categoryId),
                planned: row.planned,
                actual: row.actual,
                difference: row.difference,
              }))}
            />
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

          <ComingSoonCard
            description="Set shared or personal savings targets and track progress here soon."
            icon={PiggyBank}
            title="Savings Goals"
          />
        </div>
      </div>
    </div>
  );
}
