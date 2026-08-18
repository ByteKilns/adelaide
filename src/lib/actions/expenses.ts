"use server";

import { z } from "zod";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/lib/data/categories";
import { revalidatePath } from "next/cache";

const expenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  ownerMemberId: z.string().uuid().nullable(),
  paidByMemberId: z.string().uuid(),
  date: z.string(), // "YYYY-MM-DD"
  note: z.string().optional(),
});

async function assertMemberInHousehold(householdId: string, memberId: string) {
  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }
}

async function assertCategoryInHousehold(householdId: string, categoryId: string) {
  const categories = await listCategories(householdId);
  if (!categories.some((c) => c.id === categoryId)) {
    throw new Error("Category does not belong to this household");
  }
}

export async function createExpenseAction(input: z.infer<typeof expenseSchema>) {
  const { householdId } = await getCurrentMember();
  const parsed = expenseSchema.parse(input);
  await assertCategoryInHousehold(householdId, parsed.categoryId);
  await assertMemberInHousehold(householdId, parsed.paidByMemberId);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db.insert(expenses).values({
    householdId,
    amount: String(parsed.amount),
    categoryId: parsed.categoryId,
    ownerMemberId: parsed.ownerMemberId,
    paidByMemberId: parsed.paidByMemberId,
    date: parsed.date,
    note: parsed.note,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateExpenseAction(id: string, input: z.infer<typeof expenseSchema>) {
  const { householdId } = await getCurrentMember();
  const parsed = expenseSchema.parse(input);
  await assertCategoryInHousehold(householdId, parsed.categoryId);
  await assertMemberInHousehold(householdId, parsed.paidByMemberId);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db
    .update(expenses)
    .set({
      amount: String(parsed.amount),
      categoryId: parsed.categoryId,
      ownerMemberId: parsed.ownerMemberId,
      paidByMemberId: parsed.paidByMemberId,
      date: parsed.date,
      note: parsed.note ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpenseAction(id: string) {
  const { householdId } = await getCurrentMember();
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function listExpensesForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  return db
    .select()
    .from(expenses)
    .where(
      and(eq(expenses.householdId, householdId), gte(expenses.date, start), lte(expenses.date, end)),
    )
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}
