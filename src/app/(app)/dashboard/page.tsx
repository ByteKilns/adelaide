import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/lib/data/categories";
import { getIncomesForMonth } from "@/lib/actions/income";
import { getBudgetItemsForMonth } from "@/lib/actions/budget";
import { listExpensesForMonth } from "@/lib/actions/expenses";
import { dashboardSummary, budgetVsActual } from "@/lib/calculations/budget";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { OwnerTabs } from "@/components/dashboard/owner-tabs";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetVsActualTable } from "@/components/budget/budget-vs-actual-table";

export default async function DashboardPage() {
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, incomeRows, budgetItemRows, expenseRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
  ]);

  const incomes = incomeRows.map((i) => ({ memberId: i.memberId, amount: Number(i.amount) }));
  const expenses = expenseRows.map((e) => ({
    categoryId: e.categoryId,
    ownerMemberId: e.ownerMemberId,
    amount: Number(e.amount),
  }));
  const budgetItems = budgetItemRows.map((b) => ({
    categoryId: b.categoryId,
    ownerMemberId: b.ownerMemberId,
    plannedAmount: Number(b.plannedAmount),
  }));

  const summary = dashboardSummary(incomes, expenses);
  const vsActual = budgetVsActual(budgetItems, expenses);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown";

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

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <SummaryCards {...summary} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Overview / Me / Partner / Shared</h2>
        <OwnerTabs views={ownerViews} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Budget cards</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vsActual.map((row) => (
            <BudgetCard
              key={`${row.categoryId}-${row.ownerMemberId ?? "shared"}`}
              categoryName={categoryName(row.categoryId)}
              planned={row.planned}
              actual={row.actual}
            />
          ))}
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
  );
}
