import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function listCategories(householdId: string) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.householdId, householdId), eq(categories.archived, false)))
    .orderBy(categories.groupName, categories.name);
}
