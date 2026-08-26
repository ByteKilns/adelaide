import type { DateFormat } from "@/lib/date-format-cookie";
import { adToBs, NEPALI_MONTHS } from "@/lib/nepali-date";

export const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// dateStr is a "YYYY-MM-DD" AD (Gregorian) string. Parsing it via
// `new Date("YYYY-MM-DD")` treats it as UTC midnight, which can land on the
// wrong local day — so parse the parts manually into a local-time Date.
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "15 Bhadra 2083" / "15 August 2026"
export function formatDate(dateStr: string, format: DateFormat): string {
  if (format === "english") {
    const d = parseLocalDate(dateStr);
    return `${d.getDate()} ${ENGLISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  const { day, month, year } = adToBs(dateStr);
  return `${day} ${NEPALI_MONTHS[month - 1]} ${year}`;
}

// "15 Bhadra" / "15 Aug"
export function formatShortDate(dateStr: string, format: DateFormat): string {
  if (format === "english") {
    const d = parseLocalDate(dateStr);
    return `${d.getDate()} ${ENGLISH_MONTHS[d.getMonth()].slice(0, 3)}`;
  }
  const { day, month } = adToBs(dateStr);
  return `${day} ${NEPALI_MONTHS[month - 1]}`;
}

// "Bha" / "Aug" — label for the BS or AD month containing the given AD date.
// Used for chart-axis labels bucketed by AD calendar month — this only
// relabels each bucket, the buckets themselves are still AD calendar months.
export function formatMonthShort(dateStr: string, format: DateFormat): string {
  if (format === "english") {
    const d = parseLocalDate(dateStr);
    return ENGLISH_MONTHS[d.getMonth()].slice(0, 3);
  }
  const { month } = adToBs(dateStr);
  return NEPALI_MONTHS[month - 1].slice(0, 3);
}

// "Bhadra 2083" / "August 2026" — the BS or AD month/year containing the
// given AD date. Used for page headers whose underlying period is still
// tracked by AD year/month (budgets, report ranges, etc.) — this only
// relabels that period, it does not change which AD dates it spans.
export function formatMonthYear(dateStr: string, format: DateFormat): string {
  if (format === "english") {
    const d = parseLocalDate(dateStr);
    return `${ENGLISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  const { month, year } = adToBs(dateStr);
  return `${NEPALI_MONTHS[month - 1]} ${year}`;
}

// "Shrawan 16 – Bhadra 15, 2083" / "August 2026" — label for the AD
// calendar month `year`-`month`, honest about the fact that BS months don't
// align with AD month boundaries: most AD months span two BS months (the
// 1st of an AD month is very often still in the previous BS month), so
// labeling the whole period by the BS month of day 1 alone (as
// formatMonthYear does) silently mislabels the majority of the period
// whenever the split falls before mid-month. Shows a day-range across both
// BS months when they differ; collapses to a single "Month Year" the rare
// times an AD month happens to land entirely within one BS month. English
// mode is unaffected — AD months are always exactly one AD month.
export function formatMonthRangeLabel(year: number, month: number, format: DateFormat): string {
  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  if (format === "english") {
    return formatMonthYear(firstDate, format);
  }

  const lastDay = new Date(year, month, 0).getDate();
  const lastDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const first = adToBs(firstDate);
  const last = adToBs(lastDate);

  if (first.month === last.month && first.year === last.year) {
    return `${NEPALI_MONTHS[first.month - 1]} ${first.year}`;
  }
  if (first.year === last.year) {
    return `${NEPALI_MONTHS[first.month - 1]} ${first.day} – ${NEPALI_MONTHS[last.month - 1]} ${last.day}, ${first.year}`;
  }
  return `${NEPALI_MONTHS[first.month - 1]} ${first.day}, ${first.year} – ${NEPALI_MONTHS[last.month - 1]} ${last.day}, ${last.year}`;
}
