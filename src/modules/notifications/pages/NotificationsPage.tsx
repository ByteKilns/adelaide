import { Bell, CalendarDays, CircleAlert, CircleCheck } from "lucide-react";
import { cookies } from "next/headers";

import { StatAmount } from "@/components/StatAmount";
import { StatCardGrid } from "@/components/StatCardGrid";
import { formatMonthYear } from "@/lib/date-format";
import { getDateFormatPref } from "@/lib/date-format-cookie";
import { NOTIFICATION_PREFS_COOKIE_NAME, parseNotificationPreferences } from "@/lib/notification-preferences-cookie";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";
import {
  listNotifications,
  syncDhukuDueSoonNotifications,
  syncDueSoonNotifications,
  syncLoanInstallmentsDueSoonNotifications,
} from "@/modules/notifications/api/notifications.actions";
import { NotificationsHeader } from "@/modules/notifications/components/NotificationsHeader";
import { NotificationsPageClient } from "@/modules/notifications/components/NotificationsPageClient";
import { listRecurringExpenses } from "@/modules/recurring/api/recurring.actions";
import { trendPct } from "@/modules/reports/lib/reports-stats";

function displayLabel(role: "me" | "partner" | "shared", name: string): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name;
}

export async function NotificationsPage() {
  const { householdId, memberId } = await getCurrentMember();

  await Promise.all([
    syncDueSoonNotifications(householdId),
    syncLoanInstallmentsDueSoonNotifications(householdId),
    syncDhukuDueSoonNotifications(householdId),
  ]);

  const [members, categories, notificationRows, recurringItems, cookieStore, dateFormat] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listNotifications(householdId),
    listRecurringExpenses(householdId),
    cookies(),
    getDateFormatPref(),
  ]);

  const preferences = parseNotificationPreferences(cookieStore.get(NOTIFICATION_PREFS_COOKIE_NAME)?.value);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const rows = notificationRows.map((n) => ({
    body: n.body,
    category: n.category,
    createdAt: n.createdAt,
    id: n.id,
    readAt: n.readAt,
    severity: n.severity,
    title: n.title,
  }));

  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const upcomingPayments = recurringItems
    .filter((item) => item.status === "active")
    .filter((item) => {
      const due = new Date(`${item.nextDueDate}T00:00:00`);
      return due >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && due <= in7Days;
    })
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .map((item) => {
      const owner = item.ownerMemberId ? memberById.get(item.ownerMemberId) : null;
      const ownerLabel = displayLabel(roleForOwner(item.ownerMemberId, memberId), owner?.user.name ?? "Partner");
      return {
        amount: Number(item.amount),
        categoryGroupName: categoryById.get(item.categoryId)?.groupName ?? "Other",
        id: item.id,
        name: item.name,
        nextDueDate: item.nextDueDate,
        ownerLabel,
      };
    });

  const totalNotifications = rows.length;
  const unreadCount = rows.filter((r) => r.readAt === null).length;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const resolvedThisMonth = rows.filter((r) => r.readAt !== null && r.readAt >= monthStart).length;
  const resolvedLastMonth = rows.filter((r) => r.readAt !== null && r.readAt >= lastMonthStart && r.readAt < monthStart).length;
  const resolvedTrend = trendPct(resolvedThisMonth, resolvedLastMonth);

  const monthLabel = formatMonthYear(now.toISOString().slice(0, 10), dateFormat);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <NotificationsHeader monthLabel={monthLabel} />

      <StatCardGrid
        cards={[
          {
            content: (
              <div>
                <StatAmount>{totalNotifications}</StatAmount>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            ),
            icon: Bell,
            title: "Total notifications",
            tone: "purple",
          },
          {
            content: (
              <div>
                <StatAmount>{unreadCount}</StatAmount>
                <p className="text-xs text-muted-foreground">Need your attention</p>
              </div>
            ),
            icon: CircleAlert,
            title: "Unread",
            tone: "pink",
          },
          {
            content: (
              <div>
                <StatAmount>{upcomingPayments.length}</StatAmount>
                <p className="text-xs text-muted-foreground">Next 7 days</p>
              </div>
            ),
            icon: CalendarDays,
            title: "Upcoming payments",
            tone: "amber",
          },
          {
            content: (
              <div>
                <StatAmount>{resolvedThisMonth}</StatAmount>
                <p className="text-xs text-muted-foreground">
                  {resolvedTrend === null ? "Resolved this month" : `${resolvedTrend >= 0 ? "+" : ""}${resolvedTrend}% vs last month`}
                </p>
              </div>
            ),
            icon: CircleCheck,
            title: "Resolved alerts",
            tone: "green",
          },
        ]}
      />

      <NotificationsPageClient
        dateFormat={dateFormat}
        initialPreferences={preferences}
        rows={rows}
        upcomingPayments={upcomingPayments}
      />
    </div>
  );
}
