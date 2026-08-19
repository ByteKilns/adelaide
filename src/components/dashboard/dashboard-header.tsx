import { Bell, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

type Props = { name: string; monthLabel: string };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ name, monthLabel }: Props) {
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-primary/5 to-primary/10 p-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {getGreeting()}, {name}! 👋
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Here&apos;s your financial overview for</span>
          {/* Month navigation is a visual placeholder for now — switching
              months isn't wired up yet, so the controls are inert/disabled
              rather than silently doing nothing on click. */}
          <div
            aria-disabled="true"
            className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground"
          >
            <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
              <ChevronLeft className="h-4 w-4" />
            </span>
            <span className="flex items-center gap-1 px-1 text-sm font-medium">
              {monthLabel}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Notifications (coming soon)"
          className="rounded-full border bg-background p-2 text-muted-foreground/50"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </div>
      </div>
    </div>
  );
}
