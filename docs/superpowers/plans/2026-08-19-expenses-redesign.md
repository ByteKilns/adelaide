# Expenses page redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Expenses page to match the reference mockup (owner tabs, filter bar, data table with avatars, expense summary donut chart, top categories, safe-to-spend placeholder), per `docs/superpowers/specs/2026-08-19-expenses-redesign-design.md`.

**Architecture:** New presentational components under `modules/expenses/components/`, two new pure calculation functions under `modules/expenses/lib/`, and `modules/expenses/index.tsx` gets split into `modules/expenses/pages/*.tsx` (already-approved, previously-deferred work bundled in here since this redesign substantially grows `ExpensesPage` anyway). `recharts`, the shadcn `dropdown-menu`, and `avatar` primitives are already installed/added.

**Tech Stack:** Next.js 16 App Router (Server Components), TypeScript, Tailwind, recharts, Vitest.

**Note on behavior removed vs. mockup:** the current page has an in-content "+ Add Expense" button; the mockup has no such button in the page body (only the persistent one in the sidebar nav, which already exists and is untouched). This plan removes the in-page button to match the mockup — the sidebar's Add Expense button remains the only entry point, which is intentional, not an oversight.

---

### Task 1: Owner-tone foundations and pure calculations

**Files:**
- Modify: `src/modules/dashboard/components/ToneIcon.tsx` (export `TONE_BADGE_CLASSES`)
- Create: `src/modules/expenses/lib/member-tone.ts`
- Create: `src/modules/expenses/lib/expense-breakdown.ts`
- Test: `src/modules/expenses/lib/expense-breakdown.test.ts`
- Create: `src/modules/expenses/components/OwnerAvatar.tsx`

- [ ] **Step 1: Export `TONE_BADGE_CLASSES` from ToneIcon**

In `src/modules/dashboard/components/ToneIcon.tsx`, change:
```ts
const TONE_BADGE_CLASSES: Record<Tone, string> = {
```
to:
```ts
export const TONE_BADGE_CLASSES: Record<Tone, string> = {
```
(Only that one keyword changes — everything else in the file stays the same.)

- [ ] **Step 2: Create the member-role helper**

Create `src/modules/expenses/lib/member-tone.ts`:

```ts
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
```

- [ ] **Step 3: Write the failing tests for the pure calculation functions**

Create `src/modules/expenses/lib/expense-breakdown.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { ownerBreakdown, topCategories } from "./expense-breakdown";

describe("ownerBreakdown", () => {
  it("splits expenses into shared, me, and partner totals", () => {
    const expenses = [
      { amount: 100, ownerMemberId: null },
      { amount: 50, ownerMemberId: "alice" },
      { amount: 25, ownerMemberId: "alice" },
      { amount: 200, ownerMemberId: "bob" },
    ];
    const members = [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ];

    const result = ownerBreakdown(expenses, members, "alice");

    expect(result).toEqual([
      { amount: 100, key: "shared", label: "Shared", tone: "blue" },
      { amount: 75, key: "me", label: "Me", tone: "green" },
      { amount: 200, key: "partner", label: "Bob", tone: "orange" },
    ]);
  });

  it("omits the partner slice when the household has only one member", () => {
    const expenses = [{ amount: 40, ownerMemberId: "alice" }];
    const members = [{ id: "alice", name: "Alice" }];

    const result = ownerBreakdown(expenses, members, "alice");

    expect(result).toEqual([
      { amount: 0, key: "shared", label: "Shared", tone: "blue" },
      { amount: 40, key: "me", label: "Me", tone: "green" },
    ]);
  });

  it("returns all-zero amounts for an empty expense list", () => {
    const members = [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ];

    const result = ownerBreakdown([], members, "alice");

    expect(result).toEqual([
      { amount: 0, key: "shared", label: "Shared", tone: "blue" },
      { amount: 0, key: "me", label: "Me", tone: "green" },
      { amount: 0, key: "partner", label: "Bob", tone: "orange" },
    ]);
  });
});

describe("topCategories", () => {
  it("sorts categories by spend descending and caps at the limit", () => {
    const expenses = [
      { amount: 100, categoryId: "groceries" },
      { amount: 50, categoryId: "groceries" },
      { amount: 300, categoryId: "rent" },
      { amount: 20, categoryId: "fun" },
    ];
    const categories = [
      { id: "groceries", name: "Groceries" },
      { id: "rent", name: "Rent" },
      { id: "fun", name: "Fun" },
    ];

    const result = topCategories(expenses, categories, 2);

    expect(result).toEqual([
      { amount: 300, barPct: 100, categoryId: "rent", name: "Rent" },
      { amount: 150, barPct: 50, categoryId: "groceries", name: "Groceries" },
    ]);
  });

  it("returns an empty array for no expenses", () => {
    expect(topCategories([], [], 5)).toEqual([]);
  });

  it("falls back to \"Unknown\" for a categoryId with no matching category", () => {
    const expenses = [{ amount: 10, categoryId: "ghost" }];

    const result = topCategories(expenses, [], 5);

    expect(result).toEqual([{ amount: 10, barPct: 100, categoryId: "ghost", name: "Unknown" }]);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test -- expense-breakdown`
Expected: FAIL — `Cannot find module './expense-breakdown'` (the file doesn't exist yet).

- [ ] **Step 5: Implement the calculation functions**

Create `src/modules/expenses/lib/expense-breakdown.ts`:

```ts
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
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- expense-breakdown`
Expected: PASS — 6 tests.

- [ ] **Step 7: Create the owner avatar component**

Create `src/modules/expenses/components/OwnerAvatar.tsx`:

```tsx
import { Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TONE_BADGE_CLASSES } from "@/modules/dashboard/components/ToneIcon";
import { memberTone, type MemberRole } from "@/modules/expenses/lib/member-tone";

type Props = { name: string; role: MemberRole };

export function OwnerAvatar({ name, role }: Props) {
  return (
    <Avatar size="sm">
      <AvatarFallback className={role === "shared" ? "bg-muted text-muted-foreground" : TONE_BADGE_CLASSES[memberTone(role)]}>
        {role === "shared" ? <Users className="size-3.5" /> : name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
```

- [ ] **Step 8: Verify**

```bash
npx tsc --noEmit
npm test
```
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add src/modules/dashboard/components/ToneIcon.tsx src/modules/expenses/lib src/modules/expenses/components/OwnerAvatar.tsx
git commit -m "feat: add owner-tone helpers and expense breakdown calculations"
```

---

### Task 2: Header and filter bar (presentational placeholders)

**Files:**
- Create: `src/modules/expenses/components/ExpenseHeader.tsx`
- Create: `src/modules/expenses/components/ExpenseFilters.tsx`

- [ ] **Step 1: Create the page header**

Create `src/modules/expenses/components/ExpenseHeader.tsx`:

```tsx
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Props = { monthLabel: string };

export function ExpenseHeader({ monthLabel }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <p className="text-sm text-muted-foreground">Track where your money goes</p>
      </div>
      {/* Month navigation is a visual placeholder for now — switching
          months isn't wired up yet, matching the same pattern used on the
          dashboard header. */}
      <div
        aria-disabled="true"
        className="flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-foreground"
      >
        <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
          <ChevronLeft className="h-4 w-4" />
        </span>
        <span className="flex items-center gap-1 px-2 text-sm font-medium">
          {monthLabel}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <span className="cursor-not-allowed rounded-full p-1 text-muted-foreground/50">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the filter bar**

Create `src/modules/expenses/components/ExpenseFilters.tsx`:

```tsx
import { ChevronDown, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Search, date range, and the three dropdown filters are visual
// placeholders — filtering logic isn't wired up yet. Kept disabled rather
// than silently doing nothing on interaction.
export function ExpenseFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" disabled placeholder="Search expenses..." />
      </div>
      {["Date range", "Category", "Owner", "Paid by"].map((label) => (
        <Button className="text-muted-foreground" disabled key={label} type="button" variant="outline">
          {label}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      ))}
      <Button className="text-muted-foreground" disabled type="button" variant="ghost">
        Clear filters
      </Button>
      <Button className="ml-auto text-muted-foreground" disabled type="button" variant="outline">
        <Upload className="h-4 w-4" />
        Export
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
Expected: clean. (These two components aren't wired into a page yet, so nothing renders them — that happens in Task 5.)

- [ ] **Step 4: Commit**

```bash
git add src/modules/expenses/components/ExpenseHeader.tsx src/modules/expenses/components/ExpenseFilters.tsx
git commit -m "feat: add expenses page header and filter bar"
```

---

### Task 3: Expense table

**Files:**
- Create: `src/modules/expenses/components/ExpenseTable.tsx`
- Delete: `src/modules/expenses/components/ExpenseListItem.tsx`

- [ ] **Step 1: Confirm ExpenseListItem has no other consumers before deleting it**

```bash
grep -rn "ExpenseListItem" src
```
Expected: only `src/modules/expenses/components/ExpenseListItem.tsx` itself and `src/modules/expenses/index.tsx` (its current sole consumer, which Task 5 rewrites). If anything else references it, stop and report — do not delete.

- [ ] **Step 2: Create the table component**

Create `src/modules/expenses/components/ExpenseTable.tsx`:

```tsx
"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteExpenseAction } from "@/modules/expenses/api/expenses.actions";
import { OwnerAvatar } from "@/modules/expenses/components/OwnerAvatar";
import { formatNPR } from "@/modules/dashboard/lib/format";
import { roleForOwner, type MemberRole } from "@/modules/expenses/lib/member-tone";

export type ExpenseRow = {
  amount: number;
  categoryGroupName: string;
  categoryName: string;
  date: string;
  id: string;
  note: string | null;
  ownerMemberId: string | null;
  ownerName: string | null;
  paidByMemberId: string;
  paidByName: string;
};

type Props = {
  partnerName: string | null;
  realMemberId: string;
  rows: ExpenseRow[];
};

type Tab = "all" | "me" | "partner" | "shared";

function displayLabel(role: MemberRole, name: string | null): string {
  if (role === "shared") return "Shared";
  if (role === "me") return "Me";
  return name ?? "Partner";
}

const TAB_TRIGGER_CLASS =
  "rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export function ExpenseTable({ partnerName, realMemberId, rows }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [pendingId, setPendingId] = useState<null | string>(null);
  const [, startTransition] = useTransition();

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "me") return r.ownerMemberId === realMemberId;
    if (tab === "shared") return r.ownerMemberId === null;
    return r.ownerMemberId !== null && r.ownerMemberId !== realMemberId;
  });

  function handleDelete(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteExpenseAction(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Tabs onValueChange={(v) => setTab(v as Tab)} value={tab}>
        <TabsList className="w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
          <TabsTrigger className={TAB_TRIGGER_CLASS} value="all">
            All
          </TabsTrigger>
          <TabsTrigger className={TAB_TRIGGER_CLASS} value="me">
            Me
          </TabsTrigger>
          {partnerName && (
            <TabsTrigger className={TAB_TRIGGER_CLASS} value="partner">
              {partnerName}
            </TabsTrigger>
          )}
          <TabsTrigger className={TAB_TRIGGER_CLASS} value="shared">
            Shared
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-normal">Date</th>
              <th className="p-3 font-normal">Category</th>
              <th className="p-3 font-normal">Owner</th>
              <th className="p-3 font-normal">Paid by</th>
              <th className="p-3 text-right font-normal">Amount</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No expenses in this view.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const ownerRole = roleForOwner(r.ownerMemberId, realMemberId);
              const paidByRole: MemberRole = r.paidByMemberId === realMemberId ? "me" : "partner";
              return (
                <tr className="border-b last:border-0" key={r.id}>
                  <td className="p-3 whitespace-nowrap">{r.date}</td>
                  <td className="p-3">
                    <p className="font-medium">{r.categoryName}</p>
                    {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={r.ownerName ?? ""} role={ownerRole} />
                      <span>{displayLabel(ownerRole, r.ownerName)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={r.paidByName} role={paidByRole} />
                      <span>{paidByRole === "me" ? "Me" : r.paidByName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold">-{formatNPR(r.amount)}</td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 text-muted-foreground hover:bg-accent" type="button">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/expenses/${r.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={pendingId === r.id}
                          onClick={() => handleDelete(r.id)}
                          variant="destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing all {filtered.length} expense{filtered.length === 1 ? "" : "s"} this month.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Delete the superseded row component**

```bash
git rm src/modules/expenses/components/ExpenseListItem.tsx
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```
Expected: a real error, `Cannot find module '@/modules/expenses/components/ExpenseListItem'`, from `src/modules/expenses/index.tsx` — that's expected and gets fixed in Task 5. Confirm no *other* file errors.

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/components/ExpenseTable.tsx src/modules/expenses/components/ExpenseListItem.tsx
git commit -m "feat: replace expense list rows with a table + owner tabs"
```

---

### Task 4: Expense summary and top categories cards

**Files:**
- Create: `src/modules/expenses/components/ExpenseSummaryCard.tsx`
- Create: `src/modules/expenses/components/TopCategoriesCard.tsx`

- [ ] **Step 1: Create the expense summary donut card**

Create `src/modules/expenses/components/ExpenseSummaryCard.tsx`:

```tsx
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { OwnerSlice } from "@/modules/expenses/lib/expense-breakdown";

const TONE_HEX: Record<OwnerSlice["tone"], string> = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
};

type Props = {
  pctOfIncome: null | number;
  slices: OwnerSlice[];
  total: number;
};

export function ExpenseSummaryCard({ pctOfIncome, slices, total }: Props) {
  const chartData = slices.filter((s) => s.amount > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Total Expenses</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold">{formatNPR(total)}</p>
          {pctOfIncome !== null && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              {pctOfIncome}% of income
            </span>
          )}
        </div>

        {chartData.length > 0 && (
          <div className="mx-auto mt-4 h-40 w-40">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  innerRadius="65%"
                  nameKey="label"
                  outerRadius="100%"
                  paddingAngle={2}
                >
                  {chartData.map((s) => (
                    <Cell fill={TONE_HEX[s.tone]} key={s.key} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <ul className="mt-4 space-y-2 text-sm">
          {slices.map((s) => (
            <li className="flex items-center justify-between" key={s.key}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX[s.tone] }} />
                {s.label}
              </span>
              <span className="text-muted-foreground">{formatNPR(s.amount)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the top categories card**

Create `src/modules/expenses/components/TopCategoriesCard.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";
import { TONE_BAR_CLASSES, ToneIcon } from "@/modules/dashboard/components/ToneIcon";
import { formatNPR } from "@/modules/dashboard/lib/format";
import type { TopCategory } from "@/modules/expenses/lib/expense-breakdown";

type Props = {
  categories: (TopCategory & { groupName: string })[];
};

export function TopCategoriesCard({ categories }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Top Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses this month yet.</p>
        )}
        {categories.map((c) => {
          const tone = getCategoryTone(c.groupName);
          return (
            <div className="space-y-1.5" key={c.categoryId}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <ToneIcon className="h-6 w-6" icon={getCategoryIcon(c.groupName)} tone={tone} />
                  {c.name}
                </span>
                <span className="text-sm text-muted-foreground">{formatNPR(c.amount)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${TONE_BAR_CLASSES[tone]}`} style={{ width: `${c.barPct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
Expected: the same single pre-existing `ExpenseListItem` error from Task 3 (still unfixed until Task 5), nothing new.

- [ ] **Step 4: Commit**

```bash
git add src/modules/expenses/components/ExpenseSummaryCard.tsx src/modules/expenses/components/TopCategoriesCard.tsx
git commit -m "feat: add expense summary donut chart and top categories cards"
```

---

### Task 5: Split index.tsx into pages/ and wire the new ExpensesPage together

**Files:**
- Create: `src/modules/expenses/pages/ExpensesPage.tsx`
- Create: `src/modules/expenses/pages/NewExpensePage.tsx`
- Create: `src/modules/expenses/pages/EditExpensePage.tsx`
- Modify: `src/modules/expenses/index.tsx` (becomes a barrel re-export)

- [ ] **Step 1: Create the three page files**

Create `src/modules/expenses/pages/NewExpensePage.tsx`:

```tsx
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { ExpenseForm } from "@/modules/expenses/components/ExpenseForm";

export async function NewExpensePage() {
  const { householdId, memberId } = await getEffectiveMember();
  const [members, categories] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
  ]);

  return (
    <ExpenseForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      currentMemberId={memberId}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
    />
  );
}
```

Create `src/modules/expenses/pages/EditExpensePage.tsx`:

```tsx
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { ExpenseForm } from "@/modules/expenses/components/ExpenseForm";

export async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { householdId, memberId } = await getEffectiveMember();
  const [members, categories] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
  ]);

  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  if (!expense) notFound();

  return (
    <ExpenseForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      currentMemberId={memberId}
      expenseId={expense.id}
      initial={{
        amount: Number(expense.amount),
        categoryId: expense.categoryId,
        date: expense.date,
        note: expense.note,
        ownerMemberId: expense.ownerMemberId,
        paidByMemberId: expense.paidByMemberId,
      }}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
    />
  );
}
```

Create `src/modules/expenses/pages/ExpensesPage.tsx`:

```tsx
import { PiggyBank } from "lucide-react";

import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { getIncomesForMonth } from "@/modules/budget/api/budget.actions";
import { listCategories } from "@/modules/categories/api/categories";
import { ComingSoonCard } from "@/modules/dashboard/components/ComingSoonCard";
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";
import { listExpensesForMonth } from "@/modules/expenses/api/expenses.actions";
import { ExpenseFilters } from "@/modules/expenses/components/ExpenseFilters";
import { ExpenseHeader } from "@/modules/expenses/components/ExpenseHeader";
import { ExpenseSummaryCard } from "@/modules/expenses/components/ExpenseSummaryCard";
import { ExpenseTable } from "@/modules/expenses/components/ExpenseTable";
import { TopCategoriesCard } from "@/modules/expenses/components/TopCategoriesCard";
import { ownerBreakdown, topCategories } from "@/modules/expenses/lib/expense-breakdown";

export async function ExpensesPage() {
  const { householdId, memberId } = await getEffectiveMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, expenseRows, incomeRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listExpensesForMonth(year, month),
    getIncomesForMonth(year, month),
  ]);

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";
  const memberName = (id: string) => members.find((m) => m.id === id)?.user.name ?? "Unknown";
  const partner = members.find((m) => m.id !== memberId) ?? null;

  const expenses = expenseRows.map((e) => ({
    amount: Number(e.amount),
    categoryId: e.categoryId,
    ownerMemberId: e.ownerMemberId,
  }));

  const combinedIncome = incomeRows.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const rows = expenseRows.map((e) => ({
    amount: Number(e.amount),
    categoryGroupName: category(e.categoryId)?.groupName ?? "",
    categoryName: categoryName(e.categoryId),
    date: e.date,
    id: e.id,
    note: e.note,
    ownerMemberId: e.ownerMemberId,
    ownerName: e.ownerMemberId ? memberName(e.ownerMemberId) : null,
    paidByMemberId: e.paidByMemberId,
    paidByName: memberName(e.paidByMemberId),
  }));

  const slices = ownerBreakdown(
    expenses,
    members.map((m) => ({ id: m.id, name: m.user.name })),
    memberId,
  );
  const topCats = topCategories(expenses, categories, 5).map((c) => ({
    ...c,
    groupName: category(c.categoryId)?.groupName ?? "",
  }));

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <ExpenseHeader monthLabel={monthLabel} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ExpenseFilters />
          <ExpenseTable partnerName={partner?.user.name ?? null} realMemberId={memberId} rows={rows} />
        </div>

        <div className="space-y-6">
          <ExpenseSummaryCard
            pctOfIncome={pctOfIncome(totalExpenses, combinedIncome)}
            slices={slices}
            total={totalExpenses}
          />
          <TopCategoriesCard categories={topCats} />
          <ComingSoonCard
            description="A safe-to-spend forecast based on your budget and spending pace is coming soon."
            icon={PiggyBank}
            title="Safe to Spend Today"
          />
        </div>
      </div>
    </div>
  );
}
```

Note: `formatNPR` is imported but only used indirectly through the sub-components in this file — actually it is **not** used directly in `ExpensesPage.tsx` itself. Remove that import if `tsc`/lint flags it as unused in Step 3 below (keep only `pctOfIncome`).

- [ ] **Step 2: Turn index.tsx into a barrel re-export**

Replace the full contents of `src/modules/expenses/index.tsx` with:

```ts
export { EditExpensePage } from "./pages/EditExpensePage";
export { ExpensesPage } from "./pages/ExpensesPage";
export { NewExpensePage } from "./pages/NewExpensePage";
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
Expected: clean. If `formatNPR` in `ExpensesPage.tsx` is flagged unused, remove it from that file's import line (keep `pctOfIncome`).

- [ ] **Step 4: Run eslint --fix to normalize import/prop ordering**

```bash
npx eslint --fix
npm run lint
```
Expected: `--fix` reorders imports/props to match the project's perfectionist rules; the follow-up `lint` run is clean.

- [ ] **Step 5: Run the test suite**

```bash
npm test
```
Expected: all tests pass, including `expense-breakdown.test.ts` and the existing `calculations.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses
git commit -m "refactor: split expenses index.tsx into pages/, wire up redesigned ExpensesPage"
```

---

### Task 6: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck, tests, lint**

```bash
npx tsc --noEmit
npm test
npm run lint
```
Expected: all three clean.

- [ ] **Step 2: Confirm no stray references to the deleted component**

```bash
grep -rn "ExpenseListItem" src
```
Expected: no matches.

- [ ] **Step 3: Manual smoke check**

With the dev server running, visit `/expenses` and confirm: the header, disabled filter bar, owner tabs (switching tabs actually filters the table), the table renders real rows with category/owner/paid-by avatars and amounts, the row action menu's Edit link navigates to `/expenses/[id]/edit` and Delete removes a row, the Expense Summary donut renders with a legend, Top Categories shows real bars, and Safe to Spend Today shows the coming-soon card. Also visit `/expenses/new` and an existing expense's `/expenses/[id]/edit` to confirm those two pages still work unchanged.
