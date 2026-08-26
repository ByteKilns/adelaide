# BS-native month periods (Phase B)

## Problem

Every month-scoped view in the app (Budget, Home, Expenses, Reports,
Recurring, Notifications) currently treats "a month" as an AD/Gregorian
calendar month, only ever *labeling* it in BS for display. Since BS
months don't align with AD month boundaries (confirmed: every AD month in
2026 spans two BS months), this means the period itself — not just its
label — is wrong for a household that thinks in BS. The user wants month
periods to actually *be* the real calendar month of whichever system the
household uses (Phase A: now a shared household setting, not a per-browser
cookie).

## Scope (from brainstorming)

Full consistency: every month-scoped and multi-month-scoped view
(single-month browsing **and** 6-month trend charts **and** the Recurring
calendar grid) switches between real BS months and real AD months based
on the household's `dateFormat`. Not just Budget/Home.

Not in scope: adding new navigation to Recurring's calendar (it has none
today — always "this month", no prev/next). It only gets its *current*
month redefined to the correct calendar; adding month-to-month browsing
there is a separate feature nobody asked for.

## Core abstraction: `src/lib/month-period.ts`

The single source of truth for "what does a month mean right now," pure
functions, unit tested. Built on `BSToAD`/`ADToBS` — never hardcodes BS
month lengths.

```ts
export type MonthPeriod = { daysInPeriod: number; endDate: string; month: number; startDate: string; year: number };

// Today's year/month in the correct calendar for dateFormat.
export function currentPeriodYearMonth(dateFormat: DateFormat): { month: number; year: number };

// AD start/end date + day count for a native (year, month) pair — native
// meaning already BS if dateFormat is "nepali", already AD if "english".
export function resolvePeriod(year: number, month: number, dateFormat: DateFormat): MonthPeriod;

// Is (year, month) the period containing today, under dateFormat's calendar?
export function isCurrentPeriod(year: number, month: number, dateFormat: DateFormat): boolean;

// How many days into `period` today falls (1-based). Only meaningful when
// isCurrentPeriod is true for the same (year, month, dateFormat) — callers
// that need "days left" combine this with period.daysInPeriod themselves.
export function daysElapsedInPeriod(period: MonthPeriod, dateFormat: DateFormat): number;

// "Bhadra 2083" / "August 2026" — the period IS one real month now, so
// this is a plain single-month label, not a range.
export function formatPeriodLabel(year: number, month: number, dateFormat: DateFormat): string;

// Which day-of-period (1-based) an AD `dateStr` falls on for (year, month)
// under dateFormat's calendar, or null if it's outside that period. The
// core bucketing primitive — replaces every `date.split("-")[2]` /
// AD-year-month-equality check throughout the app's month-scoped stats.
export function dayNumberInPeriod(dateStr: string, year: number, month: number, dateFormat: DateFormat): null | number;
```

`previousMonth`/`nextMonth` in `src/lib/month-nav.ts` stay exactly as
they are — 12-month wraparound is identical in both calendars, so no
change needed there. `parseMonthParam` also stays as-is (a plain 1-12
clamp); only what feeds its `fallback` argument changes (from raw AD
`now.getFullYear()`/`getMonth()+1` to `currentPeriodYearMonth(dateFormat)`).

## `resolvePeriod` implementation sketch

```ts
function pad(n: number): string { return String(n).padStart(2, "0"); }

function adAddDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta); // local time, never toISOString
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

// Inclusive day count between two "YYYY-MM-DD" AD strings — both parsed as
// local-midnight Date objects, so the subtraction is an exact multiple of
// a day (Nepal has no DST; Math.round is a defensive guard, not a fudge).
function adDayDiff(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd).getTime();
  const end = new Date(ey, em - 1, ed).getTime();
  return Math.round((end - start) / 86400000);
}

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
  const daysInPeriod = adDayDiff(startDate, endDate) + 1; // local-date day count, no ms/DST math
  return { daysInPeriod, endDate, month, startDate, year };
}
```

Every date-string helper here builds `YYYY-MM-DD` from local `Date`
components (`getFullYear`/`getMonth`/`getDate`), never `.toISOString()` —
that pattern already produced one real UTC-shift bug earlier in this
project (`dhuku-stats.ts`'s `nextEntryDueDate`) and is exactly the kind of
subtle bug this whole feature is being built to avoid, not reintroduce.

## Ripple effects — signature changes (mechanical once the core module exists)

All gain a `dateFormat: DateFormat` parameter and delegate their
day/range math to `month-period.ts` instead of raw `Date` arithmetic:

- `src/modules/expenses/api/expenses.actions.ts`: `listExpensesForMonth(year, month, dateFormat)`
- `src/modules/reports/lib/reports-stats.ts`: `safeToSpendToday`, `daysLeftInMonth`,
  `dailySpendingPace`, `monthlyIncomeExpenseTrend` (already takes `dateFormat`
  today, but only for label formatting — its month-walking loop and
  filtering logic change to use real BS/AD periods)
- `src/modules/dashboard/lib/cash-flow.ts`: `dailyCashFlowPoints`, `netMonthlyOutflow`
  (currently AD-only via `isInMonth`/`new Date(year,month,0).getDate()`)

`listExpensesForRange(startDate, endDate)` (raw AD bounds) and
`getIncomesForMonth`/`getBudgetItemsForMonth` (equality lookups on stored
`year`/`month` integer columns) need **no signature change** — callers
already pass the correctly-calendared `year`/`month`/AD-bounds once the
page-level values are fixed; these functions don't do their own calendar
math.

**Page-level call sites** (`Dashboard`, `Budget`, `Expenses`, `Reports`):
`currentYear`/`currentMonth` (the `parseMonthParam` fallback) now come
from `currentPeriodYearMonth(dateFormat)` instead of raw `new Date()`.
Note `dateFormat` must be resolved (via `getDateFormatPref(householdId)`)
*before* computing `year`/`month`, changing these pages' fetch ordering
slightly (dateFormat can no longer sit inside the big `Promise.all`
alongside things that depend on `year`/`month`).

**`checkBudgetReminder`'s "is this the actual current month" guards**
(`BudgetPage.tsx`, `dashboard/index.tsx`) — currently
`year === currentYear && month === currentMonth` compared against raw AD
`new Date()` values — become `isCurrentPeriod(year, month, dateFormat)`.

**Recurring** (`RecurringPage.tsx`, `RecurringCalendarView.tsx`): the
hardcoded `new Date()`-based year/month becomes
`currentPeriodYearMonth(dateFormat)`. `buildMonthGrid` gains a BS-aware
path: for `dateFormat === "nepali"`, build `daysInPeriod` cells where
each cell's weekday alignment is derived by converting that BS day to its
real AD date (`BSToAD`) and reading `.getDay()` from it — every BS day is
still a real AD date underneath, so weekday alignment is never ambiguous.

**Reports' 6-month window**: `rangeStart`/`rangeEnd` (currently
`new Date(now.getFullYear(), now.getMonth()-5, 1)` /
`new Date(year, month, 0)`) become: walk back 5 periods from
`currentPeriodYearMonth(dateFormat)` via the existing `previousMonth()`
wraparound helper, then take `resolvePeriod(...).startDate` of the
oldest period and `resolvePeriod(...).endDate` of the current period —
still fed into the unchanged `listExpensesForRange(startDate, endDate)`.

## Data migration

One-time script (not a schema migration): for each household, find
`monthlyBudgets`/`incomes` rows keyed to *today's* AD year/month and
re-key them to today's BS year/month (via `ADToBS`) — targeted at
whatever's currently live, not a general historical algorithm, since
(per the user) all real usage so far falls in this one period.

```ts
const today = new Date().toISOString().slice(0, 10);
const { year: bsYear, month: bsMonth } = adToBs(today);
const adYear = new Date().getFullYear();
const adMonth = new Date().getMonth() + 1;

await db.update(monthlyBudgets).set({ year: bsYear, month: bsMonth })
  .where(and(eq(monthlyBudgets.year, adYear), eq(monthlyBudgets.month, adMonth)));
await db.update(incomes).set({ year: bsYear, month: bsMonth })
  .where(and(eq(incomes.year, adYear), eq(incomes.month, adMonth)));
```

Run once, by hand, against the live DB as part of the implementation —
not turned into a Drizzle schema migration (no schema change involved,
just a data fix).

## Known limitation (explicitly not building around it)

If a household ever toggles `dateFormat` after entering data, previously
BS-keyed (or AD-keyed) `monthlyBudgets`/`incomes` rows won't automatically
follow — they'll look empty under the new calendar until re-entered. Not
building reconciliation logic for this; flagged, not hidden.

## Testing

`src/lib/month-period.test.ts` — the highest-value tests in this whole
change, covering: `resolvePeriod` for both calendars (including the
Chaitra→Baisakh BS year-boundary case already proven in
`date-format.test.ts`), `isCurrentPeriod`, `dayNumberInPeriod` (dates
inside/outside/at the boundary of a period), and `currentPeriodYearMonth`.
Existing calculation-layer tests (`reports-stats.ts` has none today, but
if any are added alongside the signature changes, they follow the same
pattern as `dhuku-stats.test.ts`/`cash-flow.test.ts`).

`npx tsc --noEmit` + `npm run build` + manual verification (toggle the
household's date format in Settings, confirm Budget/Home/Expenses/
Reports/Recurring all show real BS or AD periods consistently) as the
completion gate.
