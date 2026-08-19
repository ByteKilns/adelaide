import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { ExpenseForm } from "@/modules/expenses/components/ExpenseForm";

export async function NewExpensePage() {
  const { householdId, memberId } = await getEffectiveMember();
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
