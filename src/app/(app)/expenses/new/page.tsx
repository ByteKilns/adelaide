import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { ExpenseForm } from "@/components/expenses/expense_form";

export default async function NewExpensePage() {
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
