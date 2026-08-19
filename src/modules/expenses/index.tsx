import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { listExpensesForMonth } from "@/modules/expenses/api/actions";
import { ExpenseListItem } from "@/modules/expenses/components/expense_list_item";
import { ExpenseForm } from "@/modules/expenses/components/expense_form";
import { Button } from "@/components/ui/button";

export async function ExpensesPage() {
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

export async function NewExpensePage() {
  const { memberId, householdId } = await getEffectiveMember();
  const [members, categories] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
  ]);

  return (
    <ExpenseForm
      currentMemberId={memberId}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}

export async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { memberId, householdId } = await getEffectiveMember();
  const [members, categories] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
  ]);

  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  if (!expense) notFound();

  return (
    <ExpenseForm
      currentMemberId={memberId}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      expenseId={expense.id}
      initial={{
        amount: Number(expense.amount),
        categoryId: expense.categoryId,
        ownerMemberId: expense.ownerMemberId,
        paidByMemberId: expense.paidByMemberId,
        date: expense.date,
        note: expense.note,
      }}
    />
  );
}
