"use client";

import { useMemo, useState } from "react";

import type { NotificationPreferences } from "@/lib/notification-preferences-cookie";
import { NotificationPreferencesCard } from "@/modules/notifications/components/NotificationPreferencesCard";
import { type NotificationRow, NotificationsManager, type NotificationTab } from "@/modules/notifications/components/NotificationsManager";
import { NotificationsTipCard } from "@/modules/notifications/components/NotificationsTipCard";
import { NotificationSummaryCard } from "@/modules/notifications/components/NotificationSummaryCard";
import { type UpcomingPayment, UpcomingPaymentsCard } from "@/modules/notifications/components/UpcomingPaymentsCard";

type Props = {
  initialPreferences: NotificationPreferences;
  rows: NotificationRow[];
  upcomingPayments: UpcomingPayment[];
};

export function NotificationsPageClient({ initialPreferences, rows, upcomingPayments }: Props) {
  const [tab, setTab] = useState<NotificationTab>("all");
  const [preferences, setPreferences] = useState(initialPreferences);

  const enabledRows = useMemo(() => rows.filter((r) => preferences[r.category]), [rows, preferences]);
  const alertCount = enabledRows.filter((r) => r.category === "budget" && r.readAt === null).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <NotificationsManager onTabChange={setTab} preferences={preferences} rows={rows} tab={tab} />
        <NotificationsTipCard />
      </div>

      <div className="space-y-6">
        <NotificationPreferencesCard initialPreferences={preferences} onChange={setPreferences} />
        <UpcomingPaymentsCard items={upcomingPayments} />
        <NotificationSummaryCard
          alertCount={alertCount}
          onReviewAlerts={() => setTab("alerts")}
          paymentCount={upcomingPayments.length}
        />
      </div>
    </div>
  );
}
