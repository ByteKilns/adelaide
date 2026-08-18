import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/lib/data/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  const { memberId, householdId } = await getCurrentMember();
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
