"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { getCurrentMember } from "@/lib/session";

import { type CategoryInput, categorySchema } from "../schemas/category.schema";

function revalidateCategoryPaths() {
  revalidatePath("/categories");
  revalidatePath("/budget");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function createCategoryAction(input: CategoryInput) {
  const { householdId } = await getCurrentMember();
  const parsed = categorySchema.parse(input);

  const [category] = await db
    .insert(categories)
    .values({
      budgetType: parsed.budgetType,
      groupName: parsed.groupName,
      householdId,
      name: parsed.name,
    })
    .returning({
      archived: categories.archived,
      budgetType: categories.budgetType,
      groupName: categories.groupName,
      id: categories.id,
      name: categories.name,
    });

  revalidateCategoryPaths();

  return category;
}

export async function updateCategoryAction(id: string, input: CategoryInput) {
  const { householdId } = await getCurrentMember();
  const parsed = categorySchema.parse(input);

  await db
    .update(categories)
    .set({ budgetType: parsed.budgetType, groupName: parsed.groupName, name: parsed.name })
    .where(and(eq(categories.id, id), eq(categories.householdId, householdId)));

  revalidateCategoryPaths();
}

// Categories are archived, never hard-deleted — expenses and budget_items
// both reference categoryId with onDelete: "cascade", so an actual DELETE
// here would silently wipe out every expense/budget row ever logged
// against that category. archived=true keeps history intact while
// removing the category from listCategories' default (active-only) view.
export async function archiveCategoryAction(id: string) {
  const { householdId } = await getCurrentMember();

  await db
    .update(categories)
    .set({ archived: true })
    .where(and(eq(categories.id, id), eq(categories.householdId, householdId)));

  revalidateCategoryPaths();
}

export async function restoreCategoryAction(id: string) {
  const { householdId } = await getCurrentMember();

  await db
    .update(categories)
    .set({ archived: false })
    .where(and(eq(categories.id, id), eq(categories.householdId, householdId)));

  revalidateCategoryPaths();
}
