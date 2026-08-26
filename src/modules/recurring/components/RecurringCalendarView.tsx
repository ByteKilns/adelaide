"use client";

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

  const rowsByDate = new Map<string, RecurringRow[]>();
  for (const row of rows) {
    const list = rowsByDate.get(row.nextDueDate) ?? [];
    list.push(row);
    rowsByDate.set(row.nextDueDate, list);
  }

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div className="px-2 py-2 text-center" key={day}>
            {day}
          </div>
        ))}
      </div>
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
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                          TONE_BADGE_CLASSES[getCategoryTone(item.categoryGroupName)],
                        )}
                        key={item.id}
                        title={`${item.name} — ${formatNPR(item.amount)}`}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
