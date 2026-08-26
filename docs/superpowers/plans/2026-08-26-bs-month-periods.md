# BS-Native Month Periods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "a month" mean a real Bikram Sambat calendar month when the household's date format is Nepali (and a real AD month when English), consistently across Budget, Home, Expenses, Reports, and Recurring — not just labeled in BS while the underlying period stays AD (the bug fixed in an earlier, smaller pass).

**Architecture:** A new pure calculation module, `src/lib/month-period.ts`, is the single source of truth for month-period math (start/end AD dates, day counts, current-period checks, day-of-period bucketing), built entirely on the existing `BSToAD`/`ADToBS` conversions — it never hardcodes BS month lengths. Every function/page that currently does its own AD-only `Date` arithmetic for "days in month," "is this the current month," or "which day of the month" delegates to it instead, gaining a `dateFormat` parameter. `previousMonth`/`nextMonth` (month-to-month navigation) are unchanged — 12-month wraparound is identical in both calendars.

**Tech Stack:** Next.js App Router (Server Components), `bikram-sambat-js`, Vitest.

---

Read first: `docs/superpowers/specs/2026-08-26-bs-month-periods-design.md` (the
full design), and `src/lib/nepali-date.ts` / `src/lib/date-format.ts` for
the existing `adToBs`/`NEPALI_MONTHS` conventions this plan builds on.
Also read `src/modules/dhuku/lib/dhuku-stats.ts`'s `nextEntryDueDate` —
it has a comment documenting a real UTC-shift bug that was already caught
and fixed in this codebase (`toISOString()` after a local-time `Date`
silently shifts the date back a day in timezones ahead of UTC). This
plan's date-string arithmetic is written specifically to avoid that
pattern — every helper builds `YYYY-MM-DD` from local `getFullYear`/
`getMonth`/`getDate`, never `.toISOString()`.

Verified fixtures used in the tests below (checked directly against
`bikram-sambat-js`, not assumed):
- Bhadra 2083 (BS year=2083, month=5): AD start `2026-08-17`, AD end
  `2026-09-16`, 31 days.
- Chaitra 2082 (BS year=2082, month=12 — the BS year-boundary case):
  AD start `2026-03-15`, AD end `2026-04-13`, 30 days.

### Task 1: Core `month-period.ts` module + tests

**Files:**
- Create: `src/lib/month-period.ts`
- Test: `src/lib/month-period.test.ts`
- Modify: `src/lib/date-format.ts` (export `ENGLISH_MONTHS` so this new
  module can reuse it instead of duplicating the array)

- [ ] **Step 1: Export `ENGLISH_MONTHS`**

In `src/lib/date-format.ts`, change:

```ts
const ENGLISH_MONTHS = [
```

to:

```ts
export const ENGLISH_MONTHS = [
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/lib/month-period.test.ts
import { describe, expect, it } from "vitest";

import {
  currentPeriodYearMonth,
  dayNumberInPeriod,
  daysElapsedInPeriod,
  formatPeriodLabel,
  isCurrentPeriod,
  resolvePeriod,
} from "./month-period";

describe("resolvePeriod", () => {
  it("resolves a plain AD month in english mode", () => {
    expect(resolvePeriod(2026, 8, "english")).toEqual({
      daysInPeriod: 31,
      endDate: "2026-08-31",
      month: 8,
      startDate: "2026-08-01",
      year: 2026,
    });
  });

  it("resolves a real BS month spanning two AD months, in nepali mode", () => {
    // Bhadra 2083 — verified against bikram-sambat-js directly.
    expect(resolvePeriod(2083, 5, "nepali")).toEqual({
      daysInPeriod: 31,
      endDate: "2026-09-16",
      month: 5,
      startDate: "2026-08-17",
      year: 2083,
    });
  });

  it("resolves correctly across the BS year boundary (Chaitra -> Baisakh)", () => {
    // Chaitra 2082 (month 12) — next period is Baisakh 2083 (year rolls).
    expect(resolvePeriod(2082, 12, "nepali")).toEqual({
      daysInPeriod: 30,
      endDate: "2026-04-13",
      month: 12,
      startDate: "2026-03-15",
      year: 2082,
    });
  });
});

describe("dayNumberInPeriod", () => {
  it("returns the AD day-of-month in english mode", () => {
    expect(dayNumberInPeriod("2026-08-17", 2026, 8, "english")).toBe(17);
  });

  it("returns null when the date falls outside the given AD month", () => {
    expect(dayNumberInPeriod("2026-09-01", 2026, 8, "english")).toBeNull();
  });

  it("returns the BS day-of-month for a date inside the BS period", () => {
    // 2026-08-17 AD is Bhadra 1, 2083 — the first day of the period.
    expect(dayNumberInPeriod("2026-08-17", 2083, 5, "nepali")).toBe(1);
    // 2026-09-16 AD is Bhadra 31, 2083 — the last day of the period.
    expect(dayNumberInPeriod("2026-09-16", 2083, 5, "nepali")).toBe(31);
  });

  it("returns null when the date falls outside the given BS month", () => {
    // 2026-09-17 AD is Ashwin 1, 2083 — the day after Bhadra ends.
    expect(dayNumberInPeriod("2026-09-17", 2083, 5, "nepali")).toBeNull();
  });
});

describe("isCurrentPeriod / currentPeriodYearMonth / daysElapsedInPeriod", () => {
  it("currentPeriodYearMonth returns a BS year/month pair in nepali mode", () => {
    const { month, year } = currentPeriodYearMonth("nepali");
    expect(year).toBeGreaterThan(2000); // sanity: it's a BS year, not AD
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it("isCurrentPeriod agrees with currentPeriodYearMonth for both calendars", () => {
    const nepaliNow = currentPeriodYearMonth("nepali");
    expect(isCurrentPeriod(nepaliNow.year, nepaliNow.month, "nepali")).toBe(true);
    expect(isCurrentPeriod(nepaliNow.year, nepaliNow.month + 100, "nepali")).toBe(false);

    const englishNow = currentPeriodYearMonth("english");
    expect(isCurrentPeriod(englishNow.year, englishNow.month, "english")).toBe(true);
  });

  it("daysElapsedInPeriod is between 1 and daysInPeriod for the current period", () => {
    const { month, year } = currentPeriodYearMonth("nepali");
    const period = resolvePeriod(year, month, "nepali");
    const elapsed = daysElapsedInPeriod(period);
    expect(elapsed).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThanOrEqual(period.daysInPeriod);
  });
});

describe("formatPeriodLabel", () => {
  it("formats a plain english month/year", () => {
    expect(formatPeriodLabel(2026, 8, "english")).toBe("August 2026");
  });

  it("formats a plain nepali month/year — no range, the period IS one real month", () => {
    expect(formatPeriodLabel(2083, 5, "nepali")).toBe("Bhadra 2083");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/month-period.test.ts`
Expected: FAIL — `Cannot find module './month-period'`.

- [ ] **Step 4: Write the implementation**

```ts
// src/lib/month-period.ts
import { BSToAD } from "bikram-sambat-js";

import type { DateFormat } from "@/lib/date-format-cookie";
import { ENGLISH_MONTHS } from "@/lib/date-format";
import { adToBs, NEPALI_MONTHS } from "@/lib/nepali-date";

export type MonthPeriod = { daysInPeriod: number; endDate: string; month: number; startDate: string; year: number };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Local-time date-string arithmetic only — never toISOString(), which
// converts to UTC and can silently shift the date back a day in any
// timezone ahead of UTC (already caught once as a real bug in this app,
// in dhuku-stats.ts's nextEntryDueDate).
function adAddDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

// Inclusive-safe day count between two "YYYY-MM-DD" AD strings — both
// parsed as local-midnight Date objects, so the subtraction is an exact
// multiple of a day (Nepal has no DST; Math.round is a defensive guard).
function adDayDiff(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd).getTime();
  const end = new Date(ey, em - 1, ed).getTime();
  return Math.round((end - start) / 86400000);
}

function todayAdString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentPeriodYearMonth(dateFormat: DateFormat): { month: number; year: number } {
  if (dateFormat === "english") {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
  const { month, year } = adToBs(todayAdString());
  return { month, year };
}

// AD start/end date + day count for a native (year, month) pair — native
// meaning already BS if dateFormat is "nepali", already AD if "english".
// Never hardcodes BS month lengths: derives them from BSToAD on both this
// period's day-1 and the next period's day-1.
export function resolvePeriod(year: number, month: number, dateFormat: DateFormat): MonthPeriod {
  let startDate: string;
  let endDate: string;
  if (dateFormat === "english") {
    startDate = `${year}-${pad(month)}-01`;
    endDate = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
  } else {
    startDate = BSToAD(`${year}-${pad(month)}-01`);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    endDate = adAddDays(BSToAD(`${nextYear}-${pad(nextMonth)}-01`), -1);
  }
  const daysInPeriod = adDayDiff(startDate, endDate) + 1;
  return { daysInPeriod, endDate, month, startDate, year };
}

export function isCurrentPeriod(year: number, month: number, dateFormat: DateFormat): boolean {
  const current = currentPeriodYearMonth(dateFormat);
  return current.year === year && current.month === month;
}

// How many days into `period` today falls (1-based). Only meaningful when
// `period` is the current period — callers combine this with
// `period.daysInPeriod` themselves for "days left" style calculations.
export function daysElapsedInPeriod(period: MonthPeriod): number {
  return adDayDiff(period.startDate, todayAdString()) + 1;
}

// "Bhadra 2083" / "August 2026" — the period IS one real month now, so
// this is a plain single-month label, not a range.
export function formatPeriodLabel(year: number, month: number, dateFormat: DateFormat): string {
  if (dateFormat === "english") {
    return `${ENGLISH_MONTHS[month - 1]} ${year}`;
  }
  return `${NEPALI_MONTHS[month - 1]} ${year}`;
}

// Which day-of-period (1-based) an AD `dateStr` falls on for (year, month)
// under dateFormat's calendar, or null if it's outside that period. The
// core bucketing primitive — replaces every `date.split("-")[2]` /
// AD-year-month-equality check throughout the app's month-scoped stats.
export function dayNumberInPeriod(dateStr: string, year: number, month: number, dateFormat: DateFormat): null | number {
  if (dateFormat === "english") {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (y !== year || m !== month) return null;
    return d;
  }
  const bs = adToBs(dateStr);
  if (bs.year !== year || bs.month !== month) return null;
  return bs.day;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/month-period.test.ts`
Expected: PASS, all 13 tests green.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/month-period.ts src/lib/month-period.test.ts src/lib/date-format.ts
git commit -m "feat: add month-period module for BS/AD-aware month math"
```

---

### Task 2: `reports-stats.ts` — calendar-aware day math

**Files:**
- Modify: `src/modules/reports/lib/reports-stats.ts`

- [ ] **Step 1: Update imports**

Add to the top of the file:

```ts
import { currentPeriodYearMonth, dayNumberInPeriod, daysElapsedInPeriod, resolvePeriod } from "@/lib/month-period";
```

- [ ] **Step 2: Replace `safeToSpendToday`**

Find:

```ts
export function safeToSpendToday(totalPlanned: number, totalActual: number, year: number, month: number): number {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const daysLeft = isCurrentMonth ? Math.max(1, daysInMonth - now.getDate() + 1) : daysInMonth;
  const remaining = totalPlanned - totalActual;
  return Math.max(0, Math.round(remaining / daysLeft));
}
```

Replace with:

```ts
export function safeToSpendToday(
  totalPlanned: number,
  totalActual: number,
  year: number,
  month: number,
  dateFormat: DateFormat,
): number {
  const period = resolvePeriod(year, month, dateFormat);
  const current = currentPeriodYearMonth(dateFormat);
  const isCurrent = year === current.year && month === current.month;
  const daysLeft = isCurrent
    ? Math.max(1, period.daysInPeriod - daysElapsedInPeriod(period) + 1)
    : period.daysInPeriod;
  const remaining = totalPlanned - totalActual;
  return Math.max(0, Math.round(remaining / daysLeft));
}
```

- [ ] **Step 3: Replace `daysLeftInMonth`**

Find:

```ts
export function daysLeftInMonth(year: number, month: number): number {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  return isCurrentMonth ? Math.max(0, daysInMonth - now.getDate() + 1) : daysInMonth;
}
```

Replace with:

```ts
export function daysLeftInMonth(year: number, month: number, dateFormat: DateFormat): number {
  const period = resolvePeriod(year, month, dateFormat);
  const current = currentPeriodYearMonth(dateFormat);
  if (year !== current.year || month !== current.month) return period.daysInPeriod;
  return Math.max(0, period.daysInPeriod - daysElapsedInPeriod(period) + 1);
}
```

- [ ] **Step 4: Replace `dailySpendingPace`**

Find:

```ts
export function dailySpendingPace(
  expenses: { amount: number; date: string }[],
  year: number,
  month: number,
  totalPlanned: number,
): PacePoint[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const lastActualDay = isCurrentMonth ? now.getDate() : daysInMonth;

  const spentByDay = new Map<number, number>();
  for (const e of expenses) {
    const day = Number(e.date.split("-")[2]);
    spentByDay.set(day, (spentByDay.get(day) ?? 0) + e.amount);
  }

  const points: PacePoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const withinActualRange = day <= lastActualDay;
    if (withinActualRange) cumulative += spentByDay.get(day) ?? 0;
    points.push({
      actual: withinActualRange ? Math.round(cumulative) : null,
      day,
      pace: Math.round((totalPlanned * day) / daysInMonth),
    });
  }
  return points;
}
```

Replace with:

```ts
export function dailySpendingPace(
  expenses: { amount: number; date: string }[],
  year: number,
  month: number,
  totalPlanned: number,
  dateFormat: DateFormat,
): PacePoint[] {
  const period = resolvePeriod(year, month, dateFormat);
  const current = currentPeriodYearMonth(dateFormat);
  const isCurrent = year === current.year && month === current.month;
  const lastActualDay = isCurrent ? daysElapsedInPeriod(period) : period.daysInPeriod;

  const spentByDay = new Map<number, number>();
  for (const e of expenses) {
    const day = dayNumberInPeriod(e.date, year, month, dateFormat);
    if (day === null) continue;
    spentByDay.set(day, (spentByDay.get(day) ?? 0) + e.amount);
  }

  const points: PacePoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= period.daysInPeriod; day++) {
    const withinActualRange = day <= lastActualDay;
    if (withinActualRange) cumulative += spentByDay.get(day) ?? 0;
    points.push({
      actual: withinActualRange ? Math.round(cumulative) : null,
      day,
      pace: Math.round((totalPlanned * day) / period.daysInPeriod),
    });
  }
  return points;
}
```

- [ ] **Step 5: Replace `monthlyIncomeExpenseTrend`**

Find:

```ts
export function monthlyIncomeExpenseTrend(
  incomeRows: { amount: number; month: number; year: number }[],
  expenseRows: { amount: number; date: string }[],
  monthsBack: number,
  dateFormat: DateFormat,
): MonthPoint[] {
  const now = new Date();
  const months: { label: string; month: number; year: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: formatMonthShort(d.toISOString().slice(0, 10), dateFormat),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }

  return months.map(({ label, month, year }) => {
    const income = incomeRows.filter((i) => i.year === year && i.month === month).reduce((s, i) => s + i.amount, 0);
    const expenseTotal = expenseRows
      .filter((e) => {
        const [y, m] = e.date.split("-").map(Number);
        return y === year && m === month;
      })
      .reduce((s, e) => s + e.amount, 0);
    return { expenses: expenseTotal, income, label };
  });
}
```

Replace with:

```ts
export function monthlyIncomeExpenseTrend(
  incomeRows: { amount: number; month: number; year: number }[],
  expenseRows: { amount: number; date: string }[],
  monthsBack: number,
  dateFormat: DateFormat,
): MonthPoint[] {
  const current = currentPeriodYearMonth(dateFormat);
  const months: { month: number; year: number }[] = [{ month: current.month, year: current.year }];
  for (let i = 1; i < monthsBack; i++) {
    months.unshift(previousMonth(months[0].year, months[0].month));
  }

  return months.map(({ month, year }) => {
    const income = incomeRows.filter((i) => i.year === year && i.month === month).reduce((s, i) => s + i.amount, 0);
    const expenseTotal = expenseRows
      .filter((e) => dayNumberInPeriod(e.date, year, month, dateFormat) !== null)
      .reduce((s, e) => s + e.amount, 0);
    return { expenses: expenseTotal, income, label: formatPeriodShortLabel(year, month, dateFormat) };
  });
}
```

This introduces two new dependencies: `previousMonth` (reuse the existing
one from `@/lib/month-nav` — 12-month wraparound is calendar-agnostic, no
new logic needed) and `formatPeriodShortLabel` (a short "Bha"/"Aug" style
label, added in Step 6 below since `formatMonthShort` — the function this
replaces — took an AD date string, which the caller no longer has for a
native BS/AD `(year, month)` pair).

Add the import:

```ts
import { previousMonth } from "@/lib/month-nav";
```

Remove the now-unused `formatMonthShort` import (still check: is it used
elsewhere in this file? If not, remove it from the top-of-file import
list).

- [ ] **Step 6: Add `formatPeriodShortLabel` to `month-period.ts`**

Back in `src/lib/month-period.ts`, add this export (short month name only,
no year — matches the existing `formatMonthShort`'s "Bha"/"Aug" style used
for chart-axis labels):

```ts
export function formatPeriodShortLabel(year: number, month: number, dateFormat: DateFormat): string {
  if (dateFormat === "english") {
    return ENGLISH_MONTHS[month - 1].slice(0, 3);
  }
  return NEPALI_MONTHS[month - 1].slice(0, 3);
}
```

Then in `reports-stats.ts`, add it to the `@/lib/month-period` import list
from Step 1.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: errors at every call site of `safeToSpendToday`, `daysLeftInMonth`,
`dailySpendingPace` (missing the new `dateFormat` argument) — these are
fixed in Tasks 4-7. This is expected at this point in the plan; do not try
to fix call sites from this task.

- [ ] **Step 8: Commit**

```bash
git add src/modules/reports/lib/reports-stats.ts src/lib/month-period.ts
git commit -m "feat: make reports-stats day math calendar-aware"
```

---

### Task 3: `expenses.actions.ts` and `cash-flow.ts` — calendar-aware queries

**Files:**
- Modify: `src/modules/expenses/api/expenses.actions.ts`
- Modify: `src/modules/dashboard/lib/cash-flow.ts`
- Modify: `src/modules/dashboard/lib/cash-flow.test.ts`

- [ ] **Step 1: Update `listExpensesForMonth`**

In `src/modules/expenses/api/expenses.actions.ts`, add the import:

```ts
import { resolvePeriod } from "@/lib/month-period";
import type { DateFormat } from "@/lib/date-format-cookie";
```

Find:

```ts
export async function listExpensesForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  return db
    .select()
    .from(expenses)
    .where(
      and(eq(expenses.householdId, householdId), gte(expenses.date, start), lte(expenses.date, end)),
    )
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}
```

Replace with:

```ts
export async function listExpensesForMonth(year: number, month: number, dateFormat: DateFormat) {
  const { householdId } = await getCurrentMember();
  const period = resolvePeriod(year, month, dateFormat);

  return db
    .select()
    .from(expenses)
    .where(
      and(eq(expenses.householdId, householdId), gte(expenses.date, period.startDate), lte(expenses.date, period.endDate)),
    )
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}
```

- [ ] **Step 2: Update `cash-flow.ts`'s `dailyCashFlowPoints` and `netMonthlyOutflow`**

In `src/modules/dashboard/lib/cash-flow.ts`, add the import:

```ts
import { dayNumberInPeriod, resolvePeriod } from "@/lib/month-period";
import type { DateFormat } from "@/lib/date-format-cookie";
```

Remove the now-unused local `isInMonth` helper (both remaining callers
switch to `dayNumberInPeriod`/`resolvePeriod`).

Find:

```ts
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
```

Replace with (note the `date` field per point is now derived by walking
forward from `period.startDate` day by day, since a BS day no longer maps
to a fixed `${year}-${month}-${day}` AD string):

```ts
export function dailyCashFlowPoints(
  expenseRows: ExpenseRow[],
  incomeRows: IncomeRow[],
  events: CashFlowEvent[],
  year: number,
  month: number,
  dateFormat: DateFormat,
): DayPoint[] {
  const period = resolvePeriod(year, month, dateFormat);
  const points: DayPoint[] = [];
  for (let i = 0; i < period.daysInPeriod; i++) {
    const [sy, sm, sd] = period.startDate.split("-").map(Number);
    const d = new Date(sy, sm - 1, sd + i);
    points.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      day: i + 1,
      in: 0,
      out: 0,
    });
  }

  const incomeTotal = incomeRows.reduce((sum, i) => sum + Number(i.amount), 0);
  if (incomeTotal > 0) points[0].in += incomeTotal;

  for (const e of expenseRows) {
    const day = dayNumberInPeriod(e.date, year, month, dateFormat);
    if (day === null) continue;
    points[day - 1].out += Number(e.amount);
  }

  for (const ev of events) {
    const day = dayNumberInPeriod(ev.date, year, month, dateFormat);
    if (day === null) continue;
    if (ev.direction === "in") {
      points[day - 1].in += ev.amount;
    } else {
      points[day - 1].out += ev.amount;
    }
  }

  return points;
}
```

Find:

```ts
export function netMonthlyOutflow(events: CashFlowEvent[], year: number, month: number): number {
  return events
    .filter((e) => isInMonth(e.date, year, month))
    .reduce((sum, e) => sum + (e.direction === "out" ? e.amount : -e.amount), 0);
}
```

Replace with:

```ts
export function netMonthlyOutflow(events: CashFlowEvent[], year: number, month: number, dateFormat: DateFormat): number {
  return events
    .filter((e) => dayNumberInPeriod(e.date, year, month, dateFormat) !== null)
    .reduce((sum, e) => sum + (e.direction === "out" ? e.amount : -e.amount), 0);
}
```

- [ ] **Step 3: Update `cash-flow.test.ts`**

The two `dailyCashFlowPoints`/`netMonthlyOutflow` describe blocks need a
`"english"` argument added to every call (this test file only exercises
the AD/english path — the BS path is covered by `month-period.test.ts`,
so no new test cases needed here, just updated call signatures). In
`src/modules/dashboard/lib/cash-flow.test.ts`:

- Add `import type { DateFormat } from "@/lib/date-format-cookie";` — not
  actually needed if you just pass the literal `"english"` string, so
  skip this import and use the literal.
- Every `dailyCashFlowPoints(expenseRows, incomeRows, events, 2026, 2)`
  call becomes `dailyCashFlowPoints(expenseRows, incomeRows, events, 2026, 2, "english")`.
- Every `netMonthlyOutflow(events, 2026, 2)` call becomes
  `netMonthlyOutflow(events, 2026, 2, "english")`.
- The `dailyCashFlowPoints([], [], [], 2026, 4)` call becomes
  `dailyCashFlowPoints([], [], [], 2026, 4, "english")`.

- [ ] **Step 4: Run the cash-flow tests**

Run: `npx vitest run src/modules/dashboard/lib/cash-flow.test.ts`
Expected: PASS, all 8 tests green (same assertions as before — english
mode's day math is unchanged, just routed through the new module).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: errors at `dailyCashFlowPoints`/`netMonthlyOutflow`/
`listExpensesForMonth` call sites in `dashboard/index.tsx` and pages not
yet updated — expected at this point, fixed in Task 4.

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/api/expenses.actions.ts src/modules/dashboard/lib/cash-flow.ts src/modules/dashboard/lib/cash-flow.test.ts
git commit -m "feat: make expense-month queries and cash-flow bucketing calendar-aware"
```

---

### Task 4: Wire Dashboard and Budget pages

**Files:**
- Modify: `src/modules/dashboard/index.tsx`
- Modify: `src/modules/budget/pages/BudgetPage.tsx`

- [ ] **Step 1: Dashboard — resolve `dateFormat` before `year`/`month`**

In `src/modules/dashboard/index.tsx`, find:

```ts
  const { householdId, memberId } = await getEffectiveMember();
  const dateFormat = await getDateFormatPref(householdId);
  const params = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const year = parseMonthParam(params.year, currentYear, 9999);
  const month = parseMonthParam(params.month, currentMonth, 12);
```

Replace with:

```ts
  const { householdId, memberId } = await getEffectiveMember();
  const dateFormat = await getDateFormatPref(householdId);
  const params = await searchParams;
  const { year: currentYear, month: currentMonth } = currentPeriodYearMonth(dateFormat);
  const year = parseMonthParam(params.year, currentYear, 9999);
  const month = parseMonthParam(params.month, currentMonth, 12);
```

(If `dateFormat` currently sits inside the page's `Promise.all` rather
than as a standalone `await` — check the actual file, it may already be a
standalone `await` per earlier work in this session — move it to a
standalone `await` before this block if it isn't already, since `year`/
`month` now depend on it.)

Add the import:

```ts
import { currentPeriodYearMonth } from "@/lib/month-period";
```

- [ ] **Step 2: Dashboard — thread `dateFormat` through the changed function calls**

Find each of these calls in the same file and add `dateFormat` as the
final argument:

```ts
listExpensesForMonth(year, month)              -> listExpensesForMonth(year, month, dateFormat)
listExpensesForMonth(prev.year, prev.month)     -> listExpensesForMonth(prev.year, prev.month, dateFormat)
safeToSpendToday(totalPlanned, summary.totalExpenses + netOutflow, year, month)
                                                 -> safeToSpendToday(totalPlanned, summary.totalExpenses + netOutflow, year, month, dateFormat)
daysLeftInMonth(year, month)                    -> daysLeftInMonth(year, month, dateFormat)
dailyCashFlowPoints(expenseRows, incomeRows, cashFlowEvents, year, month)
                                                 -> dailyCashFlowPoints(expenseRows, incomeRows, cashFlowEvents, year, month, dateFormat)
netMonthlyOutflow(cashFlowEvents, year, month)  -> netMonthlyOutflow(cashFlowEvents, year, month, dateFormat)
```

- [ ] **Step 3: Dashboard — fix the current-month notification guard and label**

Find:

```ts
  if (year === currentYear && month === currentMonth) {
    await checkBudgetReminder(householdId, year, month, budgetItemRows.length);
  }
```

This is already correct as written — `currentYear`/`currentMonth` now
come from `currentPeriodYearMonth(dateFormat)` (Step 1), so the equality
check is already calendar-aware. No change needed here beyond Step 1.

Find:

```ts
  const monthLabel = formatMonthRangeLabel(year, month, dateFormat);
```

Replace with:

```ts
  const monthLabel = formatPeriodLabel(year, month, dateFormat);
```

(The period IS one real month now — no more range needed.) Update the
import: remove `formatMonthRangeLabel` from the `@/lib/date-format`
import if nothing else in this file uses it, and add `formatPeriodLabel`
to the `@/lib/month-period` import from Step 1.

- [ ] **Step 4: Budget page — same pattern**

In `src/modules/budget/pages/BudgetPage.tsx`, find:

```ts
  const { householdId, memberId } = await getCurrentMember();
  const params = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const year = parseMonthParam(params.year, currentYear, 9999);
  const month = parseMonthParam(params.month, currentMonth, 12);
  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  const [members, categories, incomes, budgetItems, expenseRows, prevBudgetItems, dateFormat] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
    getBudgetItemsForMonth(prev.year, prev.month),
    getDateFormatPref(householdId),
  ]);
```

Replace with:

```ts
  const { householdId, memberId } = await getCurrentMember();
  const dateFormat = await getDateFormatPref(householdId);
  const params = await searchParams;
  const { year: currentYear, month: currentMonth } = currentPeriodYearMonth(dateFormat);
  const year = parseMonthParam(params.year, currentYear, 9999);
  const month = parseMonthParam(params.month, currentMonth, 12);
  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  const [members, categories, incomes, budgetItems, expenseRows, prevBudgetItems] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month, dateFormat),
    getBudgetItemsForMonth(prev.year, prev.month),
  ]);
```

Add the import: `import { currentPeriodYearMonth, formatPeriodLabel } from "@/lib/month-period";`

Find:

```ts
  const monthLabel = formatMonthRangeLabel(year, month, dateFormat);
```

Replace with:

```ts
  const monthLabel = formatPeriodLabel(year, month, dateFormat);
```

Remove `formatMonthRangeLabel` from the `@/lib/date-format` import (it's
the only thing imported from that module in this file, so the whole
import line can go). This page has no `safeToSpendToday`/`daysLeftInMonth`/
`dailySpendingPace` calls — nothing else to change.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: errors remaining only in Expenses, Reports, Recurring pages
(Tasks 5-6) and the data migration script (Task 7, not written yet).

- [ ] **Step 6: Commit**

```bash
git add src/modules/dashboard/index.tsx src/modules/budget/pages/BudgetPage.tsx
git commit -m "feat: make Dashboard and Budget pages BS/AD-period-aware"
```

---

### Task 5: Wire Expenses and Reports pages

**Files:**
- Modify: `src/modules/expenses/pages/ExpensesPage.tsx`
- Modify: `src/modules/reports/pages/ReportsPage.tsx`

- [ ] **Step 1: Expenses page — resolve `dateFormat` before `year`/`month`, thread through calls**

In `src/modules/expenses/pages/ExpensesPage.tsx`, find:

```ts
  const { householdId, memberId } = await getEffectiveMember();
  const params = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const year = parseMonthParam(params.year, currentYear, 9999);
  const month = parseMonthParam(params.month, currentMonth, 12);
  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [members, categories, expenseRows, incomeRows, budgetItemRows, allIncomeRows, rangeExpenseRows, dateFormat] =
    await Promise.all([
      getHouseholdMembers(householdId),
      listCategories(householdId),
      listExpensesForMonth(year, month),
      getIncomesForMonth(year, month),
      getBudgetItemsForMonth(year, month),
      listAllIncomes(),
      listExpensesForRange(rangeStart, rangeEnd),
      getDateFormatPref(householdId),
    ]);
```

Replace with:

```ts
  const { householdId, memberId } = await getEffectiveMember();
  const dateFormat = await getDateFormatPref(householdId);
  const params = await searchParams;
  const { year: currentYear, month: currentMonth } = currentPeriodYearMonth(dateFormat);
  const year = parseMonthParam(params.year, currentYear, 9999);
  const month = parseMonthParam(params.month, currentMonth, 12);
  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  let rangeStartYm = { month, year };
  for (let i = 0; i < 5; i++) rangeStartYm = previousMonth(rangeStartYm.year, rangeStartYm.month);
  const rangeStart = resolvePeriod(rangeStartYm.year, rangeStartYm.month, dateFormat).startDate;
  const rangeEnd = resolvePeriod(year, month, dateFormat).endDate;

  const [members, categories, expenseRows, incomeRows, budgetItemRows, allIncomeRows, rangeExpenseRows] =
    await Promise.all([
      getHouseholdMembers(householdId),
      listCategories(householdId),
      listExpensesForMonth(year, month, dateFormat),
      getIncomesForMonth(year, month),
      getBudgetItemsForMonth(year, month),
      listAllIncomes(),
      listExpensesForRange(rangeStart, rangeEnd),
    ]);
```

Add the import:

```ts
import { currentPeriodYearMonth, formatPeriodLabel, resolvePeriod } from "@/lib/month-period";
```

- [ ] **Step 2: Expenses page — update the remaining changed-signature calls**

Find:

```ts
  const monthLabel = formatMonthRangeLabel(year, month, dateFormat);
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month);
  const daysLeft = daysLeftInMonth(year, month);
  const pacePoints = dailySpendingPace(
    expenseRows.map((e) => ({ amount: Number(e.amount), date: e.date })),
    year,
    month,
    totalPlanned,
  );
```

Replace with:

```ts
  const monthLabel = formatPeriodLabel(year, month, dateFormat);
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month, dateFormat);
  const daysLeft = daysLeftInMonth(year, month, dateFormat);
  const pacePoints = dailySpendingPace(
    expenseRows.map((e) => ({ amount: Number(e.amount), date: e.date })),
    year,
    month,
    totalPlanned,
    dateFormat,
  );
```

Remove `formatMonthRangeLabel` from the `@/lib/date-format` import if
nothing else in this file uses it.

- [ ] **Step 3: Reports page — same pattern**

In `src/modules/reports/pages/ReportsPage.tsx`, find:

```ts
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prev = previousMonth(year, month);

  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const rangeEnd = new Date(year, month, 0).toISOString().slice(0, 10);

  const [
    members,
    categories,
    incomeRows,
    allIncomeRows,
    budgetItemRows,
    expenseRows,
    prevExpenseRows,
    rangeExpenseRows,
    goalRows,
    contributionRows,
    dateFormat,
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    listAllIncomes(),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
    listExpensesForMonth(prev.year, prev.month),
    listExpensesForRange(rangeStart, rangeEnd),
    listSavingsGoals(householdId),
    listSavingsContributions(householdId),
    getDateFormatPref(householdId),
  ]);
```

Replace with:

```ts
  const { householdId, memberId } = await getCurrentMember();
  const dateFormat = await getDateFormatPref(householdId);
  const { year, month } = currentPeriodYearMonth(dateFormat);
  const prev = previousMonth(year, month);

  let rangeStartYm = { month, year };
  for (let i = 0; i < 5; i++) rangeStartYm = previousMonth(rangeStartYm.year, rangeStartYm.month);
  const rangeStart = resolvePeriod(rangeStartYm.year, rangeStartYm.month, dateFormat).startDate;
  const rangeEnd = resolvePeriod(year, month, dateFormat).endDate;

  const [
    members,
    categories,
    incomeRows,
    allIncomeRows,
    budgetItemRows,
    expenseRows,
    prevExpenseRows,
    rangeExpenseRows,
    goalRows,
    contributionRows,
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    listAllIncomes(),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month, dateFormat),
    listExpensesForMonth(prev.year, prev.month, dateFormat),
    listExpensesForRange(rangeStart, rangeEnd),
    listSavingsGoals(householdId),
    listSavingsContributions(householdId),
  ]);
```

Add the import:

```ts
import { currentPeriodYearMonth, formatPeriodLabel, resolvePeriod } from "@/lib/month-period";
```

- [ ] **Step 4: Reports page — update remaining changed-signature calls and the label**

Find:

```ts
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month);
  const daysLeft = daysLeftInMonth(year, month);
  const insightMessage = spendingInsight(totalExpenses, prevTotalExpenses);
```

Replace with:

```ts
  const totalPlanned = budgetItemRows.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const safeToSpend = safeToSpendToday(totalPlanned, totalExpenses, year, month, dateFormat);
  const daysLeft = daysLeftInMonth(year, month, dateFormat);
  const insightMessage = spendingInsight(totalExpenses, prevTotalExpenses);
```

Find:

```ts
  const monthLabel = formatMonthYear(now.toISOString().slice(0, 10), dateFormat);
```

Replace with:

```ts
  const monthLabel = formatPeriodLabel(year, month, dateFormat);
```

Remove `formatMonthYear` from the `@/lib/date-format` import and the now
entirely-unused `now`/`previousMonth`-duplicate local function if this
file had its own `previousMonth` (it does — a local copy at the top of
`ReportsPage.tsx`; replace calls to it with the import from
`@/lib/month-nav` instead, matching the other pages, and delete the local
duplicate).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: errors remaining only in Recurring (Task 6) and the data
migration script (Task 7).

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/pages/ExpensesPage.tsx src/modules/reports/pages/ReportsPage.tsx
git commit -m "feat: make Expenses and Reports pages BS/AD-period-aware"
```

---

### Task 6: Wire Recurring's calendar view

**Files:**
- Modify: `src/modules/recurring/pages/RecurringPage.tsx`
- Modify: `src/modules/recurring/components/RecurringCalendarView.tsx`

- [ ] **Step 1: RecurringPage — resolve the current period from `dateFormat`**

In `src/modules/recurring/pages/RecurringPage.tsx`, find:

```ts
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, recurringItems, monthExpenses, dateFormat] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listRecurringExpenses(householdId),
    listExpensesForMonth(year, month),
    getDateFormatPref(householdId),
  ]);
```

Replace with:

```ts
  const { householdId, memberId } = await getCurrentMember();
  const dateFormat = await getDateFormatPref(householdId);
  const { year, month } = currentPeriodYearMonth(dateFormat);

  const [members, categories, recurringItems, monthExpenses] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listRecurringExpenses(householdId),
    listExpensesForMonth(year, month, dateFormat),
  ]);
```

Add the import:

```ts
import { currentPeriodYearMonth } from "@/lib/month-period";
```

Find:

```ts
  const monthLabel = formatMonthYear(now.toISOString().slice(0, 10), dateFormat);
```

Replace with:

```ts
  const monthLabel = formatPeriodLabel(year, month, dateFormat);
```

Remove `formatMonthYear` from the `@/lib/date-format` import (keep
`formatShortDate`, still used for `nextDueLabel`) and add
`formatPeriodLabel` to the `@/lib/month-period` import above.

- [ ] **Step 2: Thread `dateFormat` through to `RecurringCalendarView`**

`RecurringCalendarView` isn't rendered directly in `RecurringPage.tsx` —
it's rendered inside `RecurringManager.tsx`, which `RecurringPage.tsx`
already passes `dateFormat` to (check: `<RecurringManager ... dateFormat={dateFormat} ... />`
already exists — no change needed there).

In `src/modules/recurring/components/RecurringManager.tsx`, find:

```tsx
        <RecurringCalendarView rows={filtered} />
```

Replace with:

```tsx
        <RecurringCalendarView dateFormat={dateFormat} rows={filtered} />
```

(`dateFormat` is already a prop `RecurringManager` receives and uses
elsewhere in this same file — e.g. `useRecurringTableColumns(realMemberId, openEdit, dateFormat)`
— so this is just passing an already-available value down one more
level, not fetching anything new.)

- [ ] **Step 3: Rewrite `buildMonthGrid` to be calendar-aware**

In `src/modules/recurring/components/RecurringCalendarView.tsx`, find:

```tsx
import { TONE_BADGE_CLASSES } from "@/components/ToneIcon";
import { cn } from "@/lib/utils";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { RecurringRow } from "@/modules/recurring/hooks/useRecurringTableColumns";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = firstDay.getDay();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function RecurringCalendarView({ rows }: { rows: RecurringRow[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const weeks = buildMonthGrid(year, month);
  const todayKey = toDateKey(now);
```

Replace with:

```tsx
import { TONE_BADGE_CLASSES } from "@/components/ToneIcon";
import type { DateFormat } from "@/lib/date-format-cookie";
import { currentPeriodYearMonth, resolvePeriod } from "@/lib/month-period";
import { cn } from "@/lib/utils";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { RecurringRow } from "@/modules/recurring/hooks/useRecurringTableColumns";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type GridCell = { adDateKey: string; dayLabel: number } | null;

// Every period day (BS or AD) resolves to a real AD date underneath, so
// weekday alignment (which column a day falls in) is never ambiguous —
// it's read straight off that AD date's Date.getDay(), same as the old
// AD-only version did.
function buildMonthGrid(year: number, month: number, dateFormat: DateFormat): GridCell[][] {
  const period = resolvePeriod(year, month, dateFormat);
  const [sy, sm, sd] = period.startDate.split("-").map(Number);
  const firstAdDate = new Date(sy, sm - 1, sd);
  const leadingBlanks = firstAdDate.getDay();

  const cells: GridCell[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: period.daysInPeriod }, (_, i) => {
      const d = new Date(sy, sm - 1, sd + i);
      const adDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { adDateKey, dayLabel: i + 1 };
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: GridCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function todayAdDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function RecurringCalendarView({ dateFormat, rows }: { dateFormat: DateFormat; rows: RecurringRow[] }) {
  const { year, month } = currentPeriodYearMonth(dateFormat);
  const weeks = buildMonthGrid(year, month, dateFormat);
  const todayKey = todayAdDateKey();
```

- [ ] **Step 4: Update the render loop's cell keys**

Find:

```tsx
      <div className="grid grid-cols-7">
        {weeks.flat().map((date, i) => {
          const key = date ? toDateKey(date) : `blank-${i}`;
          const items = date ? (rowsByDate.get(key) ?? []) : [];
          return (
            <div
              className={cn(
                "min-h-24 border-r border-b p-1.5 last:border-r-0",
                !date && "bg-muted/20",
                key === todayKey && "bg-primary/5",
              )}
              key={key}
            >
              {date && (
                <>
                  <p className={cn("mb-1 text-xs", key === todayKey ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {date.getDate()}
                  </p>
```

Replace with:

```tsx
      <div className="grid grid-cols-7">
        {weeks.flat().map((cell, i) => {
          const key = cell ? cell.adDateKey : `blank-${i}`;
          const items = cell ? (rowsByDate.get(cell.adDateKey) ?? []) : [];
          return (
            <div
              className={cn(
                "min-h-24 border-r border-b p-1.5 last:border-r-0",
                !cell && "bg-muted/20",
                key === todayKey && "bg-primary/5",
              )}
              key={key}
            >
              {cell && (
                <>
                  <p className={cn("mb-1 text-xs", key === todayKey ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {cell.dayLabel}
                  </p>
```

The rest of the render (the `.map((item) => ...)` items list, closing
tags) is unchanged — `rowsByDate` is still keyed by the AD `nextDueDate`
string from each `RecurringRow`, and `cell.adDateKey` is the same AD
format, so the lookup keeps working exactly as before.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors remaining anywhere except the not-yet-written data
migration script.

- [ ] **Step 6: Commit**

```bash
git add src/modules/recurring/pages/RecurringPage.tsx src/modules/recurring/components/RecurringCalendarView.tsx
git commit -m "feat: make Recurring calendar view BS/AD-period-aware"
```

---

### Task 7: Data migration

**Files:** none (one-off script, not committed as app code)

- [ ] **Step 1: Write and run a one-off migration script**

Create a scratch file (e.g. `scratch-migrate-budget-period.ts` in the
repo root — do NOT commit it, delete it after running) that re-keys any
`monthlyBudgets`/`incomes` rows currently stored under today's AD
year/month to today's BS year/month:

```ts
import { and, eq } from "drizzle-orm";

import { db } from "./src/db/client";
import { incomes, monthlyBudgets } from "./src/db/schema";
import { adToBs } from "./src/lib/nepali-date";

async function main() {
  const now = new Date();
  const todayAd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const { year: bsYear, month: bsMonth } = adToBs(todayAd);
  const adYear = now.getFullYear();
  const adMonth = now.getMonth() + 1;

  const budgetResult = await db
    .update(monthlyBudgets)
    .set({ year: bsYear, month: bsMonth })
    .where(and(eq(monthlyBudgets.year, adYear), eq(monthlyBudgets.month, adMonth)))
    .returning();
  console.log(`Migrated ${budgetResult.length} monthlyBudgets row(s) from ${adYear}-${adMonth} to ${bsYear}-${bsMonth}`);

  const incomeResult = await db
    .update(incomes)
    .set({ year: bsYear, month: bsMonth })
    .where(and(eq(incomes.year, adYear), eq(incomes.month, adMonth)))
    .returning();
  console.log(`Migrated ${incomeResult.length} incomes row(s) from ${adYear}-${adMonth} to ${bsYear}-${bsMonth}`);
}

main().then(() => process.exit(0));
```

Run: `npx tsx scratch-migrate-budget-period.ts`
Expected: output showing the number of rows migrated (should be >0 if
you've already entered a budget/income this month, matching what you
described — "the budget is of Bhadra").

- [ ] **Step 2: Delete the scratch script**

```bash
rm scratch-migrate-budget-period.ts
```

Do not commit it — it's a one-time data fix, not part of the app.

- [ ] **Step 3: Manually verify**

Open `/budget` in the browser. Confirm the header now shows "Bhadra 2083"
(a plain month label, not the "Shrawan 16 – Bhadra 15" range from the
earlier pass) and your previously-entered budget amounts still show up
under it.

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including the new `month-period.test.ts` (13
tests) and the updated `cash-flow.test.ts` (8 tests, same assertions,
new `"english"` argument).

- [ ] **Step 2: Lint**

Run: `npm run lint -- --fix`
Expected: 0 errors (pre-existing unrelated warnings are fine).

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manually verify in the browser**

Run `npm run dev`, sign in. With the household set to Nepali (Settings):
- `/budget` and `/dashboard` headers show a plain BS month label (e.g.
  "Bhadra 2083"), and the Daily Cash Flow chart's bars only span real
  Bhadra days (1 through ~30), not the Shrawan-into-Bhadra range from
  before.
- `/expenses` navigation (prev/next) moves by real BS months.
- `/reports` trend chart's 6 points are 6 real BS months, oldest to
  newest.
- `/recurring`'s calendar grid shows BS day numbers 1 through ~30/32 with
  correct weekday alignment, and any recurring item due this period still
  appears on the correct cell.

Then toggle Settings to English and spot-check the same five pages show
plain AD month periods, matching pre-this-feature behavior exactly.

- [ ] **Step 5: Final commit if anything was adjusted during manual verification**

```bash
git add -A
git commit -m "fix: address issues found during BS-month-period manual verification"
```

(Skip this step if nothing needed changing.)
