// src/modules/dashboard/lib/cash-flow.ts
export type CashFlowDirection = "in" | "out";
export type CashFlowEvent = { amount: number; date: string; direction: CashFlowDirection };

export type DhukuEntryRow = { amount: string; date: string; type: "contribution" | "payout" };

export function dhukuCashFlow(entries: DhukuEntryRow[]): CashFlowEvent[] {
  return entries.map((e) => ({
    amount: Number(e.amount),
    date: e.date,
    direction: e.type === "payout" ? "in" : "out",
  }));
}

export type LoanPaymentRow = { amount: string; date: string; loanId: string };
export type LoanDirectionRow = { direction: "given" | "taken"; id: string };

export function loanPaymentCashFlow(payments: LoanPaymentRow[], loans: LoanDirectionRow[]): CashFlowEvent[] {
  const directionByLoanId = new Map(loans.map((l) => [l.id, l.direction]));
  return payments
    .filter((p) => directionByLoanId.has(p.loanId))
    .map((p) => ({
      amount: Number(p.amount),
      date: p.date,
      direction: directionByLoanId.get(p.loanId) === "given" ? ("in" as const) : ("out" as const),
    }));
}

function isInMonth(dateStr: string, year: number, month: number): boolean {
  const [y, m] = dateStr.split("-").map(Number);
  return y === year && m === month;
}

export type ExpenseRow = { amount: string; date: string };
export type IncomeRow = { amount: string };
export type DayPoint = { date: string; day: number; in: number; out: number };

// One point per calendar day of the given AD month. Expenses and events
// are bucketed by their own date; income rows only carry month/year (no
// day), so the month's total income is placed on day 1 by convention
// rather than spread out or estimated. Each point carries its full AD
// `date` (not just the bare day-of-month number) so callers can render it
// in the user's preferred calendar — an AD month's days don't correspond
// to a single BS month, so a bare day number is ambiguous without it.
export function dailyCashFlowPoints(
  expenseRows: ExpenseRow[],
  incomeRows: IncomeRow[],
  events: CashFlowEvent[],
  year: number,
  month: number,
): DayPoint[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const points: DayPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    day: i + 1,
    in: 0,
    out: 0,
  }));

  const incomeTotal = incomeRows.reduce((sum, i) => sum + Number(i.amount), 0);
  if (incomeTotal > 0) points[0].in += incomeTotal;

  for (const e of expenseRows) {
    if (!isInMonth(e.date, year, month)) continue;
    const day = Number(e.date.split("-")[2]);
    points[day - 1].out += Number(e.amount);
  }

  for (const ev of events) {
    if (!isInMonth(ev.date, year, month)) continue;
    const day = Number(ev.date.split("-")[2]);
    if (ev.direction === "in") {
      points[day - 1].in += ev.amount;
    } else {
      points[day - 1].out += ev.amount;
    }
  }

  return points;
}

// Net outgoing (positive) or net incoming (negative) dhuku/loan cash flow
// for the given month — folded into Safe to Spend's totalActual alongside
// category expenses, since it's real money the household doesn't have
// available to spend (or does, in the case of a payout), even though it
// isn't a budgeted category.
export function netMonthlyOutflow(events: CashFlowEvent[], year: number, month: number): number {
  return events
    .filter((e) => isInMonth(e.date, year, month))
    .reduce((sum, e) => sum + (e.direction === "out" ? e.amount : -e.amount), 0);
}
