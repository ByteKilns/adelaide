import { CalendarClock, CalendarDays, CheckCircle2, Clock } from "lucide-react";

import { StatAmount } from "@/components/StatAmount";
import { StatCardGrid } from "@/components/StatCardGrid";
import { formatMonthYear, formatShortDate } from "@/lib/date-format";
import { getDateFormatPref } from "@/lib/date-format-cookie";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";
import { listRecurringExpenses } from "@/modules/recurring/api/recurring.actions";
import { ByCategoryCard } from "@/modules/recurring/components/ByCategoryCard";
import { QuickTipsCard } from "@/modules/recurring/components/QuickTipsCard";
import { RecurringHeader } from "@/modules/recurring/components/RecurringHeader";
import { RecurringManager } from "@/modules/recurring/components/RecurringManager";
import { RecurringSummaryCard } from "@/modules/recurring/components/RecurringSummaryCard";
import { UpcomingThisMonthCard } from "@/modules/recurring/components/UpcomingThisMonthCard";
import type { RecurringRow } from "@/modules/recurring/hooks/useRecurringTableColumns";
import { byBudgetType, byCategoryGroup, recurringStats } from "@/modules/recurring/lib/recurring-stats";

function displayLabel(role: "me" | "partner" | "shared", name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

export async function RecurringPage() {
  const { householdId, memberId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, recurringItems, monthExpenses, dateFormat] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listRecurringExpenses(householdId),
    listExpensesForMonth(year, month),
    getDateFormatPref(),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const paidThisMonthIds = new Set(
    monthExpenses.filter((e) => e.recurringExpenseId).map((e) => e.recurringExpenseId!),
  );
  const paidThisMonthTotal = monthExpenses
    .filter((e) => e.recurringExpenseId)
    .reduce((s, e) => s + Number(e.amount), 0);

  const rows: RecurringRow[] = recurringItems.map((item) => {
    const category = categoryById.get(item.categoryId);
    const owner = item.ownerMemberId ? memberById.get(item.ownerMemberId) : null;
    return {
      amount: Number(item.amount),
      categoryGroupName: category?.groupName ?? "Other",
      categoryName: category?.name ?? "Unknown",
      endDate: item.endDate,
      frequency: item.frequency,
      icon: item.icon,
      id: item.id,
      name: item.name,
      nextDueDate: item.nextDueDate,
      ownerMemberId: item.ownerMemberId,
      ownerName: owner?.user.name ?? null,
      paidThisMonth: paidThisMonthIds.has(item.id),
      status: item.status,
      vendor: item.vendor,
    };
  });

  const statsItems = recurringItems.map((i) => ({
    amount: Number(i.amount),
    categoryId: i.categoryId,
    frequency: i.frequency,
    id: i.id,
    nextDueDate: i.nextDueDate,
    ownerMemberId: i.ownerMemberId,
    status: i.status,
  }));

  const stats = recurringStats(statsItems, paidThisMonthIds, paidThisMonthTotal, year, month);
  const budgetTypeSlices = byBudgetType(statsItems, categories);
  const categoryTotals = byCategoryGroup(statsItems, categories);

  const upcomingItems = rows
    .filter((r) => r.status === "active" && !r.paidThisMonth)
    .map((r) => ({
      amount: r.amount,
      categoryGroupName: r.categoryGroupName,
      icon: r.icon,
      id: r.id,
      name: r.name,
      nextDueDate: r.nextDueDate,
      ownerLabel: displayLabel(roleForOwner(r.ownerMemberId, memberId), r.ownerName),
    }));

  const monthLabel = formatMonthYear(now.toISOString().slice(0, 10), dateFormat);
  const nextDueLabel = stats.nextDue ? formatShortDate(stats.nextDue.date, dateFormat) : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <RecurringHeader monthLabel={monthLabel} />

      <StatCardGrid
        cards={[
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.totalRecurring)}</StatAmount>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            ),
            icon: CalendarDays,
            title: "Total Recurring",
            tone: "purple",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.paidThisMonth)}</StatAmount>
                <p className="text-xs text-muted-foreground">{stats.paidThisMonthCount} paid</p>
              </div>
            ),
            icon: CheckCircle2,
            title: "Paid This Month",
            tone: "green",
          },
          {
            content: (
              <div>
                <StatAmount>{formatNPR(stats.upcoming)}</StatAmount>
                <p className="text-xs text-muted-foreground">{stats.upcomingCount} upcoming</p>
              </div>
            ),
            icon: Clock,
            title: "Upcoming",
            tone: "amber",
          },
          {
            content: (
              <div>
                <StatAmount>{nextDueLabel}</StatAmount>
                <p className="truncate text-xs text-muted-foreground">
                  {rows.find((r) => r.id === stats.nextDue?.id)?.name ?? "Nothing scheduled"}
                </p>
              </div>
            ),
            icon: CalendarClock,
            title: "Next Due",
            tone: "blue",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <RecurringManager
            categories={categories}
            currentMemberId={memberId}
            dateFormat={dateFormat}
            members={members.map((m) => ({ id: m.id, name: m.user.name }))}
            realMemberId={memberId}
            rows={rows}
          />
        </div>

        <div className="space-y-6">
          <UpcomingThisMonthCard items={upcomingItems} />
          <RecurringSummaryCard slices={budgetTypeSlices} />
          <ByCategoryCard totals={categoryTotals} />
          <QuickTipsCard />
        </div>
      </div>
    </div>
  );
}
