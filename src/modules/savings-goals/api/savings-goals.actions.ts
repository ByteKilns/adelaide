"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { savingsContributions, savingsGoals } from "@/db/schema";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { insertNotification } from "@/modules/notifications/api/notifications.actions";
import { type ContributionInput, contributionSchema, type SavingsGoalInput, savingsGoalSchema } from "@/modules/savings-goals/schemas/savings-goal.schema";

function revalidateSavingsGoalsPaths() {
  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
}

async function assertMemberInHousehold(householdId: string, memberId: string) {
  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }
}

export async function listSavingsGoals(householdId: string) {
  return db.select().from(savingsGoals).where(eq(savingsGoals.householdId, householdId)).orderBy(savingsGoals.createdAt);
}

export async function listSavingsContributions(householdId: string) {
  const goals = await listSavingsGoals(householdId);
  const goalIds = goals.map((g) => g.id);
  if (goalIds.length === 0) return [];

  return db
    .select()
    .from(savingsContributions)
    .where(inArray(savingsContributions.goalId, goalIds))
    .orderBy(desc(savingsContributions.date), desc(savingsContributions.createdAt));
}

export async function createSavingsGoalAction(input: SavingsGoalInput) {
  const { householdId } = await getCurrentMember();
  const parsed = savingsGoalSchema.parse(input);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db.insert(savingsGoals).values({
    description: parsed.description?.trim() || null,
    householdId,
    image: parsed.image,
    name: parsed.name,
    ownerMemberId: parsed.ownerMemberId,
    targetAmount: parsed.targetAmount === null ? null : String(parsed.targetAmount),
    targetDate: parsed.targetDate,
  });

  revalidateSavingsGoalsPaths();
}

export async function updateSavingsGoalAction(id: string, input: SavingsGoalInput) {
  const { householdId } = await getCurrentMember();
  const parsed = savingsGoalSchema.parse(input);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db
    .update(savingsGoals)
    .set({
      description: parsed.description?.trim() || null,
      image: parsed.image,
      name: parsed.name,
      ownerMemberId: parsed.ownerMemberId,
      targetAmount: parsed.targetAmount === null ? null : String(parsed.targetAmount),
      targetDate: parsed.targetDate,
    })
    .where(and(eq(savingsGoals.id, id), eq(savingsGoals.householdId, householdId)));

  revalidateSavingsGoalsPaths();
}

export async function deleteSavingsGoalAction(id: string) {
  const { householdId } = await getCurrentMember();
  await db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.householdId, householdId)));

  revalidateSavingsGoalsPaths();
}

async function getGoalInHousehold(householdId: string, goalId: string) {
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.householdId, householdId)));
  if (!goal) {
    throw new Error("Goal does not belong to this household");
  }
  return goal;
}

export async function addContributionAction(goalId: string, input: ContributionInput) {
  const { householdId, name: actorName } = await getCurrentMember();
  const parsed = contributionSchema.parse(input);
  const goal = await getGoalInHousehold(householdId, goalId);
  await assertMemberInHousehold(householdId, parsed.memberId);

  const [created] = await db
    .insert(savingsContributions)
    .values({
      amount: String(parsed.amount),
      date: parsed.date,
      goalId,
      memberId: parsed.memberId,
    })
    .returning();

  await insertNotification({
    body: `${actorName} added ${formatNPR(parsed.amount)} to ${goal.name}.`,
    category: "goal",
    dedupeKey: `contribution:${created.id}`,
    householdId,
    severity: "success",
    title: "New contribution added",
  });

  revalidateSavingsGoalsPaths();
}
