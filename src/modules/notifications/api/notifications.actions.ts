"use server";

import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { budgetItems, categories, expenses, monthlyBudgets, notifications, recurringExpenses } from "@/db/schema";
import { formatBsMonthYear } from "@/lib/nepali-date";
import { NOTIFICATION_PREFS_COOKIE_NAME, type NotificationPreferences } from "@/lib/notification-preferences-cookie";
import { getCurrentMember } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { formatDueDate } from "@/modules/recurring/lib/recurring-stats";

type NotificationInput = {
  body: string;
  category: "budget" | "goal" | "payment" | "shared";
  dedupeKey: string;
  householdId: string;
  severity: "danger" | "info" | "success" | "warning";
  title: string;
};

// Every automatic notification (budget threshold, due-soon bill, new
// contribution, new shared expense) funnels through here so the dedupe
// behavior — never insert the same real-world event twice — lives in one
// place instead of being reimplemented at each call site.
export async function insertNotification(input: NotificationInput) {
  await db
    .insert(notifications)
    .values(input)
    .onConflictDoNothing({ target: [notifications.householdId, notifications.dedupeKey] });
}

// Called after an expense is created/updated. Compares spend-so-far for the
// affected category+owner+month against its planned budget and fires a
// one-time "80% reached" and/or "budget exceeded" notification — dedupeKey
// ensures each threshold only ever fires once per category/owner/month, no
// matter how many further expenses land in the same bucket afterward.
export async function checkBudgetThreshold(
  householdId: string,
  categoryId: string,
  ownerMemberId: null | string,
  dateStr: string,
) {
  const [year, month] = dateStr.split("-").map(Number);

  const [budget] = await db
    .select()
    .from(monthlyBudgets)
    .where(and(eq(monthlyBudgets.householdId, householdId), eq(monthlyBudgets.year, year), eq(monthlyBudgets.month, month)));
  if (!budget) return;

  const ownerCondition = ownerMemberId === null ? isNull(budgetItems.ownerMemberId) : eq(budgetItems.ownerMemberId, ownerMemberId);
  const [item] = await db
    .select()
    .from(budgetItems)
    .where(and(eq(budgetItems.monthlyBudgetId, budget.id), eq(budgetItems.categoryId, categoryId), ownerCondition));
  const planned = Number(item?.plannedAmount ?? 0);
  if (planned <= 0) return;

  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
  if (!category) return;

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const monthExpenseOwnerCondition = ownerMemberId === null ? isNull(expenses.ownerMemberId) : eq(expenses.ownerMemberId, ownerMemberId);
  const monthExpenses = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.householdId, householdId),
        eq(expenses.categoryId, categoryId),
        monthExpenseOwnerCondition,
        gte(expenses.date, monthStart),
        lte(expenses.date, monthEnd),
      ),
    );
  const spent = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const pct = spent / planned;
  const ownerKey = ownerMemberId ?? "shared";

  if (pct >= 1) {
    await insertNotification({
      body: `You've spent ${formatNPR(spent)} of your ${formatNPR(planned)} ${category.name.toLowerCase()} budget.`,
      category: "budget",
      dedupeKey: `budget:${categoryId}:${ownerKey}:${year}:${month}:100`,
      householdId,
      severity: "danger",
      title: `${category.name} budget exceeded`,
    });
  } else if (pct >= 0.8) {
    await insertNotification({
      body: `You've spent ${formatNPR(spent)} of your ${formatNPR(planned)} ${category.name.toLowerCase()} budget.`,
      category: "budget",
      dedupeKey: `budget:${categoryId}:${ownerKey}:${year}:${month}:80`,
      householdId,
      severity: "warning",
      title: `${category.name} is at 80%`,
    });
  }
}

// Called (lazily, on Notifications page load) to generate "due soon"
// notifications for active recurring items whose next due date is within
// the next 3 days. dedupeKey includes the due date itself, so once an item
// is marked paid and its date rolls forward, a fresh notification is
// allowed for the new cycle.
export async function syncDueSoonNotifications(householdId: string) {
  const items = await db
    .select()
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.householdId, householdId), eq(recurringExpenses.status, "active")));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const item of items) {
    const due = new Date(`${item.nextDueDate}T00:00:00`);
    const daysUntil = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0 || daysUntil > 3) continue;

    const dueLabel = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
    await insertNotification({
      body: `Your recurring payment of ${formatNPR(Number(item.amount))} is scheduled for ${formatDueDate(item.nextDueDate)}.`,
      category: "payment",
      dedupeKey: `recurring:${item.id}:${item.nextDueDate}`,
      householdId,
      severity: daysUntil <= 1 ? "warning" : "info",
      title: `${item.name} is due ${dueLabel}`,
    });
  }
}

// Called from Dashboard/Budget whenever they render the actual current
// calendar month (never for a past/future month the user has merely
// navigated to) and that month has zero budget items. dedupeKey is
// per-household-per-month, so this only ever fires once per month no matter
// how many times the page is visited.
export async function checkBudgetReminder(householdId: string, year: number, month: number, itemCount: number) {
  if (itemCount > 0) return;

  const monthLabel = formatBsMonthYear(`${year}-${String(month).padStart(2, "0")}-01`);
  await insertNotification({
    body: "You haven't planned a budget for this month yet. Head to Budget to set your category amounts.",
    category: "budget",
    dedupeKey: `budget-reminder:${householdId}:${year}:${month}`,
    householdId,
    severity: "info",
    title: `Set your budget for ${monthLabel}`,
  });
}

export async function listNotifications(householdId: string) {
  return db.select().from(notifications).where(eq(notifications.householdId, householdId)).orderBy(desc(notifications.createdAt));
}

export async function listRecentNotifications(householdId: string, limit: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.householdId, householdId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(householdId: string) {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.householdId, householdId), isNull(notifications.readAt)));
  return rows.length;
}

export async function markNotificationReadAction(id: string) {
  const { householdId } = await getCurrentMember();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.householdId, householdId)));
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const { householdId } = await getCurrentMember();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.householdId, householdId), isNull(notifications.readAt)));
  revalidatePath("/notifications");
}

export async function setNotificationPreferencesAction(preferences: NotificationPreferences) {
  const cookieStore = await cookies();
  cookieStore.set(NOTIFICATION_PREFS_COOKIE_NAME, JSON.stringify(preferences), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/notifications");
}
