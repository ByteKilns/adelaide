export type BudgetStatusVariant = "default" | "destructive" | "outline" | "secondary";

export type BudgetStatus = {
  label: string;
  pct: number;
  variant: BudgetStatusVariant;
};

// Used by BudgetGroupTable so every category row in the Budget page agrees
// on what counts as "over budget" vs "approaching limit."
export function computeBudgetStatus(planned: number, actual: number): BudgetStatus {
  // planned can be 0 for a category with untracked/uncovered spend (no
  // budget item set for it this month). That's a distinct situation from a
  // real budget being exceeded — labeling it "No budget set" (neutral)
  // instead of "Over budget" (red) avoids implying the household did
  // something wrong when they simply haven't planned this category yet.
  if (planned <= 0 && actual > 0) {
    return { label: "No budget set", pct: 100, variant: "outline" };
  }
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  if (pct >= 100) return { label: "Over budget", variant: "destructive", pct };
  if (pct >= 80) return { label: "Approaching limit", variant: "secondary", pct };
  return { label: "On track", variant: "default", pct };
}
