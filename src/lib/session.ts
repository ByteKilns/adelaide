import { auth } from "@/auth";
import { db } from "@/db/client";
import { householdMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { VIEWING_AS_COOKIE_NAME } from "@/lib/viewing-as-cookie";

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

  const member = await db.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id),
    with: { household: true, user: true },
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

// Resolves the member whose *perspective* the UI should render from: the
// "viewing as" cookie if it's set to a valid member of the caller's own
// household, otherwise the real logged-in member. This is presentation-only
// — it never changes which household's data is fetched, and it must never
// be used in place of getCurrentMember() when deriving householdId for a
// write (server actions continue to call getCurrentMember() directly for
// that, so a forged/stale cookie can't affect data isolation).
export async function getEffectiveMember(): Promise<CurrentMember> {
  const current = await getCurrentMember();
  const cookieStore = await cookies();
  const viewingAsId = cookieStore.get(VIEWING_AS_COOKIE_NAME)?.value;

  if (!viewingAsId || viewingAsId === current.memberId) {
    return current;
  }

  const members = await getHouseholdMembers(current.householdId);
  const target = members.find((m) => m.id === viewingAsId);
  if (!target) {
    // Stale/forged cookie value (e.g. a removed member) — fall back to the
    // real session rather than throwing.
    return current;
  }

  return {
    memberId: target.id,
    householdId: current.householdId,
    userId: target.userId,
    name: target.user.name,
  };
}
