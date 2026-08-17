import { auth } from "@/auth";
import { db } from "@/db/client";
import { householdMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CurrentMember = {
  memberId: string;
  householdId: string;
  userId: string;
  name: string;
};

export async function getCurrentMember(): Promise<CurrentMember> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const [member] = await db.query.householdMembers.findMany({
    where: eq(householdMembers.userId, session.user.id),
    with: { household: true, user: true },
    limit: 1,
  });

  if (!member) {
    throw new Error("User does not belong to a household");
  }

  return {
    memberId: member.id,
    householdId: member.householdId,
    userId: member.userId,
    name: member.user.name,
  };
}

export async function getHouseholdMembers(householdId: string) {
  return db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, householdId),
    with: { user: true },
  });
}
