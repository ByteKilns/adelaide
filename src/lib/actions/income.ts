"use server";

import { z } from "zod";
import { db } from "@/db/client";
import { incomes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { revalidatePath } from "next/cache";

const setIncomeSchema = z.object({
  memberId: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative(),
  note: z.string().optional(),
});

export async function getIncomesForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  return db
    .select()
    .from(incomes)
    .where(and(eq(incomes.householdId, householdId), eq(incomes.year, year), eq(incomes.month, month)));
}

export async function setIncomeAction(input: z.infer<typeof setIncomeSchema>) {
  const { householdId } = await getCurrentMember();
  const parsed = setIncomeSchema.parse(input);

  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === parsed.memberId)) {
    throw new Error("Member does not belong to this household");
  }

  const existing = await db
    .select()
    .from(incomes)
    .where(
      and(
        eq(incomes.memberId, parsed.memberId),
        eq(incomes.year, parsed.year),
        eq(incomes.month, parsed.month),
      ),
    );

  if (existing.length > 0) {
    await db
      .update(incomes)
      .set({ amount: String(parsed.amount), note: parsed.note })
      .where(eq(incomes.id, existing[0].id));
  } else {
    await db.insert(incomes).values({
      householdId,
      memberId: parsed.memberId,
      year: parsed.year,
      month: parsed.month,
      amount: String(parsed.amount),
      note: parsed.note,
    });
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}
