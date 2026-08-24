import type { Tone } from "@/components/ToneIcon";
import { formatDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";

export type RecurringItem = {
  amount: number;
  categoryId: string;
  frequency: "monthly" | "yearly";
  id: string;
  nextDueDate: string;
  ownerMemberId: null | string;
  status: "active" | "completed" | "paused";
};

export type RecurringCategory = { budgetType: "fixed" | "flexible"; groupName: string; id: string; name: string };

function isInMonth(dateStr: string, year: number, month: number) {
  const [y, m] = dateStr.split("-").map(Number);
  return y === year && m === month;
}

export type RecurringStats = {
  nextDue: { date: string; id: string } | null;
  paidThisMonth: number;
  paidThisMonthCount: number;
  totalRecurring: number;
  upcoming: number;
  upcomingCount: number;
};

export function recurringStats(
  items: RecurringItem[],
  paidThisMonthIds: Set<string>,
  paidThisMonthTotal: number,
  year: number,
  month: number,
): RecurringStats {
  const dueThisMonth = items.filter(
    (i) => i.status !== "completed" && (isInMonth(i.nextDueDate, year, month) || paidThisMonthIds.has(i.id)),
  );

  const totalRecurring = dueThisMonth.reduce((s, i) => s + i.amount, 0);
  const upcomingItems = dueThisMonth.filter((i) => i.status === "active" && !paidThisMonthIds.has(i.id));
  const upcoming = upcomingItems.reduce((s, i) => s + i.amount, 0);

  const nextDueItem = items
    .filter((i) => i.status === "active")
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0];

  return {
    nextDue: nextDueItem ? { date: nextDueItem.nextDueDate, id: nextDueItem.id } : null,
    paidThisMonth: paidThisMonthTotal,
    paidThisMonthCount: paidThisMonthIds.size,
    totalRecurring,
    upcoming,
    upcomingCount: upcomingItems.length,
  };
}

export type BudgetTypeSlice = { amount: number; key: "fixed" | "flexible"; label: string; tone: Tone };

export function byBudgetType(items: RecurringItem[], categories: RecurringCategory[]): BudgetTypeSlice[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const active = items.filter((i) => i.status === "active");

  const fixed = active
    .filter((i) => categoryById.get(i.categoryId)?.budgetType === "fixed")
    .reduce((s, i) => s + i.amount, 0);
  const flexible = active
    .filter((i) => categoryById.get(i.categoryId)?.budgetType === "flexible")
    .reduce((s, i) => s + i.amount, 0);

  return [
    { amount: fixed, key: "fixed", label: "Fixed", tone: "purple" },
    { amount: flexible, key: "flexible", label: "Flexible", tone: "amber" },
  ];
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dateStr}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDueDate(dateStr: string, format: DateFormat): string {
  return formatDate(dateStr, format);
}

export type CategoryGroupTotal = { amount: number; groupName: string; tone: Tone };

export function byCategoryGroup(items: RecurringItem[], categories: RecurringCategory[]): CategoryGroupTotal[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();

  for (const item of items) {
    if (item.status !== "active") continue;
    const category = categoryById.get(item.categoryId);
    if (!category) continue;
    totals.set(category.groupName, (totals.get(category.groupName) ?? 0) + item.amount);
  }

  return [...totals.entries()]
    .map(([groupName, amount]) => ({ amount, groupName, tone: getCategoryTone(groupName) }))
    .sort((a, b) => b.amount - a.amount);
}
