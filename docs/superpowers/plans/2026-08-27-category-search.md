# Searchable Category Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain category `<Select>` dropdown in expense recording with a searchable, fuzzy-matching combobox that also lets users create a missing category inline.

**Architecture:** A new `CategoryComboboxField` component (Popover + Input + result list) replaces `SelectField`/`Select` for the category field in `ExpenseForm` and `BulkExpenseForm`. Matching runs client-side via `fuse.js` against category name + group name. When there's no exact match, a result row opens the existing `CategoryFormModal` prefilled with the typed text; on save, the new category is selected and merged into local state.

**Tech Stack:** Next.js (App Router, Server Actions), React Hook Form, `radix-ui` Popover primitive, `fuse.js`, Drizzle ORM, Vitest.

Full design: `docs/superpowers/specs/2026-08-27-category-search-design.md`

---

### Task 1: Add `fuse.js` dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Verify the dependency is present**

`fuse.js` was added during design validation. Confirm it's in `package.json`:

Run: `grep '"fuse.js"' package.json`
Expected: `"fuse.js": "^7.5.0",`

If it's missing, run `npm install fuse.js` first.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add fuse.js for category search"
```

---

### Task 2: Popover UI primitive

**Files:**
- Create: `src/components/ui/popover.tsx`

- [ ] **Step 1: Create the Popover wrapper**

Follows the same pattern as `src/components/ui/dropdown-menu.tsx` (thin wrapper around the `radix-ui` umbrella package's primitive, with the project's shared styling conventions).

```tsx
"use client";

import * as React from "react";

import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  align = "center",
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/popover.tsx
git commit -m "feat: add Popover UI primitive"
```

---

### Task 3: Fuzzy category matching (TDD)

**Files:**
- Create: `src/components/lib/category-search.ts`
- Test: `src/components/lib/category-search.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";

import { hasExactMatch, searchCategories } from "./category-search";

const CATEGORIES = [
  { groupName: "Household", id: "1", name: "Groceries" },
  { groupName: "Transportation", id: "2", name: "Petrol" },
  { groupName: "Lifestyle", id: "3", name: "Dining Out" },
];

describe("searchCategories", () => {
  it("returns all categories for an empty query", () => {
    expect(searchCategories(CATEGORIES, "")).toEqual(CATEGORIES);
  });

  it("returns an empty array when there are no categories", () => {
    expect(searchCategories([], "grocery")).toEqual([]);
  });

  it("ranks an exact name match first", () => {
    const results = searchCategories(CATEGORIES, "Petrol");
    expect(results[0]?.name).toBe("Petrol");
  });

  it("tolerates typos", () => {
    const results = searchCategories(CATEGORIES, "pertrol");
    expect(results[0]?.name).toBe("Petrol");
  });

  it("matches a partial/substring query regardless of position", () => {
    const results = searchCategories(CATEGORIES, "grocery");
    expect(results[0]?.name).toBe("Groceries");
  });

  it("returns no results for a query unrelated to any category", () => {
    expect(searchCategories(CATEGORIES, "xyz123")).toEqual([]);
  });
});

describe("hasExactMatch", () => {
  it("is true for a case-insensitive exact name match", () => {
    expect(hasExactMatch(CATEGORIES, "petrol")).toBe(true);
  });

  it("is false for a partial match", () => {
    expect(hasExactMatch(CATEGORIES, "Petr")).toBe(false);
  });

  it("is false for an empty query", () => {
    expect(hasExactMatch(CATEGORIES, "")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/lib/category-search.test.ts`
Expected: FAIL with "Cannot find module './category-search'" (the module doesn't exist yet).

- [ ] **Step 3: Implement `category-search.ts`**

These options (`threshold: 0.4`, `ignoreLocation: true`, name weighted over groupName) were validated against the exact fixture data above plus "dinig"→"Dining Out" and "food"→no match, confirming typo tolerance without false positives.

```ts
import Fuse from "fuse.js";

export type CategoryMatchInput = { groupName: string; id: string; name: string };

const FUSE_OPTIONS = {
  ignoreLocation: true,
  keys: [
    { name: "name", weight: 1 },
    { name: "groupName", weight: 0.3 },
  ],
  threshold: 0.4,
};

// Fuzzy-ranked matches for a search query. Empty query returns the full
// list unsorted, matching the plain dropdown's current behavior.
export function searchCategories<T extends CategoryMatchInput>(categories: T[], query: string): T[] {
  const trimmed = query.trim();
  if (!trimmed) return categories;

  return new Fuse(categories, FUSE_OPTIONS).search(trimmed).map((result) => result.item);
}

// True when `query` case-insensitively equals an existing category's name
// exactly — used to auto-highlight that result and suppress the
// "add as new category" row.
export function hasExactMatch<T extends CategoryMatchInput>(categories: T[], query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;

  return categories.some((c) => c.name.toLowerCase() === trimmed);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/lib/category-search.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/lib/category-search.ts src/components/lib/category-search.test.ts
git commit -m "feat: add fuzzy category search"
```

---

### Task 4: `CategoryFormModal` — prefilled name + created callback

**Files:**
- Modify: `src/modules/categories/components/CategoryFormModal.tsx`
- Modify: `src/modules/categories/api/categories.actions.ts`

- [ ] **Step 1: Return the inserted row from `createCategoryAction`**

Edit `src/modules/categories/api/categories.actions.ts` — change the `createCategoryAction` body (currently at lines 19-31):

```ts
export async function createCategoryAction(input: CategoryInput) {
  const { householdId } = await getCurrentMember();
  const parsed = categorySchema.parse(input);

  const [category] = await db
    .insert(categories)
    .values({
      budgetType: parsed.budgetType,
      groupName: parsed.groupName,
      householdId,
      name: parsed.name,
    })
    .returning();

  revalidateCategoryPaths();

  return category;
}
```

- [ ] **Step 2: Add `defaultName` and `onCreated` to `CategoryFormModal`**

Edit `src/modules/categories/components/CategoryFormModal.tsx`. Update the `Props` type (currently lines 17-21):

```tsx
type Props = {
  category: Category | null;
  defaultName?: string;
  onCreated?: (category: Category) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};
```

Update `EMPTY` and the component signature (currently lines 23-31):

```tsx
const EMPTY: CategoryInput = { budgetType: "flexible", groupName: CATEGORY_GROUPS[0], name: "" };

export function CategoryFormModal({ category, defaultName, onCreated, onOpenChange, open }: Props) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryInput>({
    defaultValues: category ?? { ...EMPTY, name: defaultName ?? "" },
    resolver: zodResolver(categorySchema),
  });
```

`useForm`'s `defaultValues` are only read on mount, but this modal is already re-mounted per open via `key={editing?.id ?? "new"}` in `CategoriesManager` — `CategoryComboboxField` (Task 6) follows the same pattern, so `defaultName` reaching the form on open is covered without adding a `reset()` effect. Remove the unused `reset` import destructure — it isn't needed; drop it from the object above (keep only `control, formState, handleSubmit, register`).

Update `onSubmit` (currently lines 33-45) to call `onCreated` for the create path:

```tsx
  const onSubmit = handleSubmit(async (values) => {
    try {
      if (category) {
        await updateCategoryAction(category.id, values);
        toast.success("Category updated");
      } else {
        const created = await createCategoryAction(values);
        toast.success("Category added");
        if (created) onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
    }
  });
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (existing callers `CategoriesManager` don't pass `defaultName`/`onCreated`, both optional).

- [ ] **Step 4: Commit**

```bash
git add src/modules/categories/components/CategoryFormModal.tsx src/modules/categories/api/categories.actions.ts
git commit -m "feat: support prefilled name and creation callback in CategoryFormModal"
```

---

### Task 5: `CategoryComboboxField` component

**Files:**
- Create: `src/components/CategoryComboboxField.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Check, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { hasExactMatch, searchCategories, type CategoryMatchInput } from "@/components/lib/category-search";
import { cn } from "@/lib/utils";
import { CategoryFormModal } from "@/modules/categories/components/CategoryFormModal";

type Category = CategoryMatchInput;

type Props = {
  categories: Category[];
  containerClassName?: string;
  error?: string;
  id?: string;
  label: string;
  onCategoriesChange?: (categories: Category[]) => void;
  onValueChange: (value: string) => void;
  value: string;
};

export function CategoryComboboxField({
  categories,
  containerClassName,
  error,
  id,
  label,
  onCategoriesChange,
  onValueChange,
  value,
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const selected = categories.find((c) => c.id === value) ?? null;
  const results = useMemo(() => searchCategories(categories, query), [categories, query]);
  const showAddRow = query.trim().length > 0 && !hasExactMatch(categories, query);
  const rowCount = results.length + (showAddRow ? 1 : 0);

  useEffect(() => {
    setHighlighted(0);
  }, [query, open]);

  function selectCategory(category: Category) {
    onValueChange(category.id);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, Math.max(rowCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted < results.length) {
        const category = results[highlighted];
        if (category) selectCategory(category);
      } else if (showAddRow) {
        setCreateOpen(true);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleCreated(category: Category) {
    onCategoriesChange?.([...categories, category]);
    onValueChange(category.id);
    setCreateOpen(false);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className={cn("space-y-1", containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverAnchor asChild>
          <Input
            aria-invalid={Boolean(error)}
            autoComplete="off"
            id={fieldId}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search categories..."
            value={open ? query : (selected?.name ?? "")}
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="max-h-64 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {results.map((category, index) => (
            <button
              className={cn(
                "flex w-full items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-left text-sm",
                index === highlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent",
              )}
              key={category.id}
              onClick={() => selectCategory(category)}
              onMouseEnter={() => setHighlighted(index)}
              type="button"
            >
              <span>
                {category.name}
                <span className="ml-1.5 text-xs text-muted-foreground">{category.groupName}</span>
              </span>
              {category.id === value && <Check className="h-4 w-4" />}
            </button>
          ))}

          {results.length === 0 && !showAddRow && (
            <p className="px-1.5 py-1 text-sm text-muted-foreground">No categories</p>
          )}

          {showAddRow && (
            <button
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm text-primary",
                highlighted === results.length ? "bg-accent" : "hover:bg-accent",
              )}
              onClick={() => setCreateOpen(true)}
              onMouseEnter={() => setHighlighted(results.length)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add &quot;{query.trim()}&quot; as new category
            </button>
          )}
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <CategoryFormModal
        category={null}
        defaultName={query.trim()}
        onCreated={handleCreated}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CategoryComboboxField.tsx
git commit -m "feat: add CategoryComboboxField"
```

---

### Task 6: Wire into `ExpenseForm` and its callers

**Files:**
- Modify: `src/modules/expenses/components/ExpenseForm.tsx`
- Modify: `src/modules/expenses/components/AddExpenseModal.tsx`
- Modify: `src/modules/expenses/pages/EditExpensePage.tsx`
- Modify: `src/components/nav/SidebarNav.tsx`
- Modify: `src/components/nav/BottomNav.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Widen the `Category` type and swap the field in `ExpenseForm.tsx`**

Change line 16 from:

```tsx
type Category = { id: string; name: string };
```

to:

```tsx
type Category = { groupName: string; id: string; name: string };
```

Add the import (alongside the existing `SelectField` import, keeping the alphabetical `@/...` group order):

```tsx
import { CategoryComboboxField } from "@/components/CategoryComboboxField";
```

Add local state to hold categories (so a newly created one is selectable immediately) — in the component body, right after the `useForm` call:

```tsx
  const [categoryOptions, setCategoryOptions] = useState(categories);
```

Add `useState` to the existing `react` import at the top (currently only pulls in nothing from react directly — check the import block and add):

```tsx
import { useState } from "react";
```

Replace the `categoryId` `Controller` block (currently lines 102-114):

```tsx
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => (
          <CategoryComboboxField
            categories={categoryOptions}
            error={errors.categoryId?.message}
            label="Category"
            onCategoriesChange={setCategoryOptions}
            onValueChange={field.onChange}
            value={field.value}
          />
        )}
      />
```

- [ ] **Step 2: Run the type check**

Run: `npx tsc --noEmit`
Expected: errors listing every caller still passing `{ id, name }` categories — that's expected, fixed in the next steps.

- [ ] **Step 3: Update `AddExpenseModal.tsx`**

Change the `Props` type (line 10):

```tsx
type Props = {
  categories: { groupName: string; id: string; name: string }[];
  currentMemberId: string;
  members: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};
```

- [ ] **Step 4: Update `EditExpensePage.tsx`**

Change the `categories` mapping passed to `ExpenseForm` (currently line 28):

```tsx
        categories={categories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }))}
```

- [ ] **Step 5: Update `SidebarNav.tsx`**

Change line 53:

```tsx
type Category = { groupName: string; id: string; name: string };
```

- [ ] **Step 6: Update `BottomNav.tsx`**

Change line 19:

```tsx
type Category = { groupName: string; id: string; name: string };
```

- [ ] **Step 7: Update `layout.tsx`**

Change line 20:

```tsx
  const expenseCategories = categories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }));
```

- [ ] **Step 8: Run the type check and lint**

Run: `npx tsc --noEmit && npx eslint src/modules/expenses/components/ExpenseForm.tsx src/modules/expenses/components/AddExpenseModal.tsx src/modules/expenses/pages/EditExpensePage.tsx src/components/nav/SidebarNav.tsx src/components/nav/BottomNav.tsx "src/app/(app)/layout.tsx"`
Expected: no errors. If `eslint-plugin-perfectionist` flags import/prop ordering, run `npm run lint -- --fix`.

- [ ] **Step 9: Commit**

```bash
git add src/modules/expenses/components/ExpenseForm.tsx src/modules/expenses/components/AddExpenseModal.tsx src/modules/expenses/pages/EditExpensePage.tsx src/components/nav/SidebarNav.tsx src/components/nav/BottomNav.tsx "src/app/(app)/layout.tsx"
git commit -m "feat: use searchable category picker in the single expense form"
```

---

### Task 7: Wire into `BulkExpenseForm` and its callers

**Files:**
- Modify: `src/modules/expenses/components/BulkExpenseForm.tsx`
- Modify: `src/modules/expenses/components/BulkAddExpenseModal.tsx`
- Modify: `src/modules/expenses/components/ExpenseHeader.tsx`
- Modify: `src/modules/expenses/pages/ExpensesPage.tsx`

- [ ] **Step 1: Widen the `Category` type and add local state in `BulkExpenseForm.tsx`**

Change line 19 from:

```tsx
type Category = { id: string; name: string };
```

to:

```tsx
type Category = { groupName: string; id: string; name: string };
```

Add the import:

```tsx
import { CategoryComboboxField } from "@/components/CategoryComboboxField";
```

Add local state right after the `useFieldArray` call (so a category created from any row becomes available to every row without a refetch):

```tsx
  const [categoryOptions, setCategoryOptions] = useState(categories);
```

`useState` needs adding to the existing `react` import at the top of the file (it currently has none from `react` directly — add `import { useState } from "react";` in the third-party import group, alphabetically before `react-hook-form`).

- [ ] **Step 2: Replace the category cell**

Replace the category `Controller`/`Select` block (currently lines 114-136):

```tsx
                <TableCell>
                  <Controller
                    control={control}
                    name={`rows.${index}.categoryId`}
                    render={({ field: f }) => (
                      <CategoryComboboxField
                        categories={categoryOptions}
                        containerClassName="w-full"
                        error={errors.rows?.[index]?.categoryId?.message}
                        label="Category"
                        onCategoriesChange={setCategoryOptions}
                        onValueChange={f.onChange}
                        value={f.value}
                      />
                    )}
                  />
                </TableCell>
```

`CategoryComboboxField` always renders its own `<Label>` — remove the now-redundant `label="Category"` visually duplicating the `<TableHead>Category</TableHead>` column header isn't required by any test, but to avoid two visible "Category" labels stacked in a table cell, add a small style affordance: pass `containerClassName="w-full [&>label]:sr-only"` instead, so the label stays for accessibility but is visually hidden (matching how the other cells have no visible per-row label, only the column header). Use this containerClassName value in the block above instead of `"w-full"`.

- [ ] **Step 3: Update `emptyRow` calls to use the local `categoryOptions` default**

The `defaultCategoryId` (line 53) and the `append(...)` call (line 214) already read from `categories`/`categories[0]?.id` at the props level — leave those as-is; they only set the *initial* row default, which is unaffected by categories created later. No change needed here.

- [ ] **Step 4: Update `BulkAddExpenseModal.tsx`**

Change the `Props` type (line 10):

```tsx
type Props = {
  categories: { groupName: string; id: string; name: string }[];
  currentMemberId: string;
  members: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};
```

- [ ] **Step 5: Update `ExpenseHeader.tsx`**

Change the `Props` type (line 13):

```tsx
type Props = {
  categories: { groupName: string; id: string; name: string }[];
  currentMemberId: string;
  exportRows: ExpenseExportRow[];
  members: { id: string; name: string }[];
  monthLabel: string;
  nextHref: string;
  prevHref: string;
};
```

- [ ] **Step 6: Update `ExpensesPage.tsx`**

Change the `categories` prop passed to `ExpenseHeader` (currently line 111):

```tsx
        categories={categories.map((c) => ({ groupName: c.groupName, id: c.id, name: c.name }))}
```

- [ ] **Step 7: Run the type check and lint**

Run: `npx tsc --noEmit && npx eslint src/modules/expenses/components/BulkExpenseForm.tsx src/modules/expenses/components/BulkAddExpenseModal.tsx src/modules/expenses/components/ExpenseHeader.tsx src/modules/expenses/pages/ExpensesPage.tsx`
Expected: no errors. If `eslint-plugin-perfectionist` flags ordering, run `npm run lint -- --fix`.

- [ ] **Step 8: Commit**

```bash
git add src/modules/expenses/components/BulkExpenseForm.tsx src/modules/expenses/components/BulkAddExpenseModal.tsx src/modules/expenses/components/ExpenseHeader.tsx src/modules/expenses/pages/ExpensesPage.tsx
git commit -m "feat: use searchable category picker in the bulk expense form"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the new `category-search.test.ts`.

- [ ] **Step 2: Run the production build (also re-runs TypeScript)**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Manually verify in the browser**

Use the `run` skill to start the dev server. Check:
- On `/expenses`, click "+ Add Expense" (sidebar or bottom nav): the Category field is a search box. Typing a partial/typo'd word (e.g. "pertrol") narrows results to "Petrol". Typing a name with no match shows "Add '<text>' as new category"; clicking it opens the category modal prefilled, and saving selects the new category back in the form without closing the expense form.
- On `/expenses`, click "Bulk add": each row's Category cell has the same searchable picker, and a category created from one row is immediately selectable in other rows.
- Editing an existing expense (`/expenses/[id]/edit`) shows the current category name in the field on load.
- Keyboard-only flow works: focus the field, type, Arrow Down/Up moves the highlight, Enter selects, Escape closes.

- [ ] **Step 4: Fix any issues found, then re-run Steps 1-2 before considering the task done.**
