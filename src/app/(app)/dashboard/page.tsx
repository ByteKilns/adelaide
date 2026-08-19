import Link from "next/link";
import { Gauge, PiggyBank } from "lucide-react";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/lib/data/categories";
import { getIncomesForMonth } from "@/lib/actions/income";
import { getBudgetItemsForMonth } from "@/lib/actions/budget";
import { listExpensesForMonth, listRecentExpenses } from "@/lib/actions/expenses";
import { dashboardSummary, budgetVsActual } from "@/lib/calculations/budget";
import { getCategoryIcon } from "@/lib/category-icons";
import { toIncomeInputs, toExpenseInputs, toBudgetItemInputs } from "@/lib/dashboard/map-rows";
import { classifyOwnerLabel } from "@/lib/dashboard/owner-label";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { OwnerTabs } from "@/components/dashboard/owner-tabs";
import { ComingSoonCard } from "@/components/dashboard/coming-soon-card";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetVsActualTable } from "@/components/budget/budget-vs-actual-table";
import { RecentExpenses } from "@/components/expenses/recent-expenses";

function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function DashboardPage() {
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

  const expensesFor = (label: string) =>
    expenses
      .filter((e) => ownerLabel(e.ownerMemberId) === label)
      .reduce((s, e) => s + e.amount, 0);

  const partner = members.find((m) => m.id !== memberId);
  const ownerViews = [
    {
      key: "me",
      label: "Me",
      income: incomes.find((i) => i.memberId === memberId)?.amount ?? 0,
      expenses: expensesFor("Me"),
      remaining: 0,
    },
    ...(partner
      ? [
          {
            key: "partner",
            label: partner.user.name,
            income: incomes.find((i) => i.memberId === partner.id)?.amount ?? 0,
            expenses: expensesFor(partner.user.name),
            remaining: 0,
          },
        ]
      : []),
    {
      key: "shared",
      label: "Shared",
      income: 0,
      expenses: expensesFor("Shared"),
      remaining: 0,
    },
  ].map((v) => ({ ...v, remaining: v.income - v.expenses }));

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentMemberName = members.find((m) => m.id === memberId)?.user.name ?? "there";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <DashboardHeader name={currentMemberName} monthLabel={monthLabel} />

      <SummaryCards
        combinedIncome={summary.combinedIncome}
        totalExpenses={summary.totalExpenses}
        unallocated={summary.unallocated}
        incomeTrendPct={trendPct(summary.combinedIncome, prevSummary.combinedIncome)}
        expenseTrendPct={trendPct(summary.totalExpenses, prevSummary.totalExpenses)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-2 text-lg font-semibold">Overview</h2>
            <OwnerTabs views={ownerViews} />
          </section>

          <ComingSoonCard
            icon={Gauge}
            title="Financial Health"
            description="A safe-to-spend forecast based on your budget and spending pace is coming soon."
          />

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Budget Overview</h2>
              <Link href="/budget" className="text-sm text-primary underline">
                View all budgets
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vsActual.map((row) => (
                <BudgetCard
                  key={`${row.categoryId}-${row.ownerMemberId ?? "shared"}`}
                  categoryName={categoryName(row.categoryId)}
                  planned={row.planned}
                  actual={row.actual}
                  icon={getCategoryIcon(category(row.categoryId)?.groupName ?? "")}
                />
              ))}
              {vsActual.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No budget set for this month yet.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Budget vs Actual</h2>
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
          </section>
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
            icon={PiggyBank}
            title="Savings Goals"
            description="Set shared or personal savings targets and track progress here soon."
          />
        </div>
      </div>
    </div>
  );
}
