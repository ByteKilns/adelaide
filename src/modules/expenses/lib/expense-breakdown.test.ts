import { describe, expect, it } from "vitest";

import { ownerBreakdown } from "./expense-breakdown";

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
