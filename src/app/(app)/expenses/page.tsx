import Link from "next/link";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/lib/data/categories";
import { listExpensesForMonth } from "@/lib/actions/expenses";
import { ExpenseListItem } from "@/components/expenses/expense-list-item";
import { Button } from "@/components/ui/button";

export default async function ExpensesPage() {
  const { householdId, memberId } = await getEffectiveMember();
  const now = new Date();
  const [members, categories, expenseRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listExpensesForMonth(now.getFullYear(), now.getMonth() + 1),
  ]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown";
  const ownerLabel = (id: string | null) => {
    if (id === null) return "Shared";
    if (id === memberId) return "Me";
    return members.find((m) => m.id === id)?.user.name ?? "Partner";
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Expenses</h1>
        <Button asChild>
          <Link href="/expenses/new">+ Add Expense</Link>
        </Button>
      </div>
      <div>
        {expenseRows.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses this month yet.</p>
        )}
        {expenseRows.map((e) => (
          <ExpenseListItem
            key={e.id}
            id={e.id}
            categoryName={categoryName(e.categoryId)}
            amount={Number(e.amount)}
            ownerLabel={ownerLabel(e.ownerMemberId)}
            date={e.date}
            note={e.note}
          />
        ))}
      </div>
    </div>
  );
}
