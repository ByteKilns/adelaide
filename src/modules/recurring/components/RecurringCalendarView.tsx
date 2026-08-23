"use client";

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
