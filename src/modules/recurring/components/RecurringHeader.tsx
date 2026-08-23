import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Props = { monthLabel: string };

export function RecurringHeader({ monthLabel }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Recurring</h1>
        <p className="text-sm text-muted-foreground">Manage your recurring and upcoming expenses</p>
      </div>
      {/* Month navigation is a visual placeholder for now — switching months
          isn't wired up yet, matching the same pattern used on the budget
          and expenses headers. */}
      <div
        aria-disabled="true"
        className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground"
      >
        <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
          <ChevronLeft className="h-4 w-4" />
        </span>
        <span className="flex items-center gap-1 px-2 text-sm font-medium">
          {monthLabel}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
