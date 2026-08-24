import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { DateFormat } from "@/lib/date-format-cookie";
import { NotificationBell } from "@/modules/notifications/components/NotificationBell";
import type { NotificationRow } from "@/modules/notifications/components/NotificationsManager";

type Props = {
  dateFormat: DateFormat;
  monthLabel: string;
  name: string;
  nextHref: string;
  notifications: NotificationRow[];
  prevHref: string;
  unreadNotifications: number;
};

export function DashboardHeader({
  dateFormat,
  monthLabel,
  name,
  nextHref,
  notifications,
  prevHref,
  unreadNotifications,
}: Props) {
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-featured p-4">
      <div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Here&apos;s your financial overview for</span>
          <div className="flex items-center gap-1 rounded-full bg-background px-1 py-1 text-foreground shadow-[0_1px_4px_rgba(102,45,145,0.1)]">
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
        <NotificationBell dateFormat={dateFormat} notifications={notifications} unreadCount={unreadNotifications} />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </div>
      </div>
    </div>
  );
}
