// src/modules/dhuku/api/dhuku.actions.ts
"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { dhukuEntries, dhukus } from "@/db/schema";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { type DhukuEntryInput, dhukuEntrySchema, type DhukuInput, dhukuSchema } from "@/modules/dhuku/schemas/dhuku.schema";
import { insertNotification } from "@/modules/notifications/api/notifications.actions";

function revalidateDhukuPaths() {
  revalidatePath("/dhuku");
  revalidatePath("/dashboard");
}

async function assertMemberInHousehold(householdId: string, memberId: string) {
  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }
}

export async function listDhukus(householdId: string) {
  return db.select().from(dhukus).where(eq(dhukus.householdId, householdId)).orderBy(desc(dhukus.startDate));
}

export async function listDhukuEntries(householdId: string) {
  const rows = await listDhukus(householdId);
  const dhukuIds = rows.map((d) => d.id);
  if (dhukuIds.length === 0) return [];

  return db
    .select()
    .from(dhukuEntries)
    .where(inArray(dhukuEntries.dhukuId, dhukuIds))
    .orderBy(desc(dhukuEntries.date), desc(dhukuEntries.createdAt));
}

export async function createDhukuAction(input: DhukuInput) {
  const { householdId } = await getCurrentMember();
  const parsed = dhukuSchema.parse(input);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db.insert(dhukus).values({
    householdId,
    interestPerMonth: parsed.interestPerMonth === null ? null : String(parsed.interestPerMonth),
    monthlyContribution: String(parsed.monthlyContribution),
    name: parsed.name,
    note: parsed.note?.trim() || null,
    ownerMemberId: parsed.ownerMemberId,
    startDate: parsed.startDate,
    totalMembers: parsed.totalMembers,
  });

  revalidateDhukuPaths();
}

export async function updateDhukuAction(id: string, input: DhukuInput) {
  const { householdId } = await getCurrentMember();
  const parsed = dhukuSchema.parse(input);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db
    .update(dhukus)
    .set({
      interestPerMonth: parsed.interestPerMonth === null ? null : String(parsed.interestPerMonth),
      monthlyContribution: String(parsed.monthlyContribution),
      name: parsed.name,
      note: parsed.note?.trim() || null,
      ownerMemberId: parsed.ownerMemberId,
      startDate: parsed.startDate,
      totalMembers: parsed.totalMembers,
    })
    .where(and(eq(dhukus.id, id), eq(dhukus.householdId, householdId)));

  revalidateDhukuPaths();
}

export async function deleteDhukuAction(id: string) {
  const { householdId } = await getCurrentMember();
  await db.delete(dhukus).where(and(eq(dhukus.id, id), eq(dhukus.householdId, householdId)));

  revalidateDhukuPaths();
}

async function getDhukuInHousehold(householdId: string, dhukuId: string) {
  const [dhuku] = await db.select().from(dhukus).where(and(eq(dhukus.id, dhukuId), eq(dhukus.householdId, householdId)));
  if (!dhuku) {
    throw new Error("Dhuku does not belong to this household");
  }
  return dhuku;
}

export async function addDhukuEntryAction(dhukuId: string, input: DhukuEntryInput) {
  const { householdId, name: actorName } = await getCurrentMember();
  const parsed = dhukuEntrySchema.parse(input);
  const dhuku = await getDhukuInHousehold(householdId, dhukuId);

  const [created] = await db
    .insert(dhukuEntries)
    .values({
      amount: String(parsed.amount),
      date: parsed.date,
      dhukuId,
      note: parsed.note?.trim() || null,
      type: parsed.type,
    })
    .returning();

  const body =
    parsed.type === "payout"
      ? `${actorName} recorded receiving ${formatNPR(parsed.amount)} from ${dhuku.name}.`
      : `${actorName} recorded a ${formatNPR(parsed.amount)} contribution to ${dhuku.name}.`;
  await insertNotification({
    body,
    category: "shared",
    dedupeKey: `dhuku-entry:${created.id}`,
    householdId,
    severity: "success",
    title: parsed.type === "payout" ? "Dhuku payout recorded" : "Dhuku contribution recorded",
  });

  revalidateDhukuPaths();
}

export async function deleteDhukuEntryAction(id: string) {
  const { householdId } = await getCurrentMember();
  const [entry] = await db.select().from(dhukuEntries).where(eq(dhukuEntries.id, id));
  if (!entry) return;
  await getDhukuInHousehold(householdId, entry.dhukuId);

  await db.delete(dhukuEntries).where(eq(dhukuEntries.id, id));

  revalidateDhukuPaths();
}
