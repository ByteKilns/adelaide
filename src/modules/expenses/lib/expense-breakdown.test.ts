import { describe, expect, it } from "vitest";

import { ownerBreakdown, topCategories } from "./expense-breakdown";

describe("ownerBreakdown", () => {
  it("splits expenses into shared, me, and partner totals", () => {
    const expenses = [
      { amount: 100, ownerMemberId: null },
      { amount: 50, ownerMemberId: "alice" },
      { amount: 25, ownerMemberId: "alice" },
      { amount: 200, ownerMemberId: "bob" },
    ];
    const members = [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ];

    const result = ownerBreakdown(expenses, members, "alice");

    expect(result).toEqual([
      { amount: 100, key: "shared", label: "Shared", tone: "blue" },
      { amount: 75, key: "me", label: "Me", tone: "green" },
      { amount: 200, key: "partner", label: "Bob", tone: "orange" },
    ]);
  });

  it("omits the partner slice when the household has only one member", () => {
    const expenses = [{ amount: 40, ownerMemberId: "alice" }];
    const members = [{ id: "alice", name: "Alice" }];

    const result = ownerBreakdown(expenses, members, "alice");

    expect(result).toEqual([
      { amount: 0, key: "shared", label: "Shared", tone: "blue" },
      { amount: 40, key: "me", label: "Me", tone: "green" },
    ]);
  });

  it("returns all-zero amounts for an empty expense list", () => {
    const members = [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ];

    const result = ownerBreakdown([], members, "alice");

    expect(result).toEqual([
      { amount: 0, key: "shared", label: "Shared", tone: "blue" },
      { amount: 0, key: "me", label: "Me", tone: "green" },
      { amount: 0, key: "partner", label: "Bob", tone: "orange" },
    ]);
  });
});

describe("topCategories", () => {
  it("sorts categories by spend descending and caps at the limit", () => {
    const expenses = [
      { amount: 100, categoryId: "groceries" },
      { amount: 50, categoryId: "groceries" },
      { amount: 300, categoryId: "rent" },
      { amount: 20, categoryId: "fun" },
    ];
    const categories = [
      { id: "groceries", name: "Groceries" },
      { id: "rent", name: "Rent" },
      { id: "fun", name: "Fun" },
    ];

    const result = topCategories(expenses, categories, 2);

    expect(result).toEqual([
      { amount: 300, barPct: 100, categoryId: "rent", name: "Rent" },
      { amount: 150, barPct: 50, categoryId: "groceries", name: "Groceries" },
    ]);
  });

  it("returns an empty array for no expenses", () => {
    expect(topCategories([], [], 5)).toEqual([]);
  });

  it("falls back to \"Unknown\" for a categoryId with no matching category", () => {
    const expenses = [{ amount: 10, categoryId: "ghost" }];

    const result = topCategories(expenses, [], 5);

    expect(result).toEqual([{ amount: 10, barPct: 100, categoryId: "ghost", name: "Unknown" }]);
  });
});
