import { cookies } from "next/headers";

// Shared between every page/action that formats a date (reads it
// server-side) and the settings module (writes it).
export const DATE_FORMAT_COOKIE_NAME = "date-format";

export const DATE_FORMATS = ["nepali", "english"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const DEFAULT_DATE_FORMAT: DateFormat = "nepali";

export function isDateFormat(value: string): value is DateFormat {
  return (DATE_FORMATS as readonly string[]).includes(value);
}

// Threaded into every date formatter call site across the app (pages, server
// actions, and — via props — the client hooks/components that render dates
// on the client), so read it once here rather than re-parsing the cookie in
// each of those call sites.
export async function getDateFormatPref(): Promise<DateFormat> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DATE_FORMAT_COOKIE_NAME)?.value ?? "";
  return isDateFormat(value) ? value : DEFAULT_DATE_FORMAT;
}
