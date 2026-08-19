import { describe, expect, it } from "vitest";

import {
  budgetVsActual,
  categorySpent,
  dashboardSummary,
  type BudgetItemInput,
  type ExpenseInput,
  type IncomeInput,
} from "./calculations";

describe("categorySpent", () => {
  it("sums only expenses matching both categoryId and ownerMemberId", () => {
    const expenses: ExpenseInput[] = [
      { categoryId: "groceries", ownerMemberId: "alice", amount: 50 },
      { categoryId: "groceries", ownerMemberId: "alice", amount: 25 },
      { categoryId: "groceries", ownerMemberId: "bob", amount: 100 },
      { categoryId: "rent", ownerMemberId: "alice", amount: 1000 },
    ];

    expect(categorySpent(expenses, "groceries", "alice")).toBe(75);
  });

  it("returns 0 when there are no matching expenses", () => {
    const expenses: ExpenseInput[] = [
      { categoryId: "groceries", ownerMemberId: "alice", amount: 50 },
    ];

    expect(categorySpent(expenses, "utilities", "alice")).toBe(0);
    expect(categorySpent([], "groceries", "alice")).toBe(0);
  });

  it("distinguishes shared (null owner) expenses from a specific owner's expenses in the same category", () => {
    const expenses: ExpenseInput[] = [
      { categoryId: "groceries", ownerMemberId: null, amount: 40 },
      { categoryId: "groceries", ownerMemberId: "alice", amount: 60 },
      { categoryId: "groceries", ownerMemberId: "bob", amount: 20 },
    ];

    expect(categorySpent(expenses, "groceries", null)).toBe(40);
    expect(categorySpent(expenses, "groceries", "alice")).toBe(60);
    expect(categorySpent(expenses, "groceries", "bob")).toBe(20);
  });

  it("does not sum across different categories with the same owner", () => {
    const expenses: ExpenseInput[] = [
      { categoryId: "groceries", ownerMemberId: "alice", amount: 30 },
      { categoryId: "rent", ownerMemberId: "alice", amount: 900 },
    ];

    expect(categorySpent(expenses, "groceries", "alice")).toBe(30);
    expect(categorySpent(expenses, "rent", "alice")).toBe(900);
  });
});

describe("dashboardSummary", () => {
  it("computes combined income, total expenses, and unallocated with realistic numbers", () => {
    const incomes: IncomeInput[] = [
      { memberId: "alice", amount: 4000 },
      { memberId: "bob", amount: 3500 },
    ];
    const expenses: ExpenseInput[] = [
      { categoryId: "rent", ownerMemberId: null, amount: 2000 },
      { categoryId: "groceries", ownerMemberId: "alice", amount: 400 },
      { categoryId: "entertainment", ownerMemberId: "bob", amount: 150 },
    ];

    const result = dashboardSummary(incomes, expenses);

    expect(result).toEqual({
      combinedIncome: 7500,
      totalExpenses: 2550,
      unallocated: 4950,
    });
  });

  it("returns all zeros for empty arrays with no division-by-zero or NaN issues", () => {
    const result = dashboardSummary([], []);

    expect(result).toEqual({
      combinedIncome: 0,
      totalExpenses: 0,
      unallocated: 0,
    });
    expect(Number.isNaN(result.unallocated)).toBe(false);
  });

  it("allows unallocated to be negative when overspent", () => {
    const incomes: IncomeInput[] = [{ memberId: "alice", amount: 1000 }];
    const expenses: ExpenseInput[] = [
      { categoryId: "rent", ownerMemberId: null, amount: 1500 },
    ];

    const result = dashboardSummary(incomes, expenses);

    expect(result).toEqual({
      combinedIncome: 1000,
      totalExpenses: 1500,
      unallocated: -500,
    });
  });
});

describe("budgetVsActual", () => {
  it("computes planned/actual/difference for a normal covered budget item", () => {
    const budgetItems: BudgetItemInput[] = [
      { categoryId: "groceries", ownerMemberId: "alice", plannedAmount: 300 },
    ];
    const expenses: ExpenseInput[] = [
      { categoryId: "groceries", ownerMemberId: "alice", amount: 120 },
      { categoryId: "groceries", ownerMemberId: "alice", amount: 80 },
    ];

    const rows = budgetVsActual(budgetItems, expenses);

    expect(rows).toEqual([
      {
        categoryId: "groceries",
        ownerMemberId: "alice",
        planned: 300,
        actual: 200,
        difference: 100,
      },
    ]);
  });

  it("synthesizes a planned: 0 row for an uncovered category+owner with expenses", () => {
    const budgetItems: BudgetItemInput[] = [
      { categoryId: "rent", ownerMemberId: null, plannedAmount: 2000 },
    ];
    const expenses: ExpenseInput[] = [
      { categoryId: "rent", ownerMemberId: null, amount: 2000 },
      { categoryId: "subscriptions", ownerMemberId: "bob", amount: 45 },
    ];

    const rows = budgetVsActual(budgetItems, expenses);

    expect(rows).toEqual([
      {
        categoryId: "rent",
        ownerMemberId: null,
        planned: 2000,
        actual: 2000,
        difference: 0,
      },
      {
        categoryId: "subscriptions",
        ownerMemberId: "bob",
        planned: 0,
        actual: 45,
        difference: -45,
      },
    ]);
  });

  it("does not synthesize a row for a category+owner that already has a budget item, even with plannedAmount 0", () => {
    const budgetItems: BudgetItemInput[] = [
      { categoryId: "misc", ownerMemberId: "alice", plannedAmount: 0 },
    ];
    const expenses: ExpenseInput[] = [
      { categoryId: "misc", ownerMemberId: "alice", amount: 25 },
    ];

    const rows = budgetVsActual(budgetItems, expenses);

    expect(rows).toEqual([
      {
        categoryId: "misc",
        ownerMemberId: "alice",
        planned: 0,
        actual: 25,
        difference: -25,
      },
    ]);
    expect(rows).toHaveLength(1);
  });

  it("does not create duplicate synthesized rows when multiple expenses hit the same uncovered category+owner", () => {
    const budgetItems: BudgetItemInput[] = [];
    const expenses: ExpenseInput[] = [
      { categoryId: "dining", ownerMemberId: "bob", amount: 30 },
      { categoryId: "dining", ownerMemberId: "bob", amount: 20 },
      { categoryId: "dining", ownerMemberId: "bob", amount: 10 },
    ];

    const rows = budgetVsActual(budgetItems, expenses);

    expect(rows).toEqual([
      {
        categoryId: "dining",
        ownerMemberId: "bob",
        planned: 0,
        actual: 60,
        difference: -60,
      },
    ]);
  });

  it("keeps shared (null owner) and per-member rows for the same category separate when covered by budget items", () => {
    const budgetItems: BudgetItemInput[] = [
      { categoryId: "groceries", ownerMemberId: null, plannedAmount: 100 },
      { categoryId: "groceries", ownerMemberId: "alice", plannedAmount: 200 },
    ];
    const expenses: ExpenseInput[] = [
      { categoryId: "groceries", ownerMemberId: null, amount: 90 },
      { categoryId: "groceries", ownerMemberId: "alice", amount: 150 },
    ];

    const rows = budgetVsActual(budgetItems, expenses);

    expect(rows).toEqual([
      {
        categoryId: "groceries",
        ownerMemberId: null,
        planned: 100,
        actual: 90,
        difference: 10,
      },
      {
        categoryId: "groceries",
        ownerMemberId: "alice",
        planned: 200,
        actual: 150,
        difference: 50,
      },
    ]);
  });

  it("keeps shared (null owner) and per-member rows for the same category separate when synthesized as uncovered", () => {
    const budgetItems: BudgetItemInput[] = [];
    const expenses: ExpenseInput[] = [
      { categoryId: "gifts", ownerMemberId: null, amount: 15 },
      { categoryId: "gifts", ownerMemberId: "bob", amount: 40 },
    ];

    const rows = budgetVsActual(budgetItems, expenses);

    expect(rows).toEqual([
      {
        categoryId: "gifts",
        ownerMemberId: null,
        planned: 0,
        actual: 15,
        difference: -15,
      },
      {
        categoryId: "gifts",
        ownerMemberId: "bob",
        planned: 0,
        actual: 40,
        difference: -40,
      },
    ]);
  });

  it("returns an empty array when there are no budget items and no expenses", () => {
    expect(budgetVsActual([], [])).toEqual([]);
  });
});
