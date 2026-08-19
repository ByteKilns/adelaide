import { describe, expect, it } from "vitest";

import { budgetGroups, topBudgetCategories } from "./budget-groups";

const categories = [
  { budgetType: "fixed" as const, id: "rent", name: "Rent" },
  { budgetType: "flexible" as const, id: "groceries", name: "Groceries" },
];
const members = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
];

describe("budgetGroups", () => {
  it("buckets items into me/partner/shared groups with correct totals", () => {
    const items = [
      { actual: 100, categoryId: "rent", ownerMemberId: null, planned: 150 },
      { actual: 50, categoryId: "groceries", ownerMemberId: "alice", planned: 60 },
      { actual: 30, categoryId: "groceries", ownerMemberId: "bob", planned: 40 },
    ];

    const groups = budgetGroups(items, categories, members, "alice");

    expect(groups).toEqual([
      {
        key: "me",
        label: "My Budget",
        rows: [{ actual: 50, budgetType: "flexible", categoryId: "groceries", categoryName: "Groceries", planned: 60 }],
        tone: "green",
        totalActual: 50,
        totalPlanned: 60,
      },
      {
        key: "partner",
        label: "Partner Budget",
        rows: [{ actual: 30, budgetType: "flexible", categoryId: "groceries", categoryName: "Groceries", planned: 40 }],
        tone: "orange",
        totalActual: 30,
        totalPlanned: 40,
      },
      {
        key: "shared",
        label: "Shared Budget",
        rows: [{ actual: 100, budgetType: "fixed", categoryId: "rent", categoryName: "Rent", planned: 150 }],
        tone: "blue",
        totalActual: 100,
        totalPlanned: 150,
      },
    ]);
  });

  it("omits the partner group when the household has only one member", () => {
    const items = [{ actual: 10, categoryId: "rent", ownerMemberId: null, planned: 20 }];

    const groups = budgetGroups(items, categories, [members[0]], "alice");

    expect(groups.map((g) => g.key)).toEqual(["me", "shared"]);
  });

  it("skips items whose category no longer exists", () => {
    const items = [{ actual: 10, categoryId: "ghost", ownerMemberId: null, planned: 20 }];

    const groups = budgetGroups(items, categories, members, "alice");

    expect(groups.every((g) => g.rows.length === 0)).toBe(true);
  });
});

describe("topBudgetCategories", () => {
  it("sorts by planned amount descending and computes spent-vs-planned pct", () => {
    const items = [
      { actual: 100, categoryId: "rent", ownerMemberId: null, planned: 150 },
      { actual: 50, categoryId: "groceries", ownerMemberId: "alice", planned: 60 },
    ];
    const groups = budgetGroups(items, categories, members, "alice");

    const result = topBudgetCategories(groups, 5);

    expect(result).toEqual([
      { actual: 100, categoryId: "rent", name: "Rent", pct: 67, planned: 150 },
      { actual: 50, categoryId: "groceries", name: "Groceries", pct: 83, planned: 60 },
    ]);
  });

  it("caps at the limit and excludes zero-planned rows", () => {
    const items = [{ actual: 5, categoryId: "rent", ownerMemberId: null, planned: 0 }];
    const groups = budgetGroups(items, categories, members, "alice");

    expect(topBudgetCategories(groups, 5)).toEqual([]);
  });
});
