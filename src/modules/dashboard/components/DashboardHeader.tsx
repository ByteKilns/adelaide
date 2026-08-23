import { Bell, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = { monthLabel: string; name: string; nextHref: string; prevHref: string; unreadNotifications: number };

export function DashboardHeader({ monthLabel, name, nextHref, prevHref, unreadNotifications }: Props) {
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-primary/5 to-primary/10 p-4">
      <div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Here&apos;s your financial overview for</span>
          <div className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground">
            <Link aria-label="Previous month" className="rounded-full p-1 hover:bg-accent" href={prevHref}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="flex items-center gap-1 px-1 text-sm font-medium">
              {monthLabel}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <Link aria-label="Next month" className="rounded-full p-1 hover:bg-accent" href={nextHref}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          className="relative rounded-full border bg-background p-2 text-muted-foreground hover:bg-accent"
          href="/notifications"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
              {unreadNotifications}
            </span>
          )}
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </div>
      </div>
    </div>
  );
}
