import { getCurrentMember } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { CategoriesManager } from "@/modules/categories/components/CategoriesManager";

export async function CategoriesPage() {
  const { householdId } = await getCurrentMember();
  const categories = await listCategories(householdId, { includeArchived: true });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">Manage the categories used across expenses and budgets</p>
      </div>

      <CategoriesManager categories={categories} />
    </div>
  );
}
