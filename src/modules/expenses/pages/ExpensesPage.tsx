import { getDateFormatPref } from "@/lib/date-format-cookie";
import { nextMonth, parseMonthParam, previousMonth } from "@/lib/month-nav";
import { currentPeriodYearMonth, formatPeriodLabel, MAX_NAVIGABLE_YEAR, MIN_NAVIGABLE_YEAR, resolvePeriod } from "@/lib/month-period";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { getBudgetItemsForMonth, getIncomesForMonth, listAllIncomes } from "@/modules/budget/api/budget.actions";
import { listCategories } from "@/modules/categories/api/categories";
import { daysLeftInMonth, safeToSpendToday } from "@/modules/dashboard/lib/cash-flow";
import { pctOfIncome } from "@/modules/dashboard/lib/format";
import { listExpensesForMonth, listExpensesForRange } from "@/modules/expenses/api/expenses.actions";
import { ExpenseHeader } from "@/modules/expenses/components/ExpenseHeader";
import { ExpensesPageTabs } from "@/modules/expenses/components/ExpensesPageTabs";
import { ownerBreakdown } from "@/modules/expenses/lib/expense-breakdown";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";
import { SafeToSpendCard } from "@/modules/reports/components/SafeToSpendCard";
import { categoryBreakdown, dailySpendingPace, monthlyIncomeExpenseTrend } from "@/modules/reports/lib/reports-stats";

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

  let rangeStartYm = { month, year };
  for (let i = 0; i < 5; i++) rangeStartYm = previousMonth(rangeStartYm.year, rangeStartYm.month);
  const rangeStart = resolvePeriod(rangeStartYm.year, rangeStartYm.month, dateFormat).startDate;
  const rangeEnd = resolvePeriod(year, month, dateFormat).endDate;

  const [members, categories, expenseRows, incomeRows, budgetItemRows, allIncomeRows, rangeExpenseRows] =
    await Promise.all([
      getHouseholdMembers(householdId),
      listCategories(householdId),
      listExpensesForMonth(year, month, dateFormat),
      getIncomesForMonth(year, month),
      getBudgetItemsForMonth(year, month),
      listAllIncomes(),
      listExpensesForRange(rangeStart, rangeEnd),
    ]);

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";
  const memberName = (id: string) => members.find((m) => m.id === id)?.user.name ?? "Unknown";
  const partner = members.find((m) => m.id !== memberId) ?? null;

  const expenses = expenseRows.map((e) => ({
    amount: Number(e.amount),
    categoryId: e.categoryId,
    ownerMemberId: e.ownerMemberId,
  }));

  const combinedIncome = incomeRows.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

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

  const slices = ownerBreakdown(
    expenses,
    members.map((m) => ({ id: m.id, name: m.user.name })),
    memberId,
  );
  const expenseSlices = categoryBreakdown(expenses, categories, 5);

  const allIncomes = allIncomeRows.map((i) => ({ amount: Number(i.amount), month: i.month, year: i.year }));
  const rangeExpenses = rangeExpenseRows.map((e) => ({ amount: Number(e.amount), date: e.date }));
  const trendPoints = monthlyIncomeExpenseTrend(allIncomes, rangeExpenses, 6, dateFormat);

  const monthLabel = formatPeriodLabel(year, month, dateFormat);
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month, dateFormat);
  const daysLeft = daysLeftInMonth(year, month, dateFormat);
  const pacePoints = dailySpendingPace(
    expenseRows.map((e) => ({ amount: Number(e.amount), date: e.date })),
    year,
    month,
    totalPlanned,
    dateFormat,
  );

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

      <SafeToSpendCard
        daysLeft={daysLeft}
        monthLabel={monthLabel}
        safeToSpend={safeToSpend}
        totalActual={totalExpenses}
        totalPlanned={totalPlanned}
      />

      <ExpensesPageTabs
        categorySlices={expenseSlices}
        combinedIncome={combinedIncome}
        dateFormat={dateFormat}
        ownerSlices={slices}
        pacePoints={pacePoints}
        partnerName={partner?.user.name ?? null}
        pctOfIncome={pctOfIncome(totalExpenses, combinedIncome)}
        realMemberId={memberId}
        rows={rows}
        totalExpenses={totalExpenses}
        totalPlanned={totalPlanned}
        trendPoints={trendPoints}
      />
    </div>
  );
}
