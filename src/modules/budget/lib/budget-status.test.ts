import { describe, expect, it } from "vitest";

import { computeBudgetStatus } from "./budget-status";

describe("computeBudgetStatus", () => {
  it("returns 'No budget set' when there's spend but no planned amount", () => {
    expect(computeBudgetStatus(0, 500)).toEqual({ label: "No budget set", pct: 100, variant: "outline" });
  });

  it("returns 'On track' when there's no planned amount and no spend", () => {
    expect(computeBudgetStatus(0, 0)).toEqual({ label: "On track", pct: 0, variant: "default" });
  });

  it("returns 'Over budget' when spend meets or exceeds a real planned amount", () => {
    expect(computeBudgetStatus(1000, 1200)).toEqual({ label: "Over budget", pct: 120, variant: "destructive" });
  });

  it("returns 'Over budget' at exactly 100% of a real planned amount", () => {
    expect(computeBudgetStatus(1000, 1000)).toEqual({ label: "Over budget", pct: 100, variant: "destructive" });
  });

  it("returns 'Approaching limit' between 80% and 99% of a real planned amount", () => {
    expect(computeBudgetStatus(1000, 850)).toEqual({ label: "Approaching limit", pct: 85, variant: "secondary" });
  });

  it("returns 'Approaching limit' at exactly 80% of a real planned amount", () => {
    expect(computeBudgetStatus(1000, 800)).toEqual({ label: "Approaching limit", pct: 80, variant: "secondary" });
  });

  it("returns 'On track' below 80% of a real planned amount", () => {
    expect(computeBudgetStatus(1000, 400)).toEqual({ label: "On track", pct: 40, variant: "default" });
  });
});
