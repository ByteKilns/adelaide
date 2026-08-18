// `dateStr` is a "YYYY-MM-DD" string from a Postgres `date` column. Parsing
// it via `new Date("YYYY-MM-DD")` treats it as UTC midnight, which can land
// on the wrong local day when compared against "today" — so this parses the
// parts manually into a local-time Date instead.
export function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
