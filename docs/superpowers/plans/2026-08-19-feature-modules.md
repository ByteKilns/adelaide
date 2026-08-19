# Feature-module architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/components` and `src/lib` into per-sidebar-item feature modules under `src/modules/`, with thin `app/**/page.tsx` route wiring, per `docs/superpowers/specs/2026-08-19-feature-modules-design.md`.

**Architecture:** Each of Categories, Expenses, Budget, Dashboard gets a `src/modules/<name>/` folder with `components/`, `lib/`, `schemas/`, `api/` subfolders and (where the module has a route) an `index.tsx` entry file exporting the page component(s). `app/**/page.tsx` files become one-line re-exports. Truly shared UI stays in `src/components/ui` and `src/components/nav`; session/auth stays in shared `src/lib/`.

**Tech Stack:** Next.js 16 App Router (Server Components + Server Actions), TypeScript, Drizzle ORM, Zod, Vitest.

**Verification pattern for every task:** this is a pure relocation with zero behavior change, so there are no new tests to write. Each task's correctness gate is `npx tsc --noEmit` (catches every missed/stale import) plus `npm test` (catches any accidental logic change in files that get edited, e.g. `calculations.test.ts`). Both must be clean before that task's commit.

---

### Task 1: Categories module

**Files:**
- Create: `src/modules/categories/api/categories.ts` (moved from `src/lib/data/categories.ts`)
- Create: `src/modules/categories/lib/category-icons.tsx` (moved from `src/lib/category-icons.tsx`)
- Modify: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/budget/page.tsx`, `src/app/(app)/expenses/page.tsx`, `src/app/(app)/expenses/new/page.tsx`, `src/app/(app)/expenses/[id]/edit/page.tsx`, `src/lib/actions/expenses.ts`, `src/lib/actions/budget.ts`, `src/components/budget/budget_card.tsx`, `src/components/expenses/recent_expenses.tsx`

- [ ] **Step 1: Move the two files with git mv (preserves history)**

```bash
mkdir -p src/modules/categories/api src/modules/categories/lib
git mv src/lib/data/categories.ts src/modules/categories/api/categories.ts
git mv src/lib/category-icons.tsx src/modules/categories/lib/category-icons.tsx
```

`categories.ts` needs no import edits (it only imports from `@/db/client`, `@/db/schema`, `drizzle-orm`). `category-icons.tsx` imports `Tone` from `@/components/dashboard/tone_icon`, which hasn't moved yet (that happens in Task 4) — leave that import unchanged for now; it still resolves correctly.

- [ ] **Step 2: Update every consumer of the two old import paths**

Run this to find every remaining reference, then fix each one by hand (there are 9 files):

```bash
grep -rn '@/lib/data/categories\|@/lib/category-icons' src
```

For every match, replace:
- `@/lib/data/categories` → `@/modules/categories/api/categories`
- `@/lib/category-icons` → `@/modules/categories/lib/category-icons`

The 9 files and their exact old import lines:

`src/app/(app)/dashboard/page.tsx`:
```ts
import { listCategories } from "@/lib/data/categories";
```
becomes
```ts
import { listCategories } from "@/modules/categories/api/categories";
```

`src/app/(app)/budget/page.tsx`, `src/app/(app)/expenses/page.tsx`, `src/app/(app)/expenses/new/page.tsx`, `src/app/(app)/expenses/[id]/edit/page.tsx`: same one-line change as above.

`src/lib/actions/expenses.ts` and `src/lib/actions/budget.ts`:
```ts
import { listCategories } from "@/lib/data/categories";
```
becomes
```ts
import { listCategories } from "@/modules/categories/api/categories";
```

`src/components/budget/budget_card.tsx`:
```ts
import { getCategoryIcon, getCategoryTone } from "@/lib/category-icons";
```
becomes
```ts
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";
```

`src/components/expenses/recent_expenses.tsx`:
```ts
import { getCategoryIcon, getCategoryTone } from "@/lib/category-icons";
```
becomes
```ts
import { getCategoryIcon, getCategoryTone } from "@/modules/categories/lib/category-icons";
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm test
```
Expected: both clean (no errors, all tests pass).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extract categories module"
```

---

### Task 2: Expenses module

**Files:**
- Create: `src/modules/expenses/schemas/expense.ts`
- Create: `src/modules/expenses/api/actions.ts` (replaces `src/lib/actions/expenses.ts`)
- Create: `src/modules/expenses/components/expense_form.tsx`, `src/modules/expenses/components/expense_list_item.tsx` (moved)
- Create: `src/modules/dashboard/components/recent_expenses.tsx` (moved — dashboard-exclusive despite living under `expenses/` today)
- Create: `src/modules/expenses/index.tsx`
- Modify: `src/app/(app)/expenses/page.tsx`, `src/app/(app)/expenses/new/page.tsx`, `src/app/(app)/expenses/[id]/edit/page.tsx` (become thin re-exports), `src/app/(app)/dashboard/page.tsx` (import path fixes only, still a full page body until Task 4)
- Delete: `src/lib/actions/expenses.ts`

- [ ] **Step 1: Move the two form/list components and the dashboard-only RecentExpenses**

```bash
mkdir -p src/modules/expenses/components src/modules/expenses/schemas src/modules/expenses/api
mkdir -p src/modules/dashboard/components
git mv src/components/expenses/expense_form.tsx src/modules/expenses/components/expense_form.tsx
git mv src/components/expenses/expense_list_item.tsx src/modules/expenses/components/expense_list_item.tsx
git mv src/components/expenses/recent_expenses.tsx src/modules/dashboard/components/recent_expenses.tsx
```

- [ ] **Step 2: Extract the zod schema out of the actions file**

Create `src/modules/expenses/schemas/expense.ts`:

```ts
import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  ownerMemberId: z.string().uuid().nullable(),
  paidByMemberId: z.string().uuid(),
  date: z.string(), // "YYYY-MM-DD"
  note: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
```

- [ ] **Step 3: Create the actions file, importing the extracted schema and the categories module**

Create `src/modules/expenses/api/actions.ts`:

```ts
"use server";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { expenseSchema, type ExpenseInput } from "../schemas/expense";

async function assertMemberInHousehold(householdId: string, memberId: string) {
  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }
}

async function assertCategoryInHousehold(householdId: string, categoryId: string) {
  const categories = await listCategories(householdId);
  if (!categories.some((c) => c.id === categoryId)) {
    throw new Error("Category does not belong to this household");
  }
}

export async function createExpenseAction(input: ExpenseInput) {
  const { householdId } = await getCurrentMember();
  const parsed = expenseSchema.parse(input);
  await assertCategoryInHousehold(householdId, parsed.categoryId);
  await assertMemberInHousehold(householdId, parsed.paidByMemberId);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db.insert(expenses).values({
    householdId,
    amount: String(parsed.amount),
    categoryId: parsed.categoryId,
    ownerMemberId: parsed.ownerMemberId,
    paidByMemberId: parsed.paidByMemberId,
    date: parsed.date,
    note: parsed.note,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateExpenseAction(id: string, input: ExpenseInput) {
  const { householdId } = await getCurrentMember();
  const parsed = expenseSchema.parse(input);
  await assertCategoryInHousehold(householdId, parsed.categoryId);
  await assertMemberInHousehold(householdId, parsed.paidByMemberId);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  await db
    .update(expenses)
    .set({
      amount: String(parsed.amount),
      categoryId: parsed.categoryId,
      ownerMemberId: parsed.ownerMemberId,
      paidByMemberId: parsed.paidByMemberId,
      date: parsed.date,
      note: parsed.note ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpenseAction(id: string) {
  const { householdId } = await getCurrentMember();
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, householdId)));

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function listExpensesForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  return db
    .select()
    .from(expenses)
    .where(
      and(eq(expenses.householdId, householdId), gte(expenses.date, start), lte(expenses.date, end)),
    )
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}

export async function listRecentExpenses(limit: number) {
  const { householdId } = await getCurrentMember();
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.householdId, householdId))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))
    .limit(limit);
}
```

Then delete the old file:

```bash
git rm src/lib/actions/expenses.ts
```

- [ ] **Step 4: Fix imports inside the moved components**

`src/modules/expenses/components/expense_form.tsx` — change:
```ts
import { createExpenseAction, updateExpenseAction } from "@/lib/actions/expenses";
```
to:
```ts
import { createExpenseAction, updateExpenseAction } from "@/modules/expenses/api/actions";
```

`src/modules/expenses/components/expense_list_item.tsx` — change:
```ts
import { deleteExpenseAction } from "@/lib/actions/expenses";
```
to:
```ts
import { deleteExpenseAction } from "@/modules/expenses/api/actions";
```

`src/modules/dashboard/components/recent_expenses.tsx` needs no edit in this task (its `@/lib/category-icons` import was already fixed to `@/modules/categories/lib/category-icons` in Task 1; its `@/components/dashboard/tone_icon` import is fixed in Task 4).

- [ ] **Step 5: Create the module entry file with all three page components**

Create `src/modules/expenses/index.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { listExpensesForMonth } from "@/modules/expenses/api/actions";
import { ExpenseListItem } from "@/modules/expenses/components/expense_list_item";
import { ExpenseForm } from "@/modules/expenses/components/expense_form";
import { Button } from "@/components/ui/button";

export async function ExpensesPage() {
  const { householdId, memberId } = await getEffectiveMember();
  const now = new Date();
  const [members, categories, expenseRows] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    listExpensesForMonth(now.getFullYear(), now.getMonth() + 1),
  ]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown";
  const ownerLabel = (id: string | null) => {
    if (id === null) return "Shared";
    if (id === memberId) return "Me";
    return members.find((m) => m.id === id)?.user.name ?? "Partner";
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Expenses</h1>
        <Button asChild>
          <Link href="/expenses/new">+ Add Expense</Link>
        </Button>
      </div>
      <div>
        {expenseRows.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses this month yet.</p>
        )}
        {expenseRows.map((e) => (
          <ExpenseListItem
            key={e.id}
            id={e.id}
            categoryName={categoryName(e.categoryId)}
            amount={Number(e.amount)}
            ownerLabel={ownerLabel(e.ownerMemberId)}
            date={e.date}
            note={e.note}
          />
        ))}
      </div>
    </div>
  );
}

export async function NewExpensePage() {
  const { memberId, householdId } = await getEffectiveMember();
  const [members, categories] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
  ]);

  return (
    <ExpenseForm
      currentMemberId={memberId}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}

export async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { memberId, householdId } = await getEffectiveMember();
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
      currentMemberId={memberId}
      members={members.map((m) => ({ id: m.id, name: m.user.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      expenseId={expense.id}
      initial={{
        amount: Number(expense.amount),
        categoryId: expense.categoryId,
        ownerMemberId: expense.ownerMemberId,
        paidByMemberId: expense.paidByMemberId,
        date: expense.date,
        note: expense.note,
      }}
    />
  );
}
```

- [ ] **Step 6: Replace the three app route files with thin re-exports**

Replace the full contents of `src/app/(app)/expenses/page.tsx` with:

```tsx
export { ExpensesPage as default } from "@/modules/expenses";
```

Replace the full contents of `src/app/(app)/expenses/new/page.tsx` with:

```tsx
export { NewExpensePage as default } from "@/modules/expenses";
```

Replace the full contents of `src/app/(app)/expenses/[id]/edit/page.tsx` with:

```tsx
export { EditExpensePage as default } from "@/modules/expenses";
```

- [ ] **Step 7: Fix the dashboard page's references to what just moved**

`src/app/(app)/dashboard/page.tsx` still has its full body (it isn't modularized until Task 4). Update two lines:

```ts
import { listExpensesForMonth, listRecentExpenses } from "@/lib/actions/expenses";
```
becomes
```ts
import { listExpensesForMonth, listRecentExpenses } from "@/modules/expenses/api/actions";
```

and

```ts
import { RecentExpenses } from "@/components/expenses/recent_expenses";
```
becomes
```ts
import { RecentExpenses } from "@/modules/dashboard/components/recent_expenses";
```

- [ ] **Step 8: Verify**

```bash
npx tsc --noEmit
npm test
```
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: extract expenses module"
```

---

### Task 3: Budget module

**Files:**
- Create: `src/modules/budget/schemas/budget-item.ts`, `src/modules/budget/schemas/income.ts`
- Create: `src/modules/budget/api/actions.ts` (replaces `src/lib/actions/budget.ts` + `src/lib/actions/income.ts`)
- Create: `src/modules/budget/lib/budget-status.ts`, `src/modules/budget/lib/calculations.ts` (+ `.test.ts`) (moved)
- Create: `src/modules/budget/components/budget_card.tsx`, `budget_item_row.tsx`, `budget_vs_actual_table.tsx`, `income_form.tsx` (moved)
- Create: `src/modules/budget/index.tsx`
- Modify: `src/app/(app)/budget/page.tsx` (becomes thin re-export), `src/app/(app)/dashboard/page.tsx` (import path fixes only)
- Delete: `src/lib/actions/budget.ts`, `src/lib/actions/income.ts`

- [ ] **Step 1: Move components and lib files with git mv**

```bash
mkdir -p src/modules/budget/components src/modules/budget/lib src/modules/budget/schemas src/modules/budget/api
git mv src/components/budget/budget_card.tsx src/modules/budget/components/budget_card.tsx
git mv src/components/budget/budget_item_row.tsx src/modules/budget/components/budget_item_row.tsx
git mv src/components/budget/budget_vs_actual_table.tsx src/modules/budget/components/budget_vs_actual_table.tsx
git mv src/components/budget/income_form.tsx src/modules/budget/components/income_form.tsx
git mv src/lib/budget-status.ts src/modules/budget/lib/budget-status.ts
git mv src/lib/calculations/budget.ts src/modules/budget/lib/calculations.ts
git mv src/lib/calculations/budget.test.ts src/modules/budget/lib/calculations.test.ts
```

- [ ] **Step 2: Fix the test's relative import**

`src/modules/budget/lib/calculations.test.ts` — change:
```ts
import {
  budgetVsActual,
  categorySpent,
  dashboardSummary,
  type BudgetItemInput,
  type ExpenseInput,
  type IncomeInput,
} from "./budget";
```
to:
```ts
import {
  budgetVsActual,
  categorySpent,
  dashboardSummary,
  type BudgetItemInput,
  type ExpenseInput,
  type IncomeInput,
} from "./calculations";
```

`calculations.ts` itself needs no edits — it has no imports.

- [ ] **Step 3: Extract the two zod schemas**

Create `src/modules/budget/schemas/budget-item.ts`:

```ts
import { z } from "zod";

export const setBudgetItemSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  categoryId: z.string().uuid(),
  ownerMemberId: z.string().uuid().nullable(),
  plannedAmount: z.number().nonnegative(),
});

export type SetBudgetItemInput = z.infer<typeof setBudgetItemSchema>;
```

Create `src/modules/budget/schemas/income.ts`:

```ts
import { z } from "zod";

export const setIncomeSchema = z.object({
  memberId: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative(),
  note: z.string().optional(),
});

export type SetIncomeInput = z.infer<typeof setIncomeSchema>;
```

- [ ] **Step 4: Create the combined actions file**

Create `src/modules/budget/api/actions.ts`:

```ts
"use server";

import { and, eq, isNull, ne, not, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { monthlyBudgets, budgetItems, incomes } from "@/db/schema";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { setBudgetItemSchema, type SetBudgetItemInput } from "../schemas/budget-item";
import { setIncomeSchema, type SetIncomeInput } from "../schemas/income";

async function getOrCreateMonthlyBudget(householdId: string, year: number, month: number) {
  const [existing] = await db
    .select()
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.householdId, householdId),
        eq(monthlyBudgets.year, year),
        eq(monthlyBudgets.month, month),
      ),
    );
  if (existing) return existing;

  const [created] = await db
    .insert(monthlyBudgets)
    .values({ householdId, year, month })
    .returning();
  return created;
}

export async function getBudgetItemsForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  const budget = await getOrCreateMonthlyBudget(householdId, year, month);
  return db.select().from(budgetItems).where(eq(budgetItems.monthlyBudgetId, budget.id));
}

export async function setBudgetItemAction(input: SetBudgetItemInput) {
  const { householdId } = await getCurrentMember();
  const parsed = setBudgetItemSchema.parse(input);

  const categories = await listCategories(householdId);
  if (!categories.some((c) => c.id === parsed.categoryId)) {
    throw new Error("Category does not belong to this household");
  }

  if (parsed.ownerMemberId !== null) {
    const members = await getHouseholdMembers(householdId);
    if (!members.some((m) => m.id === parsed.ownerMemberId)) {
      throw new Error("Member does not belong to this household");
    }
  }

  const budget = await getOrCreateMonthlyBudget(householdId, parsed.year, parsed.month);

  // The UI shows exactly one row per category (with an owner dropdown), which
  // implies "each category has at most one current owner/allocation per
  // month." Enforce that invariant here: before writing the row for the
  // owner being saved, remove any other row for this category/month whose
  // owner differs — otherwise switching a category's owner (e.g. Shared ->
  // a specific member) would leave the old row behind as an orphaned,
  // hidden duplicate that `budgetItems.find()` on the page may or may not
  // surface. Wrapped in the same transaction as the upsert so the
  // delete+write is atomic.
  await db.transaction(async (tx) => {
    await tx
      .delete(budgetItems)
      .where(
        and(
          eq(budgetItems.monthlyBudgetId, budget.id),
          eq(budgetItems.categoryId, parsed.categoryId),
          parsed.ownerMemberId === null
            ? not(isNull(budgetItems.ownerMemberId))
            : or(isNull(budgetItems.ownerMemberId), ne(budgetItems.ownerMemberId, parsed.ownerMemberId)),
        ),
      );

    if (parsed.ownerMemberId === null) {
      // The unique constraint on budget_items is a plain multi-column UNIQUE
      // (monthly_budget_id, category_id, owner_member_id), not a partial unique
      // index. Postgres never treats two NULLs as equal for uniqueness purposes,
      // so `ON CONFLICT (monthly_budget_id, category_id, owner_member_id)` never
      // fires when owner_member_id is NULL — two "shared" inserts for the same
      // category/month would each succeed and create a duplicate row instead of
      // updating in place. Verified empirically against the live DB. So for the
      // shared (null-owner) case we must select-then-branch inside the
      // transaction instead of relying on onConflictDoUpdate.
      const [existing] = await tx
        .select()
        .from(budgetItems)
        .where(
          and(
            eq(budgetItems.monthlyBudgetId, budget.id),
            eq(budgetItems.categoryId, parsed.categoryId),
            isNull(budgetItems.ownerMemberId),
          ),
        )
        .for("update");

      if (existing) {
        await tx
          .update(budgetItems)
          .set({ plannedAmount: String(parsed.plannedAmount) })
          .where(eq(budgetItems.id, existing.id));
      } else {
        await tx.insert(budgetItems).values({
          monthlyBudgetId: budget.id,
          categoryId: parsed.categoryId,
          ownerMemberId: null,
          plannedAmount: String(parsed.plannedAmount),
        });
      }
    } else {
      // For a non-null owner, the composite unique constraint does detect
      // conflicts correctly, so the atomic upsert is safe here.
      await tx
        .insert(budgetItems)
        .values({
          monthlyBudgetId: budget.id,
          categoryId: parsed.categoryId,
          ownerMemberId: parsed.ownerMemberId,
          plannedAmount: String(parsed.plannedAmount),
        })
        .onConflictDoUpdate({
          target: [budgetItems.monthlyBudgetId, budgetItems.categoryId, budgetItems.ownerMemberId],
          set: { plannedAmount: String(parsed.plannedAmount) },
        });
    }
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function getIncomesForMonth(year: number, month: number) {
  const { householdId } = await getCurrentMember();
  return db
    .select()
    .from(incomes)
    .where(and(eq(incomes.householdId, householdId), eq(incomes.year, year), eq(incomes.month, month)));
}

export async function setIncomeAction(input: SetIncomeInput) {
  const { householdId } = await getCurrentMember();
  const parsed = setIncomeSchema.parse(input);

  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === parsed.memberId)) {
    throw new Error("Member does not belong to this household");
  }

  await db
    .insert(incomes)
    .values({
      householdId,
      memberId: parsed.memberId,
      year: parsed.year,
      month: parsed.month,
      amount: String(parsed.amount),
      note: parsed.note,
    })
    .onConflictDoUpdate({
      target: [incomes.memberId, incomes.year, incomes.month],
      set: { amount: String(parsed.amount), note: parsed.note ?? null },
    });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}
```

Then delete the two old files:

```bash
git rm src/lib/actions/budget.ts src/lib/actions/income.ts
```

- [ ] **Step 5: Fix imports inside the moved components**

`src/modules/budget/components/budget_card.tsx` — change:
```ts
import { computeBudgetStatus } from "@/lib/budget-status";
```
to:
```ts
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";
```
(its `@/lib/category-icons` import was already fixed in Task 1; leave `@/components/dashboard/tone_icon` as-is — fixed in Task 4)

`src/modules/budget/components/budget_item_row.tsx` — change:
```ts
import { setBudgetItemAction } from "@/lib/actions/budget";
```
to:
```ts
import { setBudgetItemAction } from "@/modules/budget/api/actions";
```

`src/modules/budget/components/budget_vs_actual_table.tsx` — change:
```ts
import { computeBudgetStatus } from "@/lib/budget-status";
```
to:
```ts
import { computeBudgetStatus } from "@/modules/budget/lib/budget-status";
```

`src/modules/budget/components/income_form.tsx` — change:
```ts
import { setIncomeAction } from "@/lib/actions/income";
```
to:
```ts
import { setIncomeAction } from "@/modules/budget/api/actions";
```

- [ ] **Step 6: Create the module entry file**

Create `src/modules/budget/index.tsx`:

```tsx
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { getIncomesForMonth, getBudgetItemsForMonth } from "@/modules/budget/api/actions";
import { IncomeForm } from "@/modules/budget/components/income_form";
import { BudgetItemRow } from "@/modules/budget/components/budget_item_row";

export async function BudgetPage() {
  const { householdId } = await getCurrentMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [members, categories, incomes, budgetItems] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Income</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <IncomeForm
              key={m.id}
              memberId={m.id}
              memberName={m.user.name}
              year={year}
              month={month}
              initialAmount={Number(
                incomes.find((i) => i.memberId === m.id)?.amount ?? 0,
              )}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Budget allocation</h2>
        <div className="divide-y">
          {categories.map((c) => {
            const existing = budgetItems.find((b) => b.categoryId === c.id);
            return (
              <BudgetItemRow
                key={c.id}
                categoryId={c.id}
                categoryName={c.name}
                year={year}
                month={month}
                members={members.map((m) => ({ id: m.id, name: m.user.name }))}
                initialOwnerMemberId={existing?.ownerMemberId ?? null}
                initialPlannedAmount={Number(existing?.plannedAmount ?? 0)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 7: Replace the app route file with a thin re-export**

Replace the full contents of `src/app/(app)/budget/page.tsx` with:

```tsx
export { BudgetPage as default } from "@/modules/budget";
```

- [ ] **Step 8: Fix the dashboard page's references to what just moved**

`src/app/(app)/dashboard/page.tsx` — change:
```ts
import { getIncomesForMonth } from "@/lib/actions/income";
import { getBudgetItemsForMonth } from "@/lib/actions/budget";
```
to:
```ts
import { getIncomesForMonth, getBudgetItemsForMonth } from "@/modules/budget/api/actions";
```

and:
```ts
import { dashboardSummary, budgetVsActual } from "@/lib/calculations/budget";
```
to:
```ts
import { dashboardSummary, budgetVsActual } from "@/modules/budget/lib/calculations";
```

and:
```ts
import { BudgetCard } from "@/components/budget/budget_card";
import { BudgetVsActualTable } from "@/components/budget/budget_vs_actual_table";
```
to:
```ts
import { BudgetCard } from "@/modules/budget/components/budget_card";
import { BudgetVsActualTable } from "@/modules/budget/components/budget_vs_actual_table";
```

- [ ] **Step 9: Verify**

```bash
npx tsc --noEmit
npm test
```
Expected: both clean. `npm test` specifically confirms `calculations.test.ts` still passes at its new path/import.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: extract budget module"
```

---

### Task 4: Dashboard module

**Files:**
- Create: `src/modules/dashboard/components/summary_cards.tsx`, `owner_tabs.tsx`, `dashboard_header.tsx`, `dashboard_panel.tsx`, `coming_soon_card.tsx`, `tone_icon.tsx` (moved)
- Create: `src/modules/dashboard/lib/format.ts`, `map-rows.ts`, `owner-label.ts` (moved)
- Create: `src/modules/dashboard/index.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx` (becomes thin re-export), `src/modules/categories/lib/category-icons.tsx`, `src/modules/budget/components/budget_card.tsx`, `src/modules/dashboard/components/recent_expenses.tsx`
- Delete: `src/components/dashboard/` (now empty), `src/lib/dashboard/` (now empty)

- [ ] **Step 1: Move components and lib files with git mv**

```bash
mkdir -p src/modules/dashboard/components src/modules/dashboard/lib
git mv src/components/dashboard/summary_cards.tsx src/modules/dashboard/components/summary_cards.tsx
git mv src/components/dashboard/owner_tabs.tsx src/modules/dashboard/components/owner_tabs.tsx
git mv src/components/dashboard/dashboard_header.tsx src/modules/dashboard/components/dashboard_header.tsx
git mv src/components/dashboard/dashboard_panel.tsx src/modules/dashboard/components/dashboard_panel.tsx
git mv src/components/dashboard/coming_soon_card.tsx src/modules/dashboard/components/coming_soon_card.tsx
git mv src/components/dashboard/tone_icon.tsx src/modules/dashboard/components/tone_icon.tsx
git mv src/lib/dashboard/format.ts src/modules/dashboard/lib/format.ts
git mv src/lib/dashboard/map-rows.ts src/modules/dashboard/lib/map-rows.ts
git mv src/lib/dashboard/owner-label.ts src/modules/dashboard/lib/owner-label.ts
```

- [ ] **Step 2: Fix every remaining reference to the old `tone_icon` path**

```bash
grep -rn '@/components/dashboard/tone_icon' src
```

Expect 4 matches. Fix each:

`src/modules/dashboard/components/summary_cards.tsx` — change:
```ts
import {
  ToneIcon,
  TONE_BAR_CLASSES,
  type Tone,
} from "@/components/dashboard/tone_icon";
```
to:
```ts
import {
  ToneIcon,
  TONE_BAR_CLASSES,
  type Tone,
} from "@/modules/dashboard/components/tone_icon";
```

`src/modules/categories/lib/category-icons.tsx` — change:
```ts
import type { Tone } from "@/components/dashboard/tone_icon";
```
to:
```ts
import type { Tone } from "@/modules/dashboard/components/tone_icon";
```

`src/modules/budget/components/budget_card.tsx` — change:
```ts
import { ToneIcon, TONE_BAR_CLASSES } from "@/components/dashboard/tone_icon";
```
to:
```ts
import { ToneIcon, TONE_BAR_CLASSES } from "@/modules/dashboard/components/tone_icon";
```

`src/modules/dashboard/components/recent_expenses.tsx` — change:
```ts
import { ToneIcon } from "@/components/dashboard/tone_icon";
```
to:
```ts
import { ToneIcon } from "@/modules/dashboard/components/tone_icon";
```
(this is the 4th match from the grep above — same fix as the others)

- [ ] **Step 3: Fix `summary_cards.tsx`'s format import**

`src/modules/dashboard/components/summary_cards.tsx` — change:
```ts
import { formatNPR, pctOfIncome } from "@/lib/dashboard/format";
```
to:
```ts
import { formatNPR, pctOfIncome } from "@/modules/dashboard/lib/format";
```

- [ ] **Step 4: Create the module entry file**

Create `src/modules/dashboard/index.tsx`:

```tsx
import { Gauge, PiggyBank } from "lucide-react";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { getIncomesForMonth, getBudgetItemsForMonth } from "@/modules/budget/api/actions";
import { listExpensesForMonth, listRecentExpenses } from "@/modules/expenses/api/actions";
import { dashboardSummary, budgetVsActual } from "@/modules/budget/lib/calculations";
import { toIncomeInputs, toExpenseInputs, toBudgetItemInputs } from "@/modules/dashboard/lib/map-rows";
import { classifyOwnerLabel } from "@/modules/dashboard/lib/owner-label";
import { DashboardHeader } from "@/modules/dashboard/components/dashboard_header";
import { SummaryCards } from "@/modules/dashboard/components/summary_cards";
import { OwnerTabs } from "@/modules/dashboard/components/owner_tabs";
import { ComingSoonCard } from "@/modules/dashboard/components/coming_soon_card";
import { DashboardPanel } from "@/modules/dashboard/components/dashboard_panel";
import { BudgetCard } from "@/modules/budget/components/budget_card";
import { BudgetVsActualTable } from "@/modules/budget/components/budget_vs_actual_table";
import { RecentExpenses } from "@/modules/dashboard/components/recent_expenses";

function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function DashboardPage() {
  const { householdId, memberId } = await getEffectiveMember();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prev = previousMonth(year, month);

  const [
    members,
    categories,
    incomeRows,
    budgetItemRows,
    expenseRows,
    prevIncomeRows,
    prevExpenseRows,
    recentExpenseRows,
  ] = await Promise.all([
    getHouseholdMembers(householdId),
    listCategories(householdId),
    getIncomesForMonth(year, month),
    getBudgetItemsForMonth(year, month),
    listExpensesForMonth(year, month),
    getIncomesForMonth(prev.year, prev.month),
    listExpensesForMonth(prev.year, prev.month),
    listRecentExpenses(5),
  ]);

  const incomes = toIncomeInputs(incomeRows);
  const expenses = toExpenseInputs(expenseRows);
  const budgetItems = toBudgetItemInputs(budgetItemRows);

  const summary = dashboardSummary(incomes, expenses);
  const vsActual = budgetVsActual(budgetItems, expenses);

  // Previous-month budget-vs-actual is deliberately NOT computed here — only
  // dashboardSummary (for the trend lines above). Nothing on this page shows
  // a previous-month budget-vs-actual breakdown, so there's no need to fetch
  // budget items for the previous month at all.
  const prevSummary = dashboardSummary(
    toIncomeInputs(prevIncomeRows),
    toExpenseInputs(prevExpenseRows),
  );

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";

  const ownerLabel = (id: string | null) => classifyOwnerLabel(id, memberId, members);

  const partner = members.find((m) => m.id !== memberId);
  const ownerViews = [
    {
      key: "me",
      label: "Me",
      income: incomes.find((i) => i.memberId === memberId)?.amount ?? 0,
      expenses: expenses
        .filter((e) => e.ownerMemberId === memberId)
        .reduce((s, e) => s + e.amount, 0),
      remaining: 0,
    },
    ...(partner
      ? [
          {
            key: "partner",
            label: partner.user.name,
            income: incomes.find((i) => i.memberId === partner.id)?.amount ?? 0,
            expenses: expenses
              .filter((e) => e.ownerMemberId === partner.id)
              .reduce((s, e) => s + e.amount, 0),
            remaining: 0,
          },
        ]
      : []),
    {
      key: "shared",
      label: "Shared",
      income: 0,
      expenses: expenses.filter((e) => e.ownerMemberId === null).reduce((s, e) => s + e.amount, 0),
      remaining: 0,
    },
  ].map((v) => ({ ...v, remaining: v.income - v.expenses }));

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentMemberName = members.find((m) => m.id === memberId)?.user.name ?? "there";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <DashboardHeader name={currentMemberName} monthLabel={monthLabel} />

      <SummaryCards
        combinedIncome={summary.combinedIncome}
        totalExpenses={summary.totalExpenses}
        unallocated={summary.unallocated}
        incomeTrendPct={trendPct(summary.combinedIncome, prevSummary.combinedIncome)}
        expenseTrendPct={trendPct(summary.totalExpenses, prevSummary.totalExpenses)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardPanel title="Overview">
            <OwnerTabs views={ownerViews} />
          </DashboardPanel>

          <ComingSoonCard
            icon={Gauge}
            title="Financial Health"
            description="A safe-to-spend forecast based on your budget and spending pace is coming soon."
          />

          <DashboardPanel title="Budget Overview" actionLabel="View all budgets" actionHref="/budget">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vsActual.map((row) => (
                <BudgetCard
                  key={`${row.categoryId}-${row.ownerMemberId ?? "shared"}`}
                  categoryName={categoryName(row.categoryId)}
                  categoryGroupName={category(row.categoryId)?.groupName ?? ""}
                  ownerLabel={ownerLabel(row.ownerMemberId)}
                  planned={row.planned}
                  actual={row.actual}
                />
              ))}
              {vsActual.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No budget set for this month yet.
                </p>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Budget vs Actual">
            <BudgetVsActualTable
              rows={vsActual.map((row) => ({
                categoryId: row.categoryId,
                ownerMemberId: row.ownerMemberId,
                categoryName: categoryName(row.categoryId),
                planned: row.planned,
                actual: row.actual,
                difference: row.difference,
              }))}
            />
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <RecentExpenses
            rows={recentExpenseRows.map((e) => ({
              id: e.id,
              categoryName: categoryName(e.categoryId),
              categoryGroupName: category(e.categoryId)?.groupName ?? "",
              ownerLabel: ownerLabel(e.ownerMemberId),
              amount: Number(e.amount),
              date: e.date,
            }))}
          />

          <ComingSoonCard
            icon={PiggyBank}
            title="Savings Goals"
            description="Set shared or personal savings targets and track progress here soon."
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Replace the app route file with a thin re-export**

Replace the full contents of `src/app/(app)/dashboard/page.tsx` with:

```tsx
export { DashboardPage as default } from "@/modules/dashboard";
```

- [ ] **Step 6: Remove now-empty old directories**

```bash
rmdir src/components/dashboard 2>/dev/null || true
rmdir src/lib/dashboard 2>/dev/null || true
rmdir src/components/expenses 2>/dev/null || true
rmdir src/lib/data 2>/dev/null || true
rmdir src/lib/calculations 2>/dev/null || true
```
(these will silently no-op if a directory still has files in it — that's fine, it means something wasn't moved and Step 7's verification will catch it)

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npm test
grep -rn '@/lib/dashboard\|@/lib/data/categories\|@/lib/category-icons\|@/lib/actions/expenses\|@/lib/actions/budget\|@/lib/actions/income\|@/lib/budget-status\|@/lib/calculations/budget\|@/components/dashboard\|@/components/expenses\|@/components/budget' src
```
Expected: `tsc` and `npm test` both clean; the `grep` returns **no matches** (confirms every old import path was actually replaced, not just that the build happens to still resolve via a stale re-export).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: extract dashboard module"
```

---

### Task 5: Scaffold the remaining sidebar modules

**Files:**
- Create: `src/modules/recurring/README.md`, `src/modules/savings-goals/README.md`, `src/modules/reports/README.md`, `src/modules/notifications/README.md`, `src/modules/settings/README.md`

Git doesn't track empty directories, so `components/`, `lib/`, `constants/`, `schemas/`, `hooks/`, `api/` subfolders can't be scaffolded as empty folders — they'll be created naturally when each feature's first file is added. Instead, each module gets a one-line README recording the intended structure, so the folder exists and its purpose is documented until there's real code to hold.

- [ ] **Step 1: Create the five README files**

Create `src/modules/recurring/README.md`:
```md
# Recurring module

Not yet built — sidebar entry is disabled. When implemented, follows the
standard module shape: `components/`, `lib/`, `constants/`, `schemas/`,
`hooks/`, `api/`, plus an `index.tsx` entry wired from
`src/app/(app)/recurring/page.tsx`.
```

Create `src/modules/savings-goals/README.md` (same body, module name "Savings Goals module").

Create `src/modules/reports/README.md` (same body, module name "Reports module").

Create `src/modules/notifications/README.md` (same body, module name "Notifications module").

Create `src/modules/settings/README.md` (same body, module name "Settings module").

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: scaffold remaining sidebar modules"
```

---

### Task 6: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 2: Full test suite**

```bash
npm test
```
Expected: all tests pass (this includes `src/modules/budget/lib/calculations.test.ts`).

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Confirm no stale references to any old path remain anywhere in `src`**

```bash
grep -rn '@/components/dashboard\|@/components/budget\|@/components/expenses\|@/lib/dashboard\|@/lib/data\|@/lib/category-icons\|@/lib/actions/expenses\|@/lib/actions/budget\|@/lib/actions/income\|@/lib/budget-status\|@/lib/calculations' src
```
Expected: no matches.

- [ ] **Step 5: Confirm the final directory shape matches the spec**

```bash
find src/modules -type f | sort
find src/components -type f | sort
find src/lib -maxdepth 1 -type f | sort
```
Expected: `src/modules/{categories,expenses,budget,dashboard}` each contain their module's files per the spec; `src/components` contains only `ui/` and `nav/`; `src/lib` (top level) contains only `session.ts`, `viewing-as-cookie.ts`, `utils.ts`, `format-date.ts`, and an `actions/` folder with `auth.ts` + `viewing-as.ts`.

- [ ] **Step 6: Manual smoke check**

Run `npm run dev`, then visit `/dashboard`, `/expenses`, `/expenses/new`, an existing expense's `/expenses/[id]/edit`, and `/budget` in a browser. Confirm each page renders with no console errors and the previously-working features (add/edit/delete expense, set income, set budget item) still work. This step has no automated command — it's a manual pass since the move touched every route.
