import { describe, expect, it } from "vitest";

import type { ExpenseRow } from "@/modules/expenses/hooks/useExpenseTableColumns";

import { defaultExpenseFilters, filterExpenseRows } from "./expense-filters";

const ME = "member-me";
const PARTNER = "member-partner";

function row(overrides: Partial<ExpenseRow>): ExpenseRow {
  return {
    amount: 100,
    categoryGroupName: "Household",
    categoryId: "cat-groceries",
    categoryName: "Groceries",
    date: "2026-08-15",
    id: "row-1",
    note: null,
    ownerMemberId: null,
    ownerName: null,
    paidByMemberId: ME,
    paidByName: "Me",
    ...overrides,
  };
}

describe("filterExpenseRows", () => {
  it("returns every row when no filters are active", () => {
    const rows = [row({ id: "a" }), row({ id: "b" })];
    expect(filterExpenseRows(rows, defaultExpenseFilters(ME))).toHaveLength(2);
  });

  it("filters by category id, ignoring name collisions across groups", () => {
    const rows = [
      row({ categoryId: "cat-groceries", id: "a" }),
      row({ categoryId: "cat-transport", id: "b" }),
    ];
    const result = filterExpenseRows(rows, { ...defaultExpenseFilters(ME), categoryId: "cat-transport" });
    expect(result.map((r) => r.id)).toEqual(["b"]);
  });

  it("filters to shared expenses when ownerFilter is 'shared'", () => {
    const rows = [
      row({ id: "shared", ownerMemberId: null }),
      row({ id: "owned", ownerMemberId: ME }),
    ];
    const result = filterExpenseRows(rows, { ...defaultExpenseFilters(ME), ownerFilter: "shared" });
    expect(result.map((r) => r.id)).toEqual(["shared"]);
  });

  it("filters to a specific owner's expenses when ownerFilter is a member id", () => {
    const rows = [
      row({ id: "mine", ownerMemberId: ME }),
      row({ id: "partners", ownerMemberId: PARTNER }),
      row({ id: "shared", ownerMemberId: null }),
    ];
    const result = filterExpenseRows(rows, { ...defaultExpenseFilters(ME), ownerFilter: PARTNER });
    expect(result.map((r) => r.id)).toEqual(["partners"]);
  });

  it("filters by who paid", () => {
    const rows = [
      row({ id: "paidByMe", paidByMemberId: ME }),
      row({ id: "paidByPartner", paidByMemberId: PARTNER }),
    ];
    const result = filterExpenseRows(rows, { ...defaultExpenseFilters(ME), paidByMemberId: PARTNER });
    expect(result.map((r) => r.id)).toEqual(["paidByPartner"]);
  });

  it("combines category, owner, and paid-by filters (all must match)", () => {
    const rows = [
      row({ categoryId: "cat-groceries", id: "match", ownerMemberId: ME, paidByMemberId: ME }),
      row({ categoryId: "cat-groceries", id: "wrong-owner", ownerMemberId: PARTNER, paidByMemberId: ME }),
      row({ categoryId: "cat-transport", id: "wrong-category", ownerMemberId: ME, paidByMemberId: ME }),
    ];
    const result = filterExpenseRows(rows, {
      ...defaultExpenseFilters(ME),
      categoryId: "cat-groceries",
      ownerFilter: ME,
      paidByMemberId: ME,
    });
    expect(result.map((r) => r.id)).toEqual(["match"]);
  });

  it("still honors the existing tab, date-range, and search filters", () => {
    const rows = [
      row({ date: "2026-08-01", id: "in-range", note: "milk" }),
      row({ date: "2026-08-31", id: "out-of-range", note: "milk" }),
      row({ date: "2026-08-10", id: "wrong-note", note: "rent" }),
    ];
    const result = filterExpenseRows(rows, {
      ...defaultExpenseFilters(ME),
      endDate: "2026-08-20",
      query: "milk",
      startDate: "2026-08-05",
    });
    expect(result).toHaveLength(0);

    const inRange = filterExpenseRows(rows, {
      ...defaultExpenseFilters(ME),
      endDate: "2026-08-05",
      query: "milk",
      startDate: "2026-07-31",
    });
    expect(inRange.map((r) => r.id)).toEqual(["in-range"]);
  });
});

describe("filterExpenseRows tab filter", () => {
  it("still honors the existing me/partner/shared tabs", () => {
    const rows = [
      row({ id: "mine", ownerMemberId: ME }),
      row({ id: "partners", ownerMemberId: PARTNER }),
      row({ id: "shared", ownerMemberId: null }),
    ];
    expect(filterExpenseRows(rows, { ...defaultExpenseFilters(ME), tab: "me" }).map((r) => r.id)).toEqual(["mine"]);
    expect(filterExpenseRows(rows, { ...defaultExpenseFilters(ME), tab: "partner" }).map((r) => r.id)).toEqual([
      "partners",
    ]);
    expect(filterExpenseRows(rows, { ...defaultExpenseFilters(ME), tab: "shared" }).map((r) => r.id)).toEqual([
      "shared",
    ]);
  });
});

describe("defaultExpenseFilters", () => {
  it("has no active filters and carries the given realMemberId", () => {
    expect(defaultExpenseFilters(ME)).toEqual({
      categoryId: "all",
      endDate: "",
      ownerFilter: "all",
      paidByMemberId: "all",
      query: "",
      realMemberId: ME,
      startDate: "",
      tab: "all",
    });
  });
});
