import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { getIncomesForMonth, getBudgetItemsForMonth } from "@/modules/budget/api/actions";
import { IncomeForm } from "@/modules/budget/components/income_form";
import { BudgetItemRow } from "@/modules/budget/components/budget_item_row";

export async function BudgetPage() {
  const { householdId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, incomes, budgetItems] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Income</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <IncomeForm
              key={m.id}
              memberId={m.id}
              memberName={m.user.name}
              year={year}
              month={month}
              initialAmount={Number(
                incomes.find((i) => i.memberId === m.id)?.amount ?? 0,
              )}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Budget allocation</h2>
        <div className="divide-y">
          {categories.map((c) => {
            const existing = budgetItems.find((b) => b.categoryId === c.id);
            return (
              <BudgetItemRow
                key={c.id}
                categoryId={c.id}
                categoryName={c.name}
                year={year}
                month={month}
                members={members.map((m) => ({ id: m.id, name: m.user.name }))}
                initialOwnerMemberId={existing?.ownerMemberId ?? null}
                initialPlannedAmount={Number(existing?.plannedAmount ?? 0)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
