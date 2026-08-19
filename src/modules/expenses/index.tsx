import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";
import { ExpenseForm } from "@/modules/expenses/components/ExpenseForm";
import { ExpenseListItem } from "@/modules/expenses/components/ExpenseListItem";

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
            amount={Number(e.amount)}
            categoryName={categoryName(e.categoryId)}
            date={e.date}
            id={e.id}
            key={e.id}
            note={e.note}
            ownerLabel={ownerLabel(e.ownerMemberId)}
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
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      currentMemberId={memberId}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
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
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      currentMemberId={memberId}
      expenseId={expense.id}
      initial={{
        amount: Number(expense.amount),
        categoryId: expense.categoryId,
        ownerMemberId: expense.ownerMemberId,
        paidByMemberId: expense.paidByMemberId,
        date: expense.date,
        note: expense.note,
      }}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
    />
  );
}
