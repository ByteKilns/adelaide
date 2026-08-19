import type { Tone } from "@/components/ToneIcon";
import { type MemberRole, memberTone, roleForOwner } from "@/modules/expenses/lib/member-tone";

export type BudgetRow = {
  actual: number;
  budgetType: "fixed" | "flexible";
  categoryId: string;
  categoryName: string;
  planned: number;
};

export type BudgetGroup = {
  key: MemberRole;
  label: string;
  rows: BudgetRow[];
  tone: Tone;
  totalActual: number;
  totalPlanned: number;
};

export function budgetGroups(
  items: { actual: number; categoryId: string; ownerMemberId: string | null; planned: number }[],
  categories: { budgetType: "fixed" | "flexible"; id: string; name: string }[],
  members: { id: string; name: string }[],
  realMemberId: string,
): BudgetGroup[] {
  const partner = members.find((m) => m.id !== realMemberId) ?? null;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const buckets: Record<MemberRole, BudgetRow[]> = { me: [], partner: [], shared: [] };

  for (const item of items) {
    const category = categoryById.get(item.categoryId);
    if (!category) continue;
    const role = roleForOwner(item.ownerMemberId, realMemberId);
    buckets[role].push({
      actual: item.actual,
      budgetType: category.budgetType,
      categoryId: item.categoryId,
      categoryName: category.name,
      planned: item.planned,
    });
  }

  const base: { key: MemberRole; label: string; rows: BudgetRow[] }[] = [
    { key: "me", label: "My Budget", rows: buckets.me },
    ...(partner ? [{ key: "partner" as const, label: "Partner Budget", rows: buckets.partner }] : []),
    { key: "shared", label: "Shared Budget", rows: buckets.shared },
  ];

  return base.map((g) => ({
    ...g,
    tone: memberTone(g.key),
    totalActual: g.rows.reduce((s, r) => s + r.actual, 0),
    totalPlanned: g.rows.reduce((s, r) => s + r.planned, 0),
  }));
}

export type TopBudgetCategory = { actual: number; categoryId: string; name: string; pct: number; planned: number };

export function topBudgetCategories(groups: BudgetGroup[], limit: number): TopBudgetCategory[] {
  return groups
    .flatMap((g) => g.rows)
    .filter((r) => r.planned > 0)
    .sort((a, b) => b.planned - a.planned)
    .slice(0, limit)
    .map((r) => ({
      actual: r.actual,
      categoryId: r.categoryId,
      name: r.categoryName,
      pct: Math.round((r.actual / r.planned) * 100),
      planned: r.planned,
    }));
}
