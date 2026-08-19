import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { getBudgetItemsForMonth, getIncomesForMonth } from "@/modules/budget/api/budget.actions";
import { AllocationSummaryCard } from "@/modules/budget/components/AllocationSummaryCard";
import { BudgetGroups } from "@/modules/budget/components/BudgetGroups";
import { BudgetHeader } from "@/modules/budget/components/BudgetHeader";
import { BudgetHealthCard } from "@/modules/budget/components/BudgetHealthCard";
import { BudgetSummaryCards } from "@/modules/budget/components/BudgetSummaryCards";
import { RecommendationsCard } from "@/modules/budget/components/RecommendationsCard";
import { TopBudgetCategoriesCard } from "@/modules/budget/components/TopBudgetCategoriesCard";
import { budgetGroups, topBudgetCategories } from "@/modules/budget/lib/budget-groups";
import { budgetVsActual } from "@/modules/budget/lib/calculations";
import { listCategories } from "@/modules/categories/api/categories";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";

export async function BudgetPage() {
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, incomes, budgetItems, expenseRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
  ]);

  const memberList = members.map((m) => ({ id: m.id, name: m.user.name }));
  const combinedIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);

  const vsActual = budgetVsActual(
    budgetItems.map((b) => ({
      categoryId: b.categoryId,
      ownerMemberId: b.ownerMemberId,
      plannedAmount: Number(b.plannedAmount),
    })),
    expenseRows.map((e) => ({
      amount: Number(e.amount),
      categoryId: e.categoryId,
      ownerMemberId: e.ownerMemberId,
    })),
  );

  const groups = budgetGroups(vsActual, categories, memberList, memberId);
  const topCategories = topBudgetCategories(groups, 5);

  const totalBudget = groups.reduce((s, g) => s + g.totalPlanned, 0);
  // No separate "target budget" concept exists in the schema (distinct from
  // the sum of per-category allocations), so Total Budget and Allocated are
  // intentionally the same figure here.
  const allocated = totalBudget;
  const unallocated = combinedIncome - allocated;

  const incomesByMember = Object.fromEntries(incomes.map((i) => [i.memberId, Number(i.amount)]));
  // Keyed by categoryId -> ownerKey ("shared" or a memberId) -> plannedAmount,
  // since a category can have a separate budget_items row per owner for the
  // same month (e.g. "Groceries" shared AND owned by each member at once).
  const itemsByCategory: Record<string, Record<string, number>> = {};
  for (const b of budgetItems) {
    const ownerKey = b.ownerMemberId ?? "shared";
    itemsByCategory[b.categoryId] ??= {};
    itemsByCategory[b.categoryId][ownerKey] = Number(b.plannedAmount);
  }

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <BudgetHeader monthLabel={monthLabel} />

      <BudgetSummaryCards
        allocated={allocated}
        combinedIncome={combinedIncome}
        totalBudget={totalBudget}
        unallocated={unallocated}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BudgetGroups
            categories={categories}
            groups={groups}
            incomesByMember={incomesByMember}
            itemsByCategory={itemsByCategory}
            members={memberList}
            month={month}
            realMemberId={memberId}
            year={year}
          />
        </div>

        <div className="space-y-6">
          <BudgetHealthCard allocated={allocated} combinedIncome={combinedIncome} unallocated={unallocated} />
          <AllocationSummaryCard groups={groups} />
          <TopBudgetCategoriesCard categories={topCategories} />
          <RecommendationsCard />
        </div>
      </div>
    </div>
  );
}
