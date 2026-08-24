"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { ToneIcon } from "@/components/ToneIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { DateFormat } from "@/lib/date-format-cookie";
import type { NotificationRow } from "@/modules/notifications/components/NotificationsManager";
import { formatNotificationTime } from "@/modules/notifications/lib/notification-format";
import { getSeverityIcon, getSeverityTone } from "@/modules/notifications/lib/notification-icons";

type Props = { dateFormat: DateFormat; notifications: NotificationRow[]; unreadCount: number };

export function NotificationBell({ dateFormat, notifications, unreadCount }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full border bg-background p-2 text-muted-foreground hover:bg-accent"
          title="Notifications"
          type="button"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
          {notifications.map((n) => {
            const Icon = getSeverityIcon(n.severity);
            const tone = getSeverityTone(n.severity);
            const read = n.readAt !== null;
            return (
              <div className={`flex items-start gap-2.5 rounded-lg px-2 py-2 ${!read ? "bg-primary/5" : ""}`} key={n.id}>
                <ToneIcon className="h-8 w-8" icon={Icon} tone={tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {!read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatNotificationTime(n.createdAt, dateFormat)}</span>
              </div>
            );
          })}
        </div>

        <Link
          className="mt-1 flex items-center justify-center rounded-lg py-2 text-sm font-medium text-primary hover:bg-accent"
          href="/notifications"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
