"use server";

import { z } from "zod";
import { db } from "@/db/client";
import { monthlyBudgets, budgetItems } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentMember } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function getOrCreateMonthlyBudget(householdId: string, year: number, month: number) {
  const [existing] = await db
    .select()
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.householdId, householdId),
        eq(monthlyBudgets.year, year),
        eq(monthlyBudgets.month, month),
      ),
    );
  if (existing) return existing;

  const [created] = await db
    .insert(monthlyBudgets)
    .values({ householdId, year, month })
    .returning();
  return created;
}

export async function getBudgetItemsForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  const budget = await getOrCreateMonthlyBudget(householdId, year, month);
  return db.select().from(budgetItems).where(eq(budgetItems.monthlyBudgetId, budget.id));
}

const setBudgetItemSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  categoryId: z.string().uuid(),
  ownerMemberId: z.string().uuid().nullable(),
  plannedAmount: z.number().nonnegative(),
});

export async function setBudgetItemAction(input: z.infer<typeof setBudgetItemSchema>) {
  const { householdId } = await getCurrentMember();
  const parsed = setBudgetItemSchema.parse(input);
  const budget = await getOrCreateMonthlyBudget(householdId, parsed.year, parsed.month);

  if (parsed.ownerMemberId === null) {
    // The unique constraint on budget_items is a plain multi-column UNIQUE
    // (monthly_budget_id, category_id, owner_member_id), not a partial unique
    // index. Postgres never treats two NULLs as equal for uniqueness purposes,
    // so `ON CONFLICT (monthly_budget_id, category_id, owner_member_id)` never
    // fires when owner_member_id is NULL — two "shared" inserts for the same
    // category/month would each succeed and create a duplicate row instead of
    // updating in place. Verified empirically against the live DB. So for the
    // shared (null-owner) case we must select-then-branch inside a transaction
    // instead of relying on onConflictDoUpdate.
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(budgetItems)
        .where(
          and(
            eq(budgetItems.monthlyBudgetId, budget.id),
            eq(budgetItems.categoryId, parsed.categoryId),
            isNull(budgetItems.ownerMemberId),
          ),
        )
        .for("update");

      if (existing) {
        await tx
          .update(budgetItems)
          .set({ plannedAmount: String(parsed.plannedAmount) })
          .where(eq(budgetItems.id, existing.id));
      } else {
        await tx.insert(budgetItems).values({
          monthlyBudgetId: budget.id,
          categoryId: parsed.categoryId,
          ownerMemberId: null,
          plannedAmount: String(parsed.plannedAmount),
        });
      }
    });
  } else {
    // For a non-null owner, the composite unique constraint does detect
    // conflicts correctly, so the atomic upsert is safe here.
    await db
      .insert(budgetItems)
      .values({
        monthlyBudgetId: budget.id,
        categoryId: parsed.categoryId,
        ownerMemberId: parsed.ownerMemberId,
        plannedAmount: String(parsed.plannedAmount),
      })
      .onConflictDoUpdate({
        target: [budgetItems.monthlyBudgetId, budgetItems.categoryId, budgetItems.ownerMemberId],
        set: { plannedAmount: String(parsed.plannedAmount) },
      });
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}
