import type { Tone } from "@/modules/dashboard/components/ToneIcon";

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

export type TopCategory = { amount: number; barPct: number; categoryId: string; name: string };

export function topCategories(
  expenses: { amount: number; categoryId: string }[],
  categories: { id: string; name: string }[],
  limit: number,
): TopCategory[] {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown";

  const sorted = [...totals.entries()]
    .map(([categoryId, amount]) => ({ amount, categoryId, name: categoryName(categoryId) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  const max = sorted[0]?.amount ?? 0;

  return sorted.map((c) => ({
    ...c,
    barPct: max > 0 ? Math.round((c.amount / max) * 100) : 0,
  }));
}
