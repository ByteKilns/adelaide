import { getDateFormatPref } from "@/lib/date-format-cookie";
import { nextMonth, parseMonthParam, previousMonth } from "@/lib/month-nav";
import { currentPeriodYearMonth, formatPeriodLabel, MAX_NAVIGABLE_YEAR, MIN_NAVIGABLE_YEAR } from "@/lib/month-period";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";
import { ExpenseHeader } from "@/modules/expenses/components/ExpenseHeader";
import { ExpenseTable } from "@/modules/expenses/components/ExpenseTable";
import { roleForOwner } from "@/modules/expenses/lib/member-tone";

type Props = { searchParams: Promise<{ month?: string; year?: string }> };

export async function ExpensesPage({ searchParams }: Props) {
  const { householdId, memberId } = await getEffectiveMember();
  const dateFormat = await getDateFormatPref(householdId);
  const params = await searchParams;
  const { year: currentYear, month: currentMonth } = currentPeriodYearMonth(dateFormat);
  const year = parseMonthParam(params.year, currentYear, MAX_NAVIGABLE_YEAR[dateFormat], MIN_NAVIGABLE_YEAR[dateFormat]);
  const month = parseMonthParam(params.month, currentMonth, 12);
  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  const [members, categories, expenseRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listExpensesForMonth(year, month, dateFormat),
  ]);

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";
  const memberName = (id: string) => members.find((m) => m.id === id)?.user.name ?? "Unknown";
  const partner = members.find((m) => m.id !== memberId) ?? null;

  const rows = expenseRows.map((e) => ({
    amount: Number(e.amount),
    categoryGroupName: category(e.categoryId)?.groupName ?? "",
    categoryId: e.categoryId,
    categoryName: categoryName(e.categoryId),
    date: e.date,
    id: e.id,
    note: e.note,
    ownerMemberId: e.ownerMemberId,
    ownerName: e.ownerMemberId ? memberName(e.ownerMemberId) : null,
    paidByMemberId: e.paidByMemberId,
    paidByName: memberName(e.paidByMemberId),
  }));

  const exportRows = expenseRows.map((e) => ({
    amount: Number(e.amount),
    category: categoryName(e.categoryId),
    date: e.date,
    name: e.note ?? categoryName(e.categoryId),
    owner: e.ownerMemberId ? roleForOwner(e.ownerMemberId, memberId) : "shared",
  }));

  const monthLabel = formatPeriodLabel(year, month, dateFormat);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <ExpenseHeader
        categories={categories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }))}
        currentMemberId={memberId}
        exportRows={exportRows}
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        monthLabel={monthLabel}
        nextHref={`/expenses?year=${next.year}&month=${next.month}`}
        prevHref={`/expenses?year=${prev.year}&month=${prev.month}`}
      />

      <ExpenseTable
        categories={categories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }))}
        dateFormat={dateFormat}
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        partnerName={partner?.user.name ?? null}
        realMemberId={memberId}
        rows={rows}
      />
    </div>
  );
}
