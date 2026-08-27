# Searchable, fuzzy-matching category picker for expense recording

## Problem

The category picker in expense recording is a plain `<Select>` dropdown —
users scroll/scan a flat list of ~20-30 category names to find the right
one, and there's no way to create a missing category without leaving the
form. The user wants to type a word, see the closest-matching categories
(typo-tolerant, not just exact substring), and if nothing fits, add a new
category inline without losing their place in the expense form.

## Scope decisions (from brainstorming)

- Household category lists are small (seed data ships 23; expected range
  is roughly 10-40). At this scale, an LLM or embeddings-based semantic
  search is unjustified infrastructure/cost/latency for zero existing LLM
  integration in the app. Local fuzzy string matching is sufficient and
  is the chosen approach — no new API dependency, no per-keystroke network
  call, instant results.
- Applies to **both** `ExpenseForm.tsx` (single expense) and
  `BulkExpenseForm.tsx` (per-row picker in the bulk table).
- "Add as new category" opens the existing `CategoryFormModal` prefilled
  with the typed text as the name, rather than a quick-add-with-defaults
  shortcut — keeps every category properly classified into a Group and
  Fixed/Flexible at creation time, same as creating one from the
  Categories page.
- No changes to `category.schema.ts` / `expenses.ts` schema — this is a
  picker UX change only.

## New component

`src/components/CategoryComboboxField.tsx` — the category-picker
counterpart to `SelectField`, used in place of `SelectField`/`Select` for
the `categoryId` field in both forms.

```ts
type Props = {
  categories: { id: string; name: string; groupName: string }[];
  error?: string;
  label: string;
  onCategoryCreated?: (category: { id: string; name: string; groupName: string }) => void;
  onValueChange: (value: string) => void;
  value: string;
};
```

- Built on `radix-ui`'s `Popover` (already a dependency) wrapping a text
  `Input` (search box) and a results list — no new UI-primitive package.
- Renders the selected category's name in the input when closed, same
  visual contract as `SelectField`.
- Popover content renders in a portal (Radix default) so it isn't clipped
  by `BulkExpenseForm`'s table `overflow`.
- Full keyboard support: Arrow Up/Down to move through results, Enter to
  select the highlighted one, Escape to close — required, not optional,
  since the `Select` it replaces already supports this.
- Internally manages `query` and `open` state; stays a controlled field
  via `value`/`onValueChange` so `Controller` wiring in both forms is
  unchanged apart from swapping the field component.

## Matching logic

New dependency: `fuse.js` (~12KB, zero-dep) — purpose-built fuzzy matching,
cheaper and more correct than hand-rolling typo-tolerant scoring for what
is still a real (if short) list.

`src/components/lib/category-search.ts`:

```ts
export type CategoryMatchInput = { groupName: string; id: string; name: string };

// Fuse instance keyed on name (weight 1) and groupName (weight 0.3, so a
// query like "food" can surface Household/Groceries via group context).
// threshold ~0.4, ignoreLocation: true (so "grocery" matches "Groceries"
// regardless of where in the string the match falls).
export function searchCategories<T extends CategoryMatchInput>(categories: T[], query: string): T[];

// True when `query` case-insensitively equals an existing category's
// name exactly — used to auto-highlight that result as the Enter target
// and to suppress the "Add as new category" row.
export function hasExactMatch<T extends CategoryMatchInput>(categories: T[], query: string): boolean;
```

- Empty query returns the full category list, unsorted (matches current
  dropdown behavior).
- Non-empty query returns Fuse's ranked results.
- Results list always ends with `+ Add "<query>" as new category` unless
  `hasExactMatch` is true for the current query.

## Add-new-category flow

1. User types a name with no exact match and clicks
   `+ Add "<query>" as new category`.
2. `CategoryComboboxField` opens `CategoryFormModal` with `category={null}`
   but the name field prefilled to the current query. `CategoryFormModal`
   gains a `defaultName?: string` prop (falls into its existing `EMPTY`
   default-values object) — no other changes to that modal's fields or
   validation.
3. `CategoryFormModal` gains an optional `onCreated?: (category: { id, name, groupName }) => void`
   callback, fired after a successful create (not on update).
4. `createCategoryAction` changes its `insert` call to `.returning()` the
   inserted row, so the modal has the new category's `id`/`name`/`groupName`
   to hand back.
5. `CategoryComboboxField`'s `onCreated` handler calls `onValueChange(newCategory.id)`
   and closes the popover. The parent form's `categories` prop is stale
   until the page re-renders (Next `revalidatePath` already covers this
   for the next navigation), so `CategoryComboboxField` also merges the
   newly created category into its local results list immediately so it
   displays correctly without a refetch.

## Edge cases

- Household with zero categories: results list shows only the "Add as new
  category" row.
- `BulkExpenseForm`: each row gets its own `CategoryComboboxField`
  instance/popover; selecting or creating in one row doesn't affect
  others. A category created from one row is available (via the same
  local-merge mechanism, lifted to the form's category list) to every
  other row without a page refresh.

## Testing

- Unit tests for `category-search.ts` (`searchCategories`,
  `hasExactMatch`): exact match ranking, typo tolerance (e.g. "pertrol" →
  "Petrol"), group-name contribution to ranking, empty query returns all,
  no categories returns empty.
- No e2e/integration test infra exists in this repo (`vitest run` unit
  tests only) — combobox interaction (keyboard nav, popover
  open/close, add-new flow) is manually verified in the browser, same as
  `ExpenseForm` is today.
