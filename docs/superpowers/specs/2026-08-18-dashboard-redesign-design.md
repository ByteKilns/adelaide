# Dashboard & Shell Visual Redesign — Design

Sub-project 1 of 6 in the post-Slice-1 roadmap (visual redesign → month navigation → savings goals → recurring expenses → notifications → safe-to-spend/financial health). This document scopes sub-project 1 only.

## 1. Goal

Restyle the app shell (navigation, header) and the Dashboard page to match a supplied visual reference, using only data the app already has. Lay the groundwork (layout slots, nav entries) for the five sub-projects that follow, without building their functionality yet.

## 2. Out of scope (belongs to later sub-projects)

- Functional month navigation (prev/next arrows that actually change the displayed month) — sub-project 2.
- Savings Goals: data model, CRUD, dashboard widget, dedicated page — sub-project 3.
- Recurring expenses: data model, CRUD, dedicated page — sub-project 4.
- Notifications: generation rules, bell badge count, notification panel, mark-as-read — sub-project 5.
- Safe-to-Spend calculation and Financial Health gauge — sub-project 6.
- Reports page, Categories management page, Settings page — not yet scoped as sub-projects; nav entries exist as disabled placeholders only.

## 3. Shell changes

### 3.1 Sidebar (desktop) / bottom nav (mobile) — unchanged responsive pattern

The existing `SidebarNav` (desktop, `md:flex`) / `BottomNav` (mobile, `md:hidden`) split stays. Only their visual content changes.

**Sidebar** gets:
- App wordmark/logo header ("Couple Budget" + tagline)
- "+ Add Expense" as a full-width pill button (existing behavior, restyled)
- Nav rows with icons (lucide-react): **Home, Expenses, Budget** — active/working links, same as today.
- **Recurring, Savings Goals, Reports, Categories, Notifications, Settings** — rendered as visually-present but disabled nav rows (muted text/icon, a small "Soon" badge, `aria-disabled`, no `href` / non-interactive). Not real routes. When each sub-project ships, its row becomes a real link — no other nav restructuring needed then.
- A "Viewing as" control at the bottom of the sidebar (see §3.3).

**Bottom nav** keeps its current three items (Home, Expenses, Budget) + "+ Add" — mobile screen space doesn't fit the full disabled-item list, and the PRD prioritizes mobile speed over completeness here.

### 3.2 Header (new)

A header bar above the Dashboard's content (and reusable across `/expenses`, `/budget` later if desired, but only required on `/dashboard` for this sub-project):
- Greeting: "Good morning/afternoon/evening, {current member's display name}! 👋" — time-of-day computed from server clock at render time (same server-time assumption already accepted elsewhere in the app).
- Subtitle: "Here's your financial overview for {Month Year}" — static text showing the current month; no prev/next controls yet (sub-project 2 adds those in the same location).
- Notification bell icon: disabled/muted, no badge (no real notification count exists yet — showing a number would be fabricated data).
- Avatar: initials-based circle (first letter of the member's display name), no photo upload feature exists.

### 3.3 "Viewing as" switcher

A small control (e.g. a dropdown or two-button toggle) showing "Viewing as: {Me | Partner's name}", defaulting to the logged-in member.

- **Storage**: a cookie (`viewing-as-member-id`) set via a Server Action (consistent with the rest of the app's Server-Actions-first architecture — no client-only cookie writes), which validates server-side that the chosen id is actually a member of the caller's household before setting it (same validation pattern used elsewhere, e.g. `assertMemberInHousehold`).
- **Effect**: wherever the app currently computes "Me" vs the partner's name for display (Dashboard's Me/Partner/Shared tabs default label, `ExpenseForm`'s owner/paid-by default), it uses the "viewing as" member id instead of the raw session member id, when the cookie is present and valid.
- **Non-effect**: this is presentation-only. It does not change what data is fetched (still the same household, both members' data is already visible to both logged-in users) and does not change authentication or `getCurrentMember()`'s underlying session resolution — server actions continue to derive `householdId` from the real session, not from the "viewing as" cookie, so there is no security implication.

## 4. Dashboard body changes

### 4.1 Summary cards

Four cards instead of three:
1. **Combined Income** — existing calculation, restyled with an icon and a trend line: "↑X% vs last month" (or "↓X%"), computed by additionally fetching last month's income via the existing `getIncomesForMonth(year, month)` called with the previous month. If last month's income is 0, omit the trend line (avoid a nonsensical "∞%").
2. **Total Expenses** — existing calculation, same trend-line treatment using `listExpensesForMonth` for the previous month.
3. **Total Savings** — **placeholder card**: shows "Coming soon" instead of a number, no progress bar. Replaced with real data in sub-project 3.
4. **Unallocated** — existing calculation, restyled with icon, no trend line (not meaningful month-over-month in the same way).

### 4.2 Owner tabs

Restyle `OwnerTabs` to an underlined-tab look matching the reference. Scope stays as today (income/expenses/remaining per tab) — not re-architecting the page to be tab-scoped.

### 4.3 Budget Overview cards

Restyle existing `BudgetCard` grid:
- Add a category icon, mapped from the category's `groupName` (Family→Users, Obligations→Landmark, Household→ShoppingCart, Transportation→Car, Lifestyle→Heart, Personal→User, Financial→PiggyBank, Other→MoreHorizontal — lucide-react icons; fallback icon for unmapped groups).
- Keep owner label, "actual / planned" amount, percent, colored progress bar, status badge (existing logic, unchanged).
- Add a "View all budgets" link to `/budget`.
- Grid shows all rows returned (no carousel/pagination — the reference's arrow-to-scroll behavior is presentation polish not required for V1; a responsive grid that wraps is sufficient).

### 4.4 Budget vs Actual table

Add a colored status pill column (same three-tier thresholds already used by `BudgetCard`: Healthy / Approaching limit / Over budget), replacing the plain-text +/- difference as the primary visual signal (the numeric difference stays, styled as a secondary column).

### 4.5 Recent Expenses panel (new)

New component + data fetch: last 5 expenses for the household (any month — most recent by date/createdAt, not month-filtered, since "recent" should show real recent activity even near a month boundary), each row showing a category icon, category name, owner label, amount, and a relative date label ("Today" / "Yesterday" / `MMM D` otherwise). "View all" link to `/expenses`.

### 4.6 Placeholder cards for future sub-projects

- **Financial Health / Safe-to-Spend**: a card in the reference's layout position, showing "Coming soon" — no gauge, no calculation. Built in sub-project 6.
- **Savings Goals panel**: a card in the reference's layout position, showing "Coming soon" — no goals list, no "New Goal" button (button would have nowhere to go yet). Built in sub-project 3.
- **Notifications panel**: omitted entirely from the dashboard body (not even a placeholder) — the header's disabled bell already signals "not yet available" without adding a second empty panel to the page.

## 5. Data/logic additions required

- Previous-month income/expense totals fetch for the two trend lines (§4.1) — reuses existing `getIncomesForMonth`/`listExpensesForMonth` with `month - 1` (handling January → December of the previous year).
- A `mostRecentExpenses(limit)` data function (or extend `listExpensesForMonth`'s pattern) — not month-filtered, ordered by date/createdAt descending, capped at 5.
- A category-group → icon mapping (pure lookup, lives alongside the `BudgetCard`/new `CategoryIcon` component).
- "Viewing as" cookie read/write: a server action to set it (validating household membership), and a helper to resolve the "effective member id" (viewing-as if present and valid, else the real session member id) for use in the Dashboard and `ExpenseForm`.

## 6. Explicitly not changed

- No changes to any server action's data-isolation logic (household scoping stays keyed off the real session, not the viewing-as cookie).
- No changes to the `/budget` or `/expenses` page layouts beyond whatever shared nav/header components they already use — this sub-project targets `/dashboard` and the shell only, unless a trivial shared-component change is unavoidable (e.g. if the header component is extracted for reuse, `/budget`/`/expenses` may pick up the shell's new look "for free," but no new content is added to those pages).
