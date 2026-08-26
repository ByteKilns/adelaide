import { BSToAD } from "bikram-sambat-js";

import { ENGLISH_MONTHS } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import { adToBs, NEPALI_MONTHS } from "@/lib/nepali-date";

export type MonthPeriod = { daysInPeriod: number; endDate: string; month: number; startDate: string; year: number };

// bikram-sambat-js's hard-coded supported range is BS 1970-2100 / AD
// 1913-2043 — outside it, BSToAD/ADToBS throw a RangeError instead of
// returning a date. Kept one year inside the BS ceiling since
// resolvePeriod converts (year + 1, month 1) internally at a period's
// December boundary, so year=2100 itself must stay reachable internally.
export const MIN_NAVIGABLE_YEAR = { english: 1913, nepali: 1970 } as const;
export const MAX_NAVIGABLE_YEAR = { english: 2043, nepali: 2099 } as const;

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

// "Bha" / "Aug" — short month name only, no year (chart-axis style label).
export function formatPeriodShortLabel(year: number, month: number, dateFormat: DateFormat): string {
  if (dateFormat === "english") {
    return ENGLISH_MONTHS[month - 1].slice(0, 3);
  }
  return NEPALI_MONTHS[month - 1].slice(0, 3);
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
