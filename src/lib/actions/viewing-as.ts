"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { VIEWING_AS_COOKIE_NAME } from "@/lib/viewing-as-cookie";

export async function setViewingAsAction(memberId: string) {
  const { householdId, memberId: realMemberId } = await getCurrentMember();
  const cookieStore = await cookies();

  if (memberId === realMemberId) {
    cookieStore.delete(VIEWING_AS_COOKIE_NAME);
    revalidatePath("/", "layout");
    return;
  }

  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }

  cookieStore.set(VIEWING_AS_COOKIE_NAME, memberId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
}
