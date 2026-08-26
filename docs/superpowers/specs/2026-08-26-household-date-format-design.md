# Household date format (Phase A of BS-native month periods)

## Problem

`dateFormat` (BS/Nepali vs AD/English) is currently a per-browser cookie
(`src/lib/date-format-cookie.ts`), read by ~11 pages/actions purely for
*display* formatting. The user wants month-scoped views (Budget, Home,
Expenses, Reports, Recurring, Notifications) to track real calendar
periods — BS months when Nepali is selected, AD months when English is
selected (Phase B, separate spec). That means `dateFormat` stops being a
cosmetic preference and starts determining actual period boundaries for
shared household data (budgets, incomes). A per-browser cookie can't be
the source of truth for that: two household members (or one person on two
devices) with different cookie values would compute different month
boundaries for the same underlying `monthlyBudgets`/`incomes` rows —
silently editing/viewing different records while believing they're
looking at "this month."

## Scope decision (from brainstorming)

Move `dateFormat` from a per-browser cookie to a column on the
`households` table — a single shared value per household. Accent color
and theme stay as personal per-browser cookies (purely cosmetic, no data
correctness implication). This is Phase A only: it does not yet change
what a "month" means anywhere — that's Phase B, built on top of this.

## Data model

`src/db/schema/households.ts`:

```ts
export const dateFormatEnum = pgEnum("date_format", ["nepali", "english"]);

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  dateFormat: dateFormatEnum("date_format").notNull().default("nepali"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Default `"nepali"` matches the app's current `DEFAULT_DATE_FORMAT`
fallback, so existing households get the same behavior they have today
until someone changes it in Settings.

## Core module signature change (no file rename)

`src/lib/date-format-cookie.ts` keeps its path — 40 files import `type
DateFormat` from it for prop typing alone and don't care how the value is
sourced; renaming the file would mean touching all 40 for zero functional
benefit. Only the 11 call sites that actually *call*
`getDateFormatPref()` change (listed below). The file keeps
`DateFormat`, `DATE_FORMATS`, `isDateFormat`, `DEFAULT_DATE_FORMAT`
(still useful as the schema-level default and as a fallback). Drops
`DATE_FORMAT_COOKIE_NAME` (no longer a cookie — confirmed only used in
this file and `settings.actions.ts`, both already being changed) and
changes:

```ts
// before
export async function getDateFormatPref(): Promise<DateFormat>

// after
export async function getDateFormatPref(householdId: string): Promise<DateFormat>
```

Implementation queries `households.dateFormat` by `householdId` instead
of reading a cookie — same shape as every other per-household data fetch
in this app (`listCategories(householdId)`, `listDhukus(householdId)`,
etc.), not a new pattern.

## Call site changes (mechanical)

All current call sites already resolve `householdId` (via
`getCurrentMember()`/`getEffectiveMember()`) before calling
`getDateFormatPref()`, so this is threading an already-available variable
through, not restructuring control flow, in:

- `src/modules/dashboard/index.tsx`
- `src/modules/notifications/api/notifications.actions.ts` (multiple
  functions — `checkBudgetReminder`, `syncDueSoonNotifications`,
  `syncLoanInstallmentsDueSoonNotifications`, `syncDhukuDueSoonNotifications`
  — all already take `householdId` as a parameter)
- `src/modules/expenses/pages/ExpensesPage.tsx`
- `src/modules/budget/pages/BudgetPage.tsx`
- `src/modules/notifications/pages/NotificationsPage.tsx`
- `src/modules/dhuku/pages/DhukuPage.tsx`
- `src/modules/savings-goals/pages/SavingsGoalsPage.tsx`
- `src/modules/reports/pages/ReportsPage.tsx`
- `src/modules/loans/pages/LoansPage.tsx`
- `src/modules/recurring/pages/RecurringPage.tsx`
- `src/modules/settings/pages/SettingsPage.tsx`

## Settings write path

`src/modules/settings/api/settings.actions.ts`'s `setDateFormatAction`
changes from a `cookies().set(...)` call to a DB update:

```ts
export async function setDateFormatAction(format: string) {
  if (!isDateFormat(format)) throw new Error("Invalid date format");
  const { householdId } = await getCurrentMember();
  await db.update(households).set({ dateFormat: format }).where(eq(households.id, householdId));
  revalidatePath("/", "layout");
}
```

`DateFormatSection.tsx` (the Settings page toggle UI) is unchanged — same
props (`initialFormat`), same behavior from the user's perspective. Only
what's behind it changes: the value now applies to the whole household,
not just the browser that clicked it.

## Non-goals

- No change to what a "month" means anywhere yet — Phase B.
- No change to accent color or theme (stay per-browser cookies).
- No migration of existing per-browser cookie values into the household
  row — households simply start at the `"nepali"` default and the user
  re-confirms their preference in Settings if needed (a one-click fix,
  not worth building migration logic for).

## Testing

No dedicated unit tests — this is DB-column plumbing with no new
calculation logic (matches the existing convention: `loans.actions.ts`,
`dhuku.actions.ts`, and other thin CRUD/action layers in this codebase
have no dedicated test files; only calculation libs do). Verified via
`tsc --noEmit` + `npm run build` + manual check that the Settings toggle
persists and every page still renders with the correct format.
