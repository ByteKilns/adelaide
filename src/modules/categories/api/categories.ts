import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { categories } from "@/db/schema";

export async function listCategories(householdId: string, options?: { includeArchived?: boolean }) {
  const conditions = [eq(categories.householdId, householdId)];
  if (!options?.includeArchived) {
    conditions.push(eq(categories.archived, false));
  }

  return db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(categories.groupName, categories.name);
}
