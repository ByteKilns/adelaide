"use client";

import { useState, useTransition } from "react";

import { Settings } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationCategory, NotificationPreferences } from "@/lib/notification-preferences-cookie";
import { cn } from "@/lib/utils";
import { setNotificationPreferencesAction } from "@/modules/notifications/api/notifications.actions";

const ROWS: { copy: string; key: NotificationCategory; title: string }[] = [
  { copy: "Get notified when you're nearing a limit", key: "budget", title: "Budget alerts" },
  { copy: "Reminders for recurring expenses", key: "payment", title: "Upcoming payments" },
  { copy: "Progress and contribution updates", key: "goal", title: "Savings goals" },
  { copy: "Updates from your partner", key: "shared", title: "Shared activity" },
];

type Props = { initialPreferences: NotificationPreferences; onChange: (preferences: NotificationPreferences) => void };

export function NotificationPreferencesCard({ initialPreferences, onChange }: Props) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [, startTransition] = useTransition();

  function toggle(key: NotificationCategory) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    onChange(next);
    startTransition(async () => {
      try {
        await setNotificationPreferencesAction(next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save preference");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Notification preferences</CardTitle>
          <p className="text-sm text-muted-foreground">Choose what you want to hear about</p>
        </div>
        <Settings className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        {ROWS.map((row) => (
          <div className="flex items-center justify-between py-2" key={row.key}>
            <div>
              <p className="text-sm font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.copy}</p>
            </div>
            <button
              aria-label={`Toggle ${row.title}`}
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                preferences[row.key] ? "bg-primary" : "bg-muted",
              )}
              onClick={() => toggle(row.key)}
              type="button"
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background transition-transform",
                  preferences[row.key] && "translate-x-4",
                )}
              />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
