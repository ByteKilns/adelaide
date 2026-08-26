// src/modules/dashboard/lib/cash-flow.test.ts
import { describe, expect, it } from "vitest";

import {
  type CashFlowEvent,
  dailyCashFlowPoints,
  dhukuCashFlow,
  loanPaymentCashFlow,
  netMonthlyOutflow,
} from "./cash-flow";

describe("dhukuCashFlow", () => {
  it("treats a contribution as outgoing and a payout as incoming", () => {
    const events = dhukuCashFlow([
      { amount: "1000", date: "2026-02-05", type: "contribution" },
      { amount: "13000", date: "2026-02-20", type: "payout" },
    ]);

    expect(events).toEqual([
      { amount: 1000, date: "2026-02-05", direction: "out" },
      { amount: 13000, date: "2026-02-20", direction: "in" },
    ]);
  });
});

describe("loanPaymentCashFlow", () => {
  it("treats a payment on a 'taken' loan as outgoing", () => {
    const events = loanPaymentCashFlow(
      [{ amount: "500", date: "2026-02-10", loanId: "l1" }],
      [{ direction: "taken", id: "l1" }],
    );
    expect(events).toEqual([{ amount: 500, date: "2026-02-10", direction: "out" }]);
  });

  it("treats a payment on a 'given' loan as incoming", () => {
    const events = loanPaymentCashFlow(
      [{ amount: "500", date: "2026-02-10", loanId: "l1" }],
      [{ direction: "given", id: "l1" }],
    );
    expect(events).toEqual([{ amount: 500, date: "2026-02-10", direction: "in" }]);
  });

  it("skips payments whose loan isn't in the provided list", () => {
    const events = loanPaymentCashFlow([{ amount: "500", date: "2026-02-10", loanId: "missing" }], []);
    expect(events).toEqual([]);
  });
});

describe("dailyCashFlowPoints", () => {
  it("buckets expenses and events by day, and places income on day 1", () => {
    const expenseRows = [
      { amount: "200", date: "2026-02-03" },
      { amount: "150", date: "2026-02-03" },
      { amount: "1000", date: "2026-01-15" }, // different month, excluded
    ];
    const incomeRows = [{ amount: "50000" }, { amount: "10000" }];
    const events: CashFlowEvent[] = [
      { amount: 1000, date: "2026-02-05", direction: "out" },
      { amount: 13000, date: "2026-02-20", direction: "in" },
      { amount: 999, date: "2026-03-01", direction: "out" }, // different month, excluded
    ];

    const points = dailyCashFlowPoints(expenseRows, incomeRows, events, 2026, 2, "english");

    expect(points).toHaveLength(28); // Feb 2026 is not a leap year
    expect(points[0]).toEqual({ date: "2026-02-01", day: 1, in: 60000, out: 0 });
    expect(points[2]).toEqual({ date: "2026-02-03", day: 3, in: 0, out: 350 });
    expect(points[4]).toEqual({ date: "2026-02-05", day: 5, in: 0, out: 1000 });
    expect(points[19]).toEqual({ date: "2026-02-20", day: 20, in: 13000, out: 0 });
  });

  it("returns a zeroed point for every day even with no data", () => {
    const points = dailyCashFlowPoints([], [], [], 2026, 4, "english");
    expect(points).toHaveLength(30);
    expect(points.every((p) => p.in === 0 && p.out === 0)).toBe(true);
  });
});

describe("netMonthlyOutflow", () => {
  it("sums outgoing minus incoming for the given month only", () => {
    const events: CashFlowEvent[] = [
      { amount: 1000, date: "2026-02-05", direction: "out" },
      { amount: 500, date: "2026-02-10", direction: "out" },
      { amount: 13000, date: "2026-02-20", direction: "in" },
      { amount: 999, date: "2026-03-01", direction: "out" },
    ];

    expect(netMonthlyOutflow(events, 2026, 2, "english")).toBe(1000 + 500 - 13000);
  });

  it("returns 0 for a month with no events", () => {
    expect(netMonthlyOutflow([], 2026, 2, "english")).toBe(0);
  });
});
