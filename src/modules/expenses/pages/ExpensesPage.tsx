import { formatBsMonthYear } from "@/lib/nepali-date";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { getBudgetItemsForMonth, getIncomesForMonth } from "@/modules/budget/api/budget.actions";
import { listCategories } from "@/modules/categories/api/categories";
import { pctOfIncome } from "@/modules/dashboard/lib/format";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";
import { ExpenseFilters } from "@/modules/expenses/components/ExpenseFilters";
import { ExpenseHeader } from "@/modules/expenses/components/ExpenseHeader";
import { ExpenseSummaryCard } from "@/modules/expenses/components/ExpenseSummaryCard";
import { ExpenseTable } from "@/modules/expenses/components/ExpenseTable";
import { TopCategoriesCard } from "@/modules/expenses/components/TopCategoriesCard";
import { ownerBreakdown, topCategories } from "@/modules/expenses/lib/expense-breakdown";
import { SafeToSpendCard } from "@/modules/reports/components/SafeToSpendCard";
import { daysLeftInMonth, safeToSpendToday } from "@/modules/reports/lib/reports-stats";

export async function ExpensesPage() {
  const { householdId, memberId } = await getEffectiveMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, expenseRows, incomeRows, budgetItemRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listExpensesForMonth(year, month),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
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

  const slices = ownerBreakdown(
    expenses,
    members.map((m) => ({ id: m.id, name: m.user.name })),
    memberId,
  );
  const topCats = topCategories(expenses, categories, 5).map((c) => ({
    ...c,
    groupName: category(c.categoryId)?.groupName ?? "",
  }));

  const monthLabel = formatBsMonthYear(now.toISOString().slice(0, 10));
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month);
  const daysLeft = daysLeftInMonth(year, month);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <ExpenseHeader monthLabel={monthLabel} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ExpenseFilters />
          <ExpenseTable partnerName={partner?.user.name ?? null} realMemberId={memberId} rows={rows} />
        </div>

        <div className="space-y-6">
          <ExpenseSummaryCard
            pctOfIncome={pctOfIncome(totalExpenses, combinedIncome)}
            slices={slices}
            total={totalExpenses}
          />
          <TopCategoriesCard categories={topCats} />
          <SafeToSpendCard
            daysLeft={daysLeft}
            monthLabel={monthLabel}
            safeToSpend={safeToSpend}
            totalActual={totalExpenses}
            totalPlanned={totalPlanned}
          />
        </div>
      </div>
    </div>
  );
}
