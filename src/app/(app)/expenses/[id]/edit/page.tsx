import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { ExpenseForm } from "@/components/expenses/expense_form";

export default async function EditExpensePage({
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
