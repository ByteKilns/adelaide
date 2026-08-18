import { Bell } from "lucide-react";

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
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {getGreeting()}, {name}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your financial overview for {monthLabel}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Notifications (coming soon)"
          className="rounded-full border p-2 text-muted-foreground/50"
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
