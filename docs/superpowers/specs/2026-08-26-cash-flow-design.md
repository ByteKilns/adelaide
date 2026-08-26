# Cash flow: dhuku/loans in Safe to Spend, and a daily Home chart

## Problem

Dhuku entries and loan payments are currently invisible to the rest of the
app's money math. A dhuku contribution is real money leaving your pocket
that month, and a payout is a real lump sum coming in, but neither touches
Safe to Spend, the dashboard summary, or any chart. Loan payments have the
same gap. The user wants both reflected honestly, plus a way to see the
shape of a month's cash movement at a glance.

## Scope decisions (from brainstorming)

- Dhuku contributions/payouts and loan payments **do** reduce/increase
  Safe to Spend, same as a real expense would — not just shown separately.
- Loan payment direction is derived from the parent loan's existing
  `direction` field (`"given"` → incoming, `"taken"` → outgoing) — nothing
  new to log, no schema change to loans/loan_payments.
- No changes to the `expenses`/`incomes` tables and no changes to how
  Budget-vs-Actual or category reports work — this only affects the
  household-level Safe to Spend number and the new Home chart.
- New chart shows **daily bars for the current month** (income/payouts up,
  expenses/dhuku contributions/outgoing loan payments down), placed on
  Home under the summary cards. This complements, not replaces, the
  existing 6-month `IncomeExpenseTrendCard` line chart in Reports.
- Loan payments are in scope for both Safe to Spend and the chart (not
  deferred), per explicit choice during brainstorming.

## New calculation module

`src/modules/dashboard/lib/cash-flow.ts` — pure functions, unit tested,
following the same row-shaping pattern as `budget/lib/calculations.ts`.

```ts
export type CashFlowDirection = "in" | "out";
export type CashFlowEvent = { amount: number; date: string; direction: CashFlowDirection };

export type DhukuEntryRow = { amount: string; date: string; type: "contribution" | "payout" };
export function dhukuCashFlow(entries: DhukuEntryRow[]): CashFlowEvent[];

export type LoanPaymentRow = { amount: string; date: string; loanId: string };
export type LoanDirectionRow = { direction: "given" | "taken"; id: string };
export function loanPaymentCashFlow(payments: LoanPaymentRow[], loans: LoanDirectionRow[]): CashFlowEvent[];

export type DayPoint = { day: number; in: number; out: number };
// One point per calendar day of the given month. Combines expenses (out),
// incomes (in, placed on day 1 since income rows only carry month/year),
// and the pre-normalized dhuku/loan CashFlowEvent[] for that month.
export function dailyCashFlowPoints(
  expenseRows: { amount: number; date: string }[],
  incomeRows: { amount: number }[],
  otherEvents: CashFlowEvent[],
  year: number,
  month: number,
): DayPoint[];

// Sum of this month's dhuku + loan cash flow, net (outflow positive,
// inflow negative) — folded into Safe to Spend's totalActual alongside
// category expenses.
export function netMonthlyOutflow(events: CashFlowEvent[]): number;
```

## Safe to Spend integration

In `DashboardPage` (`src/modules/dashboard/index.tsx`), fetch this month's
dhuku entries and loan payments (+ loan directions), build `CashFlowEvent[]`
via `dhukuCashFlow`/`loanPaymentCashFlow`, and pass
`summary.totalExpenses + netMonthlyOutflow(events)` as `totalActual` into
`safeToSpendToday` instead of `summary.totalExpenses` alone. `SummaryCards`'
`totalExpenses`/`unallocated` display stays based on category expenses only
(unchanged) — only the Safe to Spend number absorbs dhuku/loan cash flow,
since that's the one the user explicitly asked to make honest; the summary
cards continue to describe *budgeted category* spend, which dhuku/loans
were never part of.

## New chart: DailyCashFlowChart

`src/modules/dashboard/components/DailyCashFlowChart.tsx` — recharts
`BarChart`, one point per day of the current month from
`dailyCashFlowPoints`. "Out" values are negated before charting so the bar
extends below a zero baseline (a `ReferenceLine` at 0), "in" values extend
above it — a single diverging bar chart, not two side-by-side series.
Placed as a full-width card in `DashboardPage`, directly under
`SummaryCards` and above the existing two-column Overview/RecentExpenses
grid.

## Non-goals

- No changes to Budget-vs-Actual, category reports, or the existing
  Reports `IncomeExpenseTrendCard`.
- No UI for viewing this chart for a past/future month — current month
  only, matching the existing Dashboard's default view (the page already
  supports month navigation for its other cards; the chart is not wired
  to that nav in this pass).
- Income rows only carry month/year, not a day — they're plotted on day 1
  of the month by convention, not spread out or estimated.

## Testing

- `cash-flow.test.ts` covering `dhukuCashFlow` (contribution vs payout
  direction), `loanPaymentCashFlow` (direction lookup via `loanId`),
  `dailyCashFlowPoints` (correct day bucketing, income on day 1), and
  `netMonthlyOutflow` (net sign correctness).
- `npx tsc --noEmit` and `npm run build` as the completion gate.
