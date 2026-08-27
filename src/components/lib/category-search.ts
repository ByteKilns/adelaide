import Fuse from "fuse.js";

export type CategoryMatchInput = { groupName: string; id: string; name: string };

const FUSE_OPTIONS = {
  ignoreLocation: true,
  keys: [
    { name: "name", weight: 1 },
    { name: "groupName", weight: 0.3 },
  ],
  threshold: 0.4,
};

// Fuzzy-ranked matches for a search query. Empty query returns the full
// list unsorted, matching the plain dropdown's current behavior.
export function searchCategories<T extends CategoryMatchInput>(categories: T[], query: string): T[] {
  const trimmed = query.trim();
  if (!trimmed) return categories;

  return new Fuse(categories, FUSE_OPTIONS).search(trimmed).map((result) => result.item);
}

// True when `query` case-insensitively equals an existing category's name
// exactly — used to auto-highlight that result and suppress the
// "add as new category" row.
export function hasExactMatch<T extends CategoryMatchInput>(categories: T[], query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;

  return categories.some((c) => c.name.toLowerCase() === trimmed);
}
