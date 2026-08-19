// Pure calculation helpers for the dashboard / budget-vs-actual views.
//
// NOTE: This file was expected to already exist per the dashboard task spec
// (with signatures dashboardSummary(incomes, expenses) and
// budgetVsActual(budgetItems, expenses)), but it was not present in the
// codebase when this task started. It is added here as a minimal, pure
// module so the dashboard page has a real, testable calculation layer
// rather than inlining this logic into the page component.

export type IncomeInput = { amount: number; memberId: string; };
export type ExpenseInput = { amount: number; categoryId: string; ownerMemberId: string | null; };
export type BudgetItemInput = {
  categoryId: string;
  ownerMemberId: string | null;
  plannedAmount: number;
};

export type DashboardSummary = {
  combinedIncome: number;
  totalExpenses: number;
  unallocated: number;
};

export function dashboardSummary(
  incomes: IncomeInput[],
  expenses: ExpenseInput[],
): DashboardSummary {
  const combinedIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    combinedIncome,
    totalExpenses,
    unallocated: combinedIncome - totalExpenses,
  };
}

export type BudgetVsActualRow = {
  actual: number;
  categoryId: string;
  difference: number;
  ownerMemberId: string | null;
  planned: number;
};

// Sum of expense amounts for a given category + owner combination. Owner
// matching is exact (including null == "shared") so that a category which
// has separate budget lines per owner (e.g. "Groceries" owned by each
// member, plus a "Groceries" shared line) attributes actual spend to the
// correct line instead of double-counting across owners.
export function categorySpent(
  expenses: ExpenseInput[],
  categoryId: string,
  ownerMemberId: string | null,
): number {
  return expenses
    .filter((e) => e.categoryId === categoryId && e.ownerMemberId === ownerMemberId)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function budgetVsActual(
  budgetItems: BudgetItemInput[],
  expenses: ExpenseInput[],
): BudgetVsActualRow[] {
  const rows: BudgetVsActualRow[] = budgetItems.map((item) => {
    const actual = categorySpent(expenses, item.categoryId, item.ownerMemberId);
    return {
      categoryId: item.categoryId,
      ownerMemberId: item.ownerMemberId,
      planned: item.plannedAmount,
      actual,
      difference: item.plannedAmount - actual,
    };
  });

  // Expenses can be logged against a category+owner combination that has no
  // budget item for the month at all. Without surfacing those here, the
  // top-level totalExpenses (dashboardSummary) would include that spend
  // while every per-category card/table row silently omits it, so the
  // top-line total would never reconcile with the sum of card actuals.
  // Represent each such combination as a planned: 0 row so it shows up as
  // untracked/over-budget spend instead of vanishing. Use "::" (not "-") as
  // the composite-key separator since UUIDs themselves contain hyphens.
  const covered = new Set(
    budgetItems.map((b) => `${b.categoryId}::${b.ownerMemberId ?? "shared"}`),
  );

  const seenUncovered = new Set<string>();
  for (const e of expenses) {
    const key = `${e.categoryId}::${e.ownerMemberId ?? "shared"}`;
    if (covered.has(key) || seenUncovered.has(key)) continue;
    seenUncovered.add(key);
    const actual = categorySpent(expenses, e.categoryId, e.ownerMemberId);
    rows.push({
      categoryId: e.categoryId,
      ownerMemberId: e.ownerMemberId,
      planned: 0,
      actual,
      difference: -actual,
    });
  }

  return rows;
}
