// Resolves the "Me" / partner-name / "Shared" display label for an
// ownerMemberId. Currently used only by the Recent Expenses panel — kept as
// its own module since the Budget/Expenses pages will likely want the same
// classification. Note: the Overview tabs' per-owner expense filtering
// intentionally does NOT use this — it matches on ownerMemberId directly,
// since matching on the derived label string would misclassify expenses if
// a member's real name ever collided with "Me"/"Shared" or with another
// member's name.
export function classifyOwnerLabel(
  ownerMemberId: string | null,
  memberId: string,
  members: { id: string; user: { name: string } }[],
): string {
  if (ownerMemberId === null) return "Shared";
  if (ownerMemberId === memberId) return "Me";
  return members.find((m) => m.id === ownerMemberId)?.user.name ?? "Partner";
}
