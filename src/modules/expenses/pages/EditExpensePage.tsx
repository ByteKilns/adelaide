import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { ExpenseForm } from "@/modules/expenses/components/ExpenseForm";

export async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { householdId, memberId } = await getEffectiveMember();
  const [members, categories] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId, { includeArchived: true }),
  ]);

  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  if (!expense) notFound();

  const visibleCategories = categories.filter((c) => !c.archived || c.id === expense.categoryId);

  return (
    <div className="mx-auto max-w-sm p-4">
      <ExpenseForm
        categories={visibleCategories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }))}
        currentMemberId={memberId}
        expenseId={expense.id}
        initial={{
          amount: Number(expense.amount),
          categoryId: expense.categoryId,
          date: expense.date,
          note: expense.note,
          ownerMemberId: expense.ownerMemberId,
          paidByMemberId: expense.paidByMemberId,
        }}
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      />
    </div>
  );
}
