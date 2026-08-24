import type { Tone } from "@/components/ToneIcon";
import { formatMonthShort } from "@/lib/date-format";
import type { DateFormat } from "@/lib/date-format-cookie";
import { getCategoryTone } from "@/modules/categories/lib/category-icons";

export function trendPct(current: number, previous: number): null | number {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type CategorySlice = { amount: number; categoryId: string; groupName: string; name: string; pct: number; tone: Tone };

export function categoryBreakdown(
  expenses: { amount: number; categoryId: string }[],
  categories: { groupName: string; id: string; name: string }[],
  limit: number,
): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = categoryById.get(categoryId);
      return {
        amount,
        categoryId,
        groupName: category?.groupName ?? "Other",
        name: category?.name ?? "Unknown",
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
        tone: getCategoryTone(category?.groupName ?? "Other"),
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export type MonthPoint = { expenses: number; income: number; label: string };

export function monthlyIncomeExpenseTrend(
  incomeRows: { amount: number; month: number; year: number }[],
  expenseRows: { amount: number; date: string }[],
  monthsBack: number,
  dateFormat: DateFormat,
): MonthPoint[] {
  const now = new Date();
  const months: { label: string; month: number; year: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: formatMonthShort(d.toISOString().slice(0, 10), dateFormat),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }

  return months.map(({ label, month, year }) => {
    const income = incomeRows.filter((i) => i.year === year && i.month === month).reduce((s, i) => s + i.amount, 0);
    const expenseTotal = expenseRows
      .filter((e) => {
        const [y, m] = e.date.split("-").map(Number);
        return y === year && m === month;
      })
      .reduce((s, e) => s + e.amount, 0);
    return { expenses: expenseTotal, income, label };
  });
}

// (Remaining budget for the month) / (days left, inclusive of today) — a
// simple daily spending allowance, not a forecast. Clamped at 0 so an
// already-overspent month shows "NPR 0" instead of a negative number.
export function safeToSpendToday(totalPlanned: number, totalActual: number, year: number, month: number): number {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const daysLeft = isCurrentMonth ? Math.max(1, daysInMonth - now.getDate() + 1) : daysInMonth;
  const remaining = totalPlanned - totalActual;
  return Math.max(0, Math.round(remaining / daysLeft));
}

export type PacePoint = { actual: null | number; day: number; pace: number };

// Cumulative actual spend vs. an even daily-pace line (budget spread evenly
// across the month), day by day. For the current month, `actual` stops at
// today (null afterward, so the line doesn't imply spending that hasn't
// happened yet); for a past month it runs the full length. `pace` always
// runs the full month as a reference line — it's meaningless without a
// budget, so callers should skip rendering it when totalPlanned <= 0.
export function dailySpendingPace(
  expenses: { amount: number; date: string }[],
  year: number,
  month: number,
  totalPlanned: number,
): PacePoint[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const lastActualDay = isCurrentMonth ? now.getDate() : daysInMonth;

  const spentByDay = new Map<number, number>();
  for (const e of expenses) {
    const day = Number(e.date.split("-")[2]);
    spentByDay.set(day, (spentByDay.get(day) ?? 0) + e.amount);
  }

  const points: PacePoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const withinActualRange = day <= lastActualDay;
    if (withinActualRange) cumulative += spentByDay.get(day) ?? 0;
    points.push({
      actual: withinActualRange ? Math.round(cumulative) : null,
      day,
      pace: Math.round((totalPlanned * day) / daysInMonth),
    });
  }
  return points;
}

export function daysLeftInMonth(year: number, month: number): number {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  return isCurrentMonth ? Math.max(0, daysInMonth - now.getDate() + 1) : daysInMonth;
}

export function spendingInsight(currentExpenses: number, previousExpenses: number): string {
  const pct = trendPct(currentExpenses, previousExpenses);
  if (pct === null) return "Not enough history yet to compare against last month.";
  if (pct < 0) return `You're spending ${Math.abs(pct)}% less than last month. Great progress on your goals!`;
  if (pct > 0) return `You're spending ${pct}% more than last month. Consider reviewing your budget.`;
  return "Your spending is about the same as last month.";
}
