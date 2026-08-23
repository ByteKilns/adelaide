import { ADToBS } from "bikram-sambat-js";

export const NEPALI_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

// dateStr is a "YYYY-MM-DD" AD (Gregorian) string, the format every date is
// stored/queried in throughout the app. Everything here is display-only —
// no storage, query, or month-boundary logic anywhere else changes.
export function adToBs(dateStr: string): { day: number; month: number; year: number } {
  const [year, month, day] = ADToBS(dateStr).split("-").map(Number);
  return { day, month, year };
}

// "15 Bhadra 2083"
export function formatBsDate(dateStr: string): string {
  const { day, month, year } = adToBs(dateStr);
  return `${day} ${NEPALI_MONTHS[month - 1]} ${year}`;
}

// "15 Bhadra"
export function formatBsShortDate(dateStr: string): string {
  const { day, month } = adToBs(dateStr);
  return `${day} ${NEPALI_MONTHS[month - 1]}`;
}

// "Bha" — first 3 letters of the BS month containing the given AD date. Used
// for chart-axis labels bucketed by AD calendar month (trend charts etc.) —
// this only relabels each bucket in BS, the buckets themselves are still AD
// calendar months.
export function formatBsMonthShort(dateStr: string): string {
  const { month } = adToBs(dateStr);
  return NEPALI_MONTHS[month - 1].slice(0, 3);
}

// "Bhadra 2083" — the BS month/year containing the given AD date. Used for
// page headers whose underlying period is still tracked by AD year/month
// (budgets, report ranges, etc.) — this only relabels that period in BS, it
// does not change which AD dates the period actually spans.
export function formatBsMonthYear(dateStr: string): string {
  const { month, year } = adToBs(dateStr);
  return `${NEPALI_MONTHS[month - 1]} ${year}`;
}
