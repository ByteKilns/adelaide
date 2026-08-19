// Single source of truth for the "Me" / partner-name / "Shared" three-way
// classification used both by the Recent Expenses owner label and by the
// Overview tabs' per-owner expense filtering.
export function classifyOwnerLabel(
  ownerMemberId: string | null,
  memberId: string,
  members: { id: string; user: { name: string } }[],
): string {
  if (ownerMemberId === null) return "Shared";
  if (ownerMemberId === memberId) return "Me";
  return members.find((m) => m.id === ownerMemberId)?.user.name ?? "Partner";
}
