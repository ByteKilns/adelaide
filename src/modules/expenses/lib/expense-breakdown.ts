import type { Tone } from "@/components/ToneIcon";

export type OwnerSlice = { amount: number; key: "me" | "partner" | "shared"; label: string; tone: Tone };

export function ownerBreakdown(
  expenses: { amount: number; ownerMemberId: string | null }[],
  members: { id: string; name: string }[],
  realMemberId: string,
): OwnerSlice[] {
  const partner = members.find((m) => m.id !== realMemberId) ?? null;

  const sum = (predicate: (e: { amount: number; ownerMemberId: string | null }) => boolean) =>
    expenses.filter(predicate).reduce((s, e) => s + e.amount, 0);

  const slices: OwnerSlice[] = [
    { amount: sum((e) => e.ownerMemberId === null), key: "shared", label: "Shared", tone: "blue" },
    { amount: sum((e) => e.ownerMemberId === realMemberId), key: "me", label: "Me", tone: "green" },
  ];

  if (partner) {
    slices.push({
      amount: sum((e) => e.ownerMemberId === partner.id),
      key: "partner",
      label: partner.name,
      tone: "orange",
    });
  }

  return slices;
}
