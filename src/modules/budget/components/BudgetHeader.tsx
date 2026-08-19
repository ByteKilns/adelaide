import { ChevronDown, ChevronLeft, ChevronRight, Copy } from "lucide-react";

type Props = { monthLabel: string };

export function BudgetHeader({ monthLabel }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Budget</h1>
        <p className="text-sm text-muted-foreground">Plan your money for the month</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Month navigation is a visual placeholder for now — switching
            months isn't wired up yet, matching the same pattern used on the
            dashboard and expenses headers. */}
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
        {/* "Copy previous month" isn't wired up yet either. */}
        <button
          className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground/50"
          disabled
          type="button"
        >
          <Copy className="h-4 w-4" />
          Copy previous month
        </button>
      </div>
    </div>
  );
}
