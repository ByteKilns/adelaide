import { describe, expect, it } from "vitest";

import { hasExactMatch, searchCategories } from "./category-search";

const CATEGORIES = [
  { groupName: "Household", id: "1", name: "Groceries" },
  { groupName: "Transportation", id: "2", name: "Petrol" },
  { groupName: "Lifestyle", id: "3", name: "Dining Out" },
];

describe("searchCategories", () => {
  it("returns all categories for an empty query", () => {
    expect(searchCategories(CATEGORIES, "")).toEqual(CATEGORIES);
  });

  it("returns an empty array when there are no categories", () => {
    expect(searchCategories([], "grocery")).toEqual([]);
  });

  it("ranks an exact name match first", () => {
    const results = searchCategories(CATEGORIES, "Petrol");
    expect(results[0]?.name).toBe("Petrol");
  });

  it("tolerates typos", () => {
    const results = searchCategories(CATEGORIES, "pertrol");
    expect(results[0]?.name).toBe("Petrol");
  });

  it("matches a partial/substring query regardless of position", () => {
    const results = searchCategories(CATEGORIES, "grocery");
    expect(results[0]?.name).toBe("Groceries");
  });

  it("matches via group name when the name itself doesn't match", () => {
    const results = searchCategories(CATEGORIES, "Household");
    expect(results[0]?.name).toBe("Groceries");
  });

  it("returns no results for a query unrelated to any category", () => {
    expect(searchCategories(CATEGORIES, "xyz123")).toEqual([]);
  });
});

describe("hasExactMatch", () => {
  it("is true for a case-insensitive exact name match", () => {
    expect(hasExactMatch(CATEGORIES, "petrol")).toBe(true);
  });

  it("is false for a partial match", () => {
    expect(hasExactMatch(CATEGORIES, "Petr")).toBe(false);
  });

  it("is false for an empty query", () => {
    expect(hasExactMatch(CATEGORIES, "")).toBe(false);
  });
});
