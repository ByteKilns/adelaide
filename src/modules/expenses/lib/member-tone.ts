import type { Tone } from "@/modules/dashboard/components/ToneIcon";

export type MemberRole = "me" | "partner" | "shared";

export function memberTone(role: MemberRole): Tone {
  if (role === "me") return "green";
  if (role === "partner") return "orange";
  return "blue";
}

export function roleForOwner(ownerMemberId: string | null, realMemberId: string): MemberRole {
  if (ownerMemberId === null) return "shared";
  if (ownerMemberId === realMemberId) return "me";
  return "partner";
}
