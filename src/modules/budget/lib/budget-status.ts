export type BudgetStatusVariant = "default" | "secondary" | "destructive";

export type BudgetStatus = {
  label: string;
  pct: number;
  variant: BudgetStatusVariant;
};

// Shared by BudgetCard and BudgetVsActualTable so the two views can never
// disagree on what counts as "over budget" vs "approaching limit."
export function computeBudgetStatus(planned: number, actual: number): BudgetStatus {
  // planned can be 0 for a category with untracked/uncovered spend (no
  // budget item set for it this month). Any actual spend against a 0-planned
  // category is unambiguously over budget, so treat it as >=100% rather than
  // letting the plain division guard collapse it to 0% ("On track").
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : actual > 0 ? 100 : 0;
  if (pct >= 100) return { label: "Over budget", variant: "destructive", pct };
  if (pct >= 80) return { label: "Approaching limit", variant: "secondary", pct };
  return { label: "On track", variant: "default", pct };
}
