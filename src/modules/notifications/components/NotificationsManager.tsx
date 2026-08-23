"use client";

import { useMemo, useState, useTransition } from "react";

import { Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { ToneIcon } from "@/components/ToneIcon";
import { Button } from "@/components/ui/button";
import type { NotificationPreferences } from "@/lib/notification-preferences-cookie";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/modules/notifications/api/notifications.actions";
import { formatNotificationTime } from "@/modules/notifications/lib/notification-format";
import { getSeverityIcon, getSeverityTone, type NotificationSeverity } from "@/modules/notifications/lib/notification-icons";

export type NotificationRow = {
  body: string;
  category: keyof NotificationPreferences;
  createdAt: Date;
  id: string;
  readAt: Date | null;
  severity: NotificationSeverity;
  title: string;
};

const CATEGORY_LABEL: Record<NotificationRow["category"], string> = {
  budget: "Budget alert",
  goal: "Savings goal",
  payment: "Upcoming payment",
  shared: "Shared activity",
};

export type NotificationTab = "all" | "alerts" | "unread";

type Props = {
  onTabChange: (tab: NotificationTab) => void;
  preferences: NotificationPreferences;
  rows: NotificationRow[];
  tab: NotificationTab;
};

export function NotificationsManager({ onTabChange, preferences, rows, tab }: Props) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const isRead = (row: NotificationRow) => row.readAt !== null || readIds.has(row.id);

  function handleMarkRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      try {
        await markNotificationReadAction(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  function handleMarkAllRead() {
    setReadIds(new Set(rows.map((r) => r.id)));
    startTransition(async () => {
      try {
        await markAllNotificationsReadAction();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  const enabledRows = useMemo(() => rows.filter((r) => preferences[r.category]), [rows, preferences]);
  const unreadCount = enabledRows.filter((r) => !isRead(r)).length;

  const visible = useMemo(() => {
    if (tab === "unread") return enabledRows.filter((r) => !isRead(r));
    if (tab === "alerts") return enabledRows.filter((r) => r.category === "budget");
    return enabledRows;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isRead depends on readIds, already a dependency
  }, [enabledRows, tab, readIds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {(["all", "unread", "alerts"] as NotificationTab[]).map((t) => (
            <button
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
              key={t}
              onClick={() => onTabChange(t)}
              type="button"
            >
              {t === "all" ? "All" : t === "unread" ? "Unread" : "Alerts"}
              {t === "unread" && unreadCount > 0 && (
                <span className="rounded-full bg-destructive px-1.5 text-xs text-white">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        <Button onClick={handleMarkAllRead} type="button" variant="ghost">
          <Check className="h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="divide-y overflow-hidden rounded-2xl border">
        {visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No notifications here.</p>}
        {visible.map((row) => {
          const read = isRead(row);
          const Icon = getSeverityIcon(row.severity);
          const tone = getSeverityTone(row.severity);
          return (
            <article className={`flex items-start gap-3 p-4 ${!read ? "bg-primary/5" : ""}`} key={row.id}>
              <ToneIcon icon={Icon} tone={tone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm">{row.title}</strong>
                  {!read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{row.body}</p>
                <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {CATEGORY_LABEL[row.category]}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <small className="text-xs text-muted-foreground">{formatNotificationTime(row.createdAt)}</small>
                <button
                  aria-label={read ? "Notification read" : `Mark ${row.title} as read`}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  onClick={() => !read && handleMarkRead(row.id)}
                  type="button"
                >
                  {read ? <MoreHorizontal className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
