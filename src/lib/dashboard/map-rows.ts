// Pure row-shaping helpers: reshape raw DB rows (with numeric-as-string
// columns) into the plain-number input shapes expected by
// src/lib/calculations/budget.ts. Shared between current-month and
// previous-month mapping in the dashboard page so the three shapes are only
// defined once.

export function toIncomeInputs(rows: { memberId: string; amount: string }[]) {
  return rows.map((i) => ({ memberId: i.memberId, amount: Number(i.amount) }));
}

export function toExpenseInputs(
  rows: { categoryId: string; ownerMemberId: string | null; amount: string }[],
) {
  return rows.map((e) => ({
    categoryId: e.categoryId,
    ownerMemberId: e.ownerMemberId,
    amount: Number(e.amount),
  }));
}

export function toBudgetItemInputs(
  rows: { categoryId: string; ownerMemberId: string | null; plannedAmount: string }[],
) {
  return rows.map((b) => ({
    categoryId: b.categoryId,
    ownerMemberId: b.ownerMemberId,
    plannedAmount: Number(b.plannedAmount),
  }));
}
