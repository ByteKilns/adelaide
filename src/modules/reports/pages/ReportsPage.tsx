import { formatBsMonthYear } from "@/lib/nepali-date";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { getBudgetItemsForMonth, getIncomesForMonth, listAllIncomes } from "@/modules/budget/api/budget.actions";
import { listCategories } from "@/modules/categories/api/categories";
import { pctOfIncome } from "@/modules/dashboard/lib/format";
import { listExpensesForMonth, listExpensesForRange } from "@/modules/expenses/api/expenses.actions";
import { ownerBreakdown, topCategories } from "@/modules/expenses/lib/expense-breakdown";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";
import { ReportsHeader } from "@/modules/reports/components/ReportsHeader";
import { ReportsTabs } from "@/modules/reports/components/ReportsTabs";
import { categoryBreakdown, daysLeftInMonth, monthlyIncomeExpenseTrend, safeToSpendToday, spendingInsight } from "@/modules/reports/lib/reports-stats";
import { listSavingsContributions, listSavingsGoals } from "@/modules/savings-goals/api/savings-goals.actions";
import { buildContributionEntries, buildGoalCards, monthlyTotals, savingsOverviewStats } from "@/modules/savings-goals/lib/savings-stats";

function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export async function ReportsPage() {
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prev = previousMonth(year, month);

  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const rangeEnd = new Date(year, month, 0).toISOString().slice(0, 10);

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
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    listAllIncomes(),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
    listExpensesForMonth(prev.year, prev.month),
    listExpensesForRange(rangeStart, rangeEnd),
    listSavingsGoals(householdId),
    listSavingsContributions(householdId),
  ]);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const partner = members.find((m) => m.id !== memberId) ?? null;
  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";
  const memberName = (id: string) => memberById.get(id)?.user.name ?? "Unknown";

  const expenses = expenseRows.map((e) => ({
    amount: Number(e.amount),
    categoryId: e.categoryId,
    ownerMemberId: e.ownerMemberId,
  }));
  const combinedIncome = incomeRows.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const prevTotalExpenses = prevExpenseRows.reduce((s, e) => s + Number(e.amount), 0);

  const expenseTableRows = expenseRows.map((e) => ({
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

  const ownerSlices = ownerBreakdown(
    expenses,
    members.map((m) => ({ id: m.id, name: m.user.name })),
    memberId,
  );
  const topCats = topCategories(expenses, categories, 5).map((c) => ({
    ...c,
    groupName: category(c.categoryId)?.groupName ?? "",
  }));
  const expenseSlices = categoryBreakdown(expenses, categories, 5);

  const rangeExpenses = rangeExpenseRows.map((e) => ({ amount: Number(e.amount), date: e.date }));
  const allIncomes = allIncomeRows.map((i) => ({ amount: Number(i.amount), month: i.month, year: i.year }));
  const trendPoints = monthlyIncomeExpenseTrend(allIncomes, rangeExpenses, 6);

  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month);
  const daysLeft = daysLeftInMonth(year, month);
  const insightMessage = spendingInsight(totalExpenses, prevTotalExpenses);

  const incomeSlices = members.map((m) => ({
    amount: incomeRows.filter((i) => i.memberId === m.id).reduce((s, i) => s + Number(i.amount), 0),
    key: (m.id === memberId ? "me" : "partner") as "me" | "partner",
    label: m.id === memberId ? "Me" : m.user.name,
    tone: (m.id === memberId ? "green" : "orange") as "green" | "orange",
  }));

  const contributions = contributionRows.map((c) => ({ amount: Number(c.amount), date: c.date, goalId: c.goalId }));
  const { goals, statusCounts } = buildGoalCards(goalRows, contributions, memberById);
  const savingsStats = savingsOverviewStats(
    goalRows.map((g) => ({ createdAt: g.createdAt, id: g.id, targetAmount: Number(g.targetAmount), targetDate: g.targetDate })),
    contributions,
    year,
    month,
  );
  const savingsVsLastMonthPct =
    savingsStats.lastMonthContribution > 0
      ? Math.round(
          ((savingsStats.monthlyContribution - savingsStats.lastMonthContribution) / savingsStats.lastMonthContribution) * 100,
        )
      : null;
  const savingsPoints = monthlyTotals(contributions, 6);
  const recentContributions = buildContributionEntries(contributionRows, goalRows, memberById, memberId);

  const monthLabel = formatBsMonthYear(now.toISOString().slice(0, 10));
  const exportRows = expenseRows.map((e) => ({
    amount: Number(e.amount),
    category: categoryName(e.categoryId),
    date: e.date,
    name: e.note ?? categoryName(e.categoryId),
    owner: e.ownerMemberId ? roleForOwner(e.ownerMemberId, memberId) : "shared",
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <ReportsHeader exportRows={exportRows} monthLabel={monthLabel} />

      <ReportsTabs
        combinedIncome={combinedIncome}
        daysLeft={daysLeft}
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
        safeToSpend={safeToSpend}
        savingsAverageProgress={savingsStats.averageProgress}
        savingsMonthlyContribution={savingsStats.monthlyContribution}
        savingsPoints={savingsPoints}
        savingsVsLastMonthPct={savingsVsLastMonthPct}
        topCategories={topCats}
        totalExpenses={totalExpenses}
        trendPoints={trendPoints}
      />
    </div>
  );
}
