# Dashboard & Shell Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app shell (sidebar/bottom nav, header) and the Dashboard page to match the supplied visual reference, add a "viewing as" perspective switcher, and lay out (but not implement) placeholder slots for the five sub-projects that follow, per `docs/superpowers/specs/2026-08-18-dashboard-redesign-design.md`.

**Architecture:** Purely additive/restyling changes to existing Server Components and a few new small Client Components (nav, switcher). The "viewing as" feature is a single httpOnly cookie, set via a Server Action that validates household membership, read by a new `getEffectiveMember()` helper alongside the existing `getCurrentMember()` — no changes to authentication or to how any server action derives `householdId` (still always the real session). Shared visual logic (budget status thresholds, category icons, relative dates) is extracted into small pure-function modules so `BudgetCard` and `BudgetVsActualTable` don't each hand-roll the same thresholds a third time.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, lucide-react (already a dependency).

---

## File Structure

```
src/lib/category-icons.tsx       # groupName -> lucide icon lookup
src/lib/budget-status.ts         # shared planned/actual -> status+variant+pct logic
src/lib/format-date.ts           # "Today"/"Yesterday"/"Mon D" relative date formatter
src/lib/viewing-as-cookie.ts     # shared cookie name constant
src/lib/session.ts               # MODIFY: add getEffectiveMember()
src/lib/actions/viewing-as.ts    # NEW: setViewingAsAction server action
src/lib/actions/expenses.ts      # MODIFY: add listRecentExpenses(limit)

src/components/nav/sidebar-nav.tsx        # MODIFY: icons, disabled items, viewing-as slot
src/components/nav/bottom-nav.tsx         # MODIFY: icons, visual polish only
src/components/nav/viewing-as-switcher.tsx # NEW: client Select calling the server action

src/components/dashboard/dashboard-header.tsx  # NEW: greeting/subtitle/bell/avatar
src/components/dashboard/summary-cards.tsx     # MODIFY: 4 cards, icons, trend lines
src/components/dashboard/owner-tabs.tsx        # MODIFY: visual restyle only
src/components/dashboard/coming-soon-card.tsx  # NEW: reusable placeholder card

src/components/budget/budget-card.tsx          # MODIFY: icon prop, shared status helper
src/components/budget/budget-vs-actual-table.tsx # MODIFY: status column, shared helper

src/components/expenses/recent-expenses.tsx    # NEW: dashboard "Recent Expenses" panel

src/app/(app)/layout.tsx              # MODIFY: async, fetches members + effective member
src/app/(app)/dashboard/page.tsx      # MODIFY: full rewrite wiring the above together
src/app/(app)/expenses/new/page.tsx   # MODIFY: use getEffectiveMember()
src/app/(app)/expenses/[id]/edit/page.tsx # MODIFY: use getEffectiveMember()
```

---

## Task 1: Shared visual-logic utilities

**Files:**
- Create: `src/lib/category-icons.tsx`, `src/lib/budget-status.ts`, `src/lib/format-date.ts`

- [ ] **Step 1: Category icon lookup**

Create `src/lib/category-icons.tsx`:
```tsx
import {
  Users,
  Landmark,
  ShoppingCart,
  Car,
  Heart,
  User,
  PiggyBank,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Family: Users,
  Obligations: Landmark,
  Household: ShoppingCart,
  Transportation: Car,
  Lifestyle: Heart,
  Personal: User,
  Financial: PiggyBank,
  Other: MoreHorizontal,
};

export function getCategoryIcon(groupName: string): LucideIcon {
  return GROUP_ICONS[groupName] ?? MoreHorizontal;
}
```

- [ ] **Step 2: Shared budget status helper**

Create `src/lib/budget-status.ts`:
```ts
export type BudgetStatusVariant = "default" | "secondary" | "destructive";

export type BudgetStatus = {
  label: string;
  variant: BudgetStatusVariant;
  pct: number;
};

// Shared by BudgetCard and BudgetVsActualTable so the two views can never
// disagree on what counts as "over budget" vs "approaching limit."
export function computeBudgetStatus(planned: number, actual: number): BudgetStatus {
  // planned can be 0 for a category with untracked/uncovered spend (no
  // budget item set for it this month). Any actual spend against a 0-planned
  // category is unambiguously over budget, so treat it as >=100% rather than
  // letting the plain division guard collapse it to 0% ("On track").
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : actual > 0 ? 100 : 0;
  if (pct >= 100) return { label: "Over budget", variant: "destructive", pct };
  if (pct >= 80) return { label: "Approaching limit", variant: "secondary", pct };
  return { label: "On track", variant: "default", pct };
}
```

- [ ] **Step 3: Relative date formatter**

Create `src/lib/format-date.ts`:
```ts
// `dateStr` is a "YYYY-MM-DD" string from a Postgres `date` column. Parsing
// it via `new Date("YYYY-MM-DD")` treats it as UTC midnight, which can land
// on the wrong local day when compared against "today" — so this parses the
// parts manually into a local-time Date instead.
export function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
```

- [ ] **Step 4: Verify**

Run `npx tsc --noEmit` — expect no errors (these are standalone modules with no callers yet).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared category icon, budget status, and date formatting utilities"
```

---

## Task 2: "Viewing as" backend (cookie + effective-member resolution)

**Files:**
- Create: `src/lib/viewing-as-cookie.ts`, `src/lib/actions/viewing-as.ts`
- Modify: `src/lib/session.ts`

- [ ] **Step 1: Shared cookie name constant**

Create `src/lib/viewing-as-cookie.ts`:
```ts
// Shared between src/lib/session.ts (reads it) and
// src/lib/actions/viewing-as.ts (writes it) so the name can't drift.
export const VIEWING_AS_COOKIE_NAME = "viewing-as-member-id";
```

- [ ] **Step 2: Add `getEffectiveMember()` to session.ts**

Modify `src/lib/session.ts` — add the import and new function (keep everything else in the file unchanged):
```ts
import { cookies } from "next/headers";
import { VIEWING_AS_COOKIE_NAME } from "@/lib/viewing-as-cookie";
```
Append at the end of the file:
```ts
// Resolves the member whose *perspective* the UI should render from: the
// "viewing as" cookie if it's set to a valid member of the caller's own
// household, otherwise the real logged-in member. This is presentation-only
// — it never changes which household's data is fetched, and it must never
// be used in place of getCurrentMember() when deriving householdId for a
// write (server actions continue to call getCurrentMember() directly for
// that, so a forged/stale cookie can't affect data isolation).
export async function getEffectiveMember(): Promise<CurrentMember> {
  const current = await getCurrentMember();
  const cookieStore = await cookies();
  const viewingAsId = cookieStore.get(VIEWING_AS_COOKIE_NAME)?.value;

  if (!viewingAsId || viewingAsId === current.memberId) {
    return current;
  }

  const members = await getHouseholdMembers(current.householdId);
  const target = members.find((m) => m.id === viewingAsId);
  if (!target) {
    // Stale/forged cookie value (e.g. a removed member) — fall back to the
    // real session rather than throwing.
    return current;
  }

  return {
    memberId: target.id,
    householdId: current.householdId,
    userId: target.userId,
    name: target.user.name,
  };
}
```

- [ ] **Step 3: Write the server action**

Create `src/lib/actions/viewing-as.ts`:
```ts
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { VIEWING_AS_COOKIE_NAME } from "@/lib/viewing-as-cookie";

export async function setViewingAsAction(memberId: string) {
  const { householdId, memberId: realMemberId } = await getCurrentMember();
  const cookieStore = await cookies();

  if (memberId === realMemberId) {
    cookieStore.delete(VIEWING_AS_COOKIE_NAME);
    revalidatePath("/", "layout");
    return;
  }

  const members = await getHouseholdMembers(householdId);
  if (!members.some((m) => m.id === memberId)) {
    throw new Error("Member does not belong to this household");
  }

  cookieStore.set(VIEWING_AS_COOKIE_NAME, memberId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
}
```

- [ ] **Step 4: Verify against the real database**

Since `getEffectiveMember()`/`setViewingAsAction` need a real Next.js request context (cookies, session) — not runnable via plain tsx — verify via the established real-login + curl pattern:
1. `npx tsc --noEmit` — no errors.
2. Start `npm run dev`, log in via the real NextAuth Credentials flow (seeded `SEED_USER1_EMAIL`/`SEED_USER1_PASSWORD` from `.env.local`, never printed) to get a real session cookie.
3. There's no route wired to `setViewingAsAction` yet (that's Task 3), so verify this task's logic with a throwaway temporary route handler at `src/app/api/tmp-viewing-as-check/route.ts` (deleted before committing — **do not** prefix the folder name with `_`; Next.js treats underscore-prefixed route segments as private and excludes them from routing entirely, which has bitten a prior task in this project's history) that calls `setViewingAsAction` with a query-string member id and returns the result of a subsequent `getEffectiveMember()` call as JSON. Confirm: setting it to the partner's real member id switches `getEffectiveMember()`'s returned name/memberId; setting it back to the real member id (or an invalid/foreign id) falls back to the real session's member; a member id from a different household is rejected with the "does not belong to this household" error (create a throwaway second household+member for this check, clean up fully afterward).
4. Delete the throwaway route before committing. Kill any dev server process by its specific PID.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add viewing-as cookie and effective-member resolution"
```

---

## Task 3: Sidebar nav redesign + viewing-as switcher

**Files:**
- Create: `src/components/nav/viewing-as-switcher.tsx`
- Modify: `src/components/nav/sidebar-nav.tsx`, `src/app/(app)/layout.tsx`

- [ ] **Step 1: Write the viewing-as switcher**

Create `src/components/nav/viewing-as-switcher.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setViewingAsAction } from "@/lib/actions/viewing-as";

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  realMemberId: string;
  viewingAsMemberId: string;
};

export function ViewingAsSwitcher({ members, realMemberId, viewingAsMemberId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Viewing as</p>
      <Select
        value={viewingAsMemberId}
        disabled={pending}
        onValueChange={(value) =>
          startTransition(async () => {
            try {
              await setViewingAsAction(value);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to switch view");
            }
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.id === realMemberId ? "Me" : m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the sidebar**

Replace the full contents of `src/components/nav/sidebar-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Wallet,
  Repeat,
  PiggyBank,
  BarChart3,
  Tags,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewingAsSwitcher } from "./viewing-as-switcher";

type NavItem = { href: string; label: string; icon: LucideIcon; enabled: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, enabled: true },
  { href: "/expenses", label: "Expenses", icon: Receipt, enabled: true },
  { href: "/budget", label: "Budget", icon: Wallet, enabled: true },
  { href: "/recurring", label: "Recurring", icon: Repeat, enabled: false },
  { href: "/savings-goals", label: "Savings Goals", icon: PiggyBank, enabled: false },
  { href: "/reports", label: "Reports", icon: BarChart3, enabled: false },
  { href: "/categories", label: "Categories", icon: Tags, enabled: false },
  { href: "/notifications", label: "Notifications", icon: Bell, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: false },
];

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  realMemberId: string;
  viewingAsMemberId: string;
};

export function SidebarNav({ members, realMemberId, viewingAsMemberId }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r p-4 md:flex">
      <div className="mb-6">
        <p className="text-lg font-semibold">Couple Budget</p>
        <p className="text-xs text-muted-foreground">Plan together, grow together</p>
      </div>

      <Button asChild className="mb-4 rounded-full">
        <Link href="/expenses/new">+ Add Expense</Link>
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (!item.enabled) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                className="flex items-center justify-between rounded px-3 py-2 text-sm text-muted-foreground/50"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Soon
                </Badge>
              </div>
            );
          }
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm",
                active ? "bg-accent font-semibold" : "text-muted-foreground hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t pt-4">
        <ViewingAsSwitcher
          members={members}
          realMemberId={realMemberId}
          viewingAsMemberId={viewingAsMemberId}
        />
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Wire the layout to fetch and pass the new props**

Replace the full contents of `src/app/(app)/layout.tsx`:
```tsx
import { BottomNav } from "@/components/nav/bottom-nav";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { getCurrentMember, getHouseholdMembers, getEffectiveMember } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { householdId, memberId: realMemberId } = await getCurrentMember();
  const [members, effective] = await Promise.all([
    getHouseholdMembers(householdId),
    getEffectiveMember(),
  ]);

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        members={members.map((m) => ({ id: m.id, name: m.user.name }))}
        realMemberId={realMemberId}
        viewingAsMemberId={effective.memberId}
      />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

1. `npx tsc --noEmit` and `npm run build` — both succeed.
2. Real-login + curl: fetch any protected page (e.g. `/budget`), confirm 200 and that the response HTML contains "Couple Budget", the three working nav links, the six "Soon"-badged disabled items, and a `<select>`-backed viewing-as control reflecting the two seeded members' names (one shown as "Me").
3. Since the Select's `onValueChange` is a client-side interaction untestable via curl, confirm correctness by re-reading the component code: verify the switcher calls `setViewingAsAction` (already verified working in Task 2) and that switching should cause `revalidatePath("/", "layout")` to re-render the layout with the new `viewingAsMemberId` — trust this via code inspection since Task 2 already proved the underlying action + `getEffectiveMember()` combination works.
4. Kill any dev server by specific PID.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: redesign sidebar nav with icons, disabled placeholders, and viewing-as switcher"
```

---

## Task 4: Bottom nav visual polish

**Files:**
- Modify: `src/components/nav/bottom-nav.tsx`

- [ ] **Step 1: Rewrite with icons**

Replace the full contents of `src/components/nav/bottom-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
              active ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/expenses/new"
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold text-primary"
      >
        <Plus className="h-5 w-5" />
        Add
      </Link>
    </nav>
  );
}
```

This component has no new logic (same nav items, same active-state check as before) — no functional re-verification needed beyond the type/build check.

- [ ] **Step 2: Verify**

`npx tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style: add icons to bottom nav"
```

---

## Task 5: Dashboard header component

**Files:**
- Create: `src/components/dashboard/dashboard-header.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/dashboard/dashboard-header.tsx`:
```tsx
import { Bell } from "lucide-react";

type Props = { name: string; monthLabel: string };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ name, monthLabel }: Props) {
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {getGreeting()}, {name}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your financial overview for {monthLabel}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Notifications (coming soon)"
          className="rounded-full border p-2 text-muted-foreground/50"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </div>
      </div>
    </div>
  );
}
```

This is a pure presentational component with no data fetching — `getGreeting()` reads the server's clock at render time, same server-time assumption already accepted elsewhere in the codebase (e.g. `listExpensesForMonth`'s "current month" default).

- [ ] **Step 2: Verify**

`npx tsc --noEmit` — no errors (not wired into the page yet; that's Task 10).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add dashboard header component"
```

---

## Task 6: Summary cards redesign

**Files:**
- Modify: `src/components/dashboard/summary-cards.tsx`

- [ ] **Step 1: Rewrite with 4 cards, icons, and trend lines**

Replace the full contents of `src/components/dashboard/summary-cards.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Receipt, PiggyBank, Coins, ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  combinedIncome: number;
  totalExpenses: number;
  unallocated: number;
  incomeTrendPct: number | null;
  expenseTrendPct: number | null;
};

function TrendLine({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  const colorClass = pct >= 0 ? "text-green-600" : "text-red-600";
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}% vs last month
    </p>
  );
}

export function SummaryCards({
  combinedIncome,
  totalExpenses,
  unallocated,
  incomeTrendPct,
  expenseTrendPct,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Combined Income
          </CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {combinedIncome.toLocaleString()}</p>
          <TrendLine pct={incomeTrendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total Expenses
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {totalExpenses.toLocaleString()}</p>
          <TrendLine pct={expenseTrendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total Savings
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Unallocated
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">NPR {unallocated.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

Note: this changes the component's prop shape (adds `incomeTrendPct`/`expenseTrendPct`, both required). The one current caller (`src/app/(app)/dashboard/page.tsx`) is rewritten in Task 10 to supply them — until then, `tsc` will correctly report a type error at that call site. That's expected and fine for this task; don't fix the caller here.

- [ ] **Step 2: Verify**

Run `npx tsc --noEmit` — expect exactly one error, at `src/app/(app)/dashboard/page.tsx`'s `<SummaryCards {...summary} />` call, for the two missing required props. Confirm the error is ONLY there (no errors inside `summary-cards.tsx` itself) — that isolates the change to this file as intended.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: redesign summary cards with icons, trend lines, and a savings placeholder"
```

---

## Task 7: Owner tabs restyle

**Files:**
- Modify: `src/components/dashboard/owner-tabs.tsx`

- [ ] **Step 1: Restyle (no prop/logic changes)**

Replace the full contents of `src/components/dashboard/owner-tabs.tsx`:
```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OwnerView = { key: string; label: string; income: number; expenses: number; remaining: number };

export function OwnerTabs({ views }: { views: OwnerView[] }) {
  return (
    <Tabs defaultValue={views[0]?.key}>
      <TabsList className="w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
        {views.map((v) => (
          <TabsTrigger
            key={v.key}
            value={v.key}
            className="rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {views.map((v) => (
        <TabsContent key={v.key} value={v.key} className="space-y-2 pt-4">
          {v.income > 0 && <p>Income: NPR {v.income.toLocaleString()}</p>}
          <p>Expenses: NPR {v.expenses.toLocaleString()}</p>
          <p>Remaining: NPR {v.remaining.toLocaleString()}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

This is a visual-only change — the `OwnerView` type and the component's prop contract are unchanged, so the existing caller in `dashboard/page.tsx` keeps working without modification.

- [ ] **Step 2: Verify**

`npx tsc --noEmit` — no new errors introduced by this file (the one pre-existing error from Task 6 is still expected and unrelated).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style: restyle owner tabs to an underlined-tab look"
```

---

## Task 8: Budget card + budget-vs-actual table restyle

**Files:**
- Modify: `src/components/budget/budget-card.tsx`, `src/components/budget/budget-vs-actual-table.tsx`

- [ ] **Step 1: Rewrite `BudgetCard` to use the shared status helper and accept an icon**

Replace the full contents of `src/components/budget/budget-card.tsx`:
```tsx
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { computeBudgetStatus } from "@/lib/budget-status";
import type { LucideIcon } from "lucide-react";

type Props = { categoryName: string; planned: number; actual: number; icon: LucideIcon };

export function BudgetCard({ categoryName, planned, actual, icon: Icon }: Props) {
  const status = computeBudgetStatus(planned, actual);
  const remaining = planned - actual;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {categoryName}
        </span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        NPR {actual.toLocaleString()} / NPR {planned.toLocaleString()}
      </p>
      <Progress value={Math.min(status.pct, 100)} />
      <p className="text-sm text-muted-foreground">
        {remaining >= 0
          ? `NPR ${remaining.toLocaleString()} remaining`
          : `NPR ${Math.abs(remaining).toLocaleString()} over`}
      </p>
    </div>
  );
}
```

Note: `icon` is now a required prop, and the "Healthy" label from before is now "On track" (via `computeBudgetStatus`, matching the visual reference's wording). The existing caller in `dashboard/page.tsx` is updated in Task 10.

- [ ] **Step 2: Rewrite `BudgetVsActualTable` to add a status column using the same helper**

Replace the full contents of `src/components/budget/budget-vs-actual-table.tsx`:
```tsx
import { Badge } from "@/components/ui/badge";
import { computeBudgetStatus } from "@/lib/budget-status";

// `categoryId` is combined with `ownerMemberId` (defaulting to "shared" when
// null) to form the React key below. A category can have more than one
// budget-item row per month — one per owner (e.g. "Groceries" owned by each
// member plus a separate shared "Groceries" line), all sharing the same
// categoryName — so categoryName alone is not a unique key here.
type Row = {
  categoryId: string;
  ownerMemberId: string | null;
  categoryName: string;
  planned: number;
  actual: number;
  difference: number;
};

export function BudgetVsActualTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Category</th>
            <th className="py-2 text-right">Budget</th>
            <th className="py-2 text-right">Actual</th>
            <th className="py-2 text-right">Difference</th>
            <th className="py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = computeBudgetStatus(r.planned, r.actual);
            return (
              <tr key={`${r.categoryId}-${r.ownerMemberId ?? "shared"}`} className="border-b">
                <td className="py-2">{r.categoryName}</td>
                <td className="py-2 text-right">{r.planned.toLocaleString()}</td>
                <td className="py-2 text-right">{r.actual.toLocaleString()}</td>
                <td
                  className={`py-2 text-right ${r.difference < 0 ? "text-red-600" : "text-green-700"}`}
                >
                  {r.difference >= 0 ? "+" : ""}
                  {r.difference.toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

The `Row` type and the component's prop contract are unchanged (still takes pre-resolved `categoryName`/`planned`/`actual`/`difference`), so this is additive from the caller's point of view (the caller doesn't need to pass anything new — the status is derived internally).

- [ ] **Step 2: Verify**

`npx tsc --noEmit` — expect the same single pre-existing error from Task 6 (dashboard page missing new `SummaryCards` props) plus a new error at `dashboard/page.tsx`'s `<BudgetCard ... />` calls (missing the new required `icon` prop). No errors should originate from inside `budget-card.tsx` or `budget-vs-actual-table.tsx` themselves.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add category icons and status column to budget card and table, unify status logic"
```

---

## Task 9: Recent Expenses panel

**Files:**
- Create: `src/components/expenses/recent-expenses.tsx`
- Modify: `src/lib/actions/expenses.ts` (add `listRecentExpenses`)

- [ ] **Step 1: Add the data function**

Modify `src/lib/actions/expenses.ts` — add this export after `listExpensesForMonth` (keep everything else in the file unchanged):
```ts
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
No new imports needed — `db`, `expenses`, `eq`, `desc`, and `getCurrentMember` are already imported in this file.

- [ ] **Step 2: Write the panel component**

Create `src/components/expenses/recent-expenses.tsx`:
```tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatRelativeDate } from "@/lib/format-date";

type Row = {
  id: string;
  categoryName: string;
  categoryGroupName: string;
  ownerLabel: string;
  amount: number;
  date: string;
};

export function RecentExpenses({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Recent Expenses</CardTitle>
        <Link href="/expenses" className="text-sm text-primary underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
        )}
        {rows.map((r) => {
          const Icon = getCategoryIcon(r.categoryGroupName);
          return (
            <div key={r.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{r.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.ownerLabel} · {formatRelativeDate(r.date)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold">-NPR {r.amount.toLocaleString()}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify `listRecentExpenses` against real data**

Use the established real-login + curl technique isn't directly applicable here since this function isn't wired to a page yet (Task 10 does that). Instead, verify via a throwaway script reproducing the query against `@/db/connection` (the unguarded module, same pattern used throughout this project's history): confirm it returns at most `limit` rows, ordered by date/createdAt descending, scoped to the household. If the household currently has 0 expenses (likely, per the app's baseline state), temporarily insert 6-7 throwaway expenses across different dates, confirm exactly 5 are returned in the right order when called with `limit=5`, then delete all throwaway rows and confirm the table is back to its prior state.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add recent expenses data function and dashboard panel"
```

---

## Task 10: Coming-soon placeholder card + full Dashboard page rewrite

**Files:**
- Create: `src/components/dashboard/coming-soon-card.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Write the placeholder card**

Create `src/components/dashboard/coming-soon-card.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

type Props = { title: string; description: string; icon: LucideIcon };

export function ComingSoonCard({ title, description, icon: Icon }: Props) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <Badge variant="outline">Soon</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Rewrite the Dashboard page**

Replace the full contents of `src/app/(app)/dashboard/page.tsx`:
```tsx
import Link from "next/link";
import { Gauge, PiggyBank } from "lucide-react";
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/lib/data/categories";
import { getIncomesForMonth } from "@/lib/actions/income";
import { getBudgetItemsForMonth } from "@/lib/actions/budget";
import { listExpensesForMonth, listRecentExpenses } from "@/lib/actions/expenses";
import { dashboardSummary, budgetVsActual } from "@/lib/calculations/budget";
import { getCategoryIcon } from "@/lib/category-icons";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { OwnerTabs } from "@/components/dashboard/owner-tabs";
import { ComingSoonCard } from "@/components/dashboard/coming-soon-card";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetVsActualTable } from "@/components/budget/budget-vs-actual-table";
import { RecentExpenses } from "@/components/expenses/recent-expenses";

function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function DashboardPage() {
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

  const incomes = incomeRows.map((i) => ({ memberId: i.memberId, amount: Number(i.amount) }));
  const expenses = expenseRows.map((e) => ({
    categoryId: e.categoryId,
    ownerMemberId: e.ownerMemberId,
    amount: Number(e.amount),
  }));
  const budgetItems = budgetItemRows.map((b) => ({
    categoryId: b.categoryId,
    ownerMemberId: b.ownerMemberId,
    plannedAmount: Number(b.plannedAmount),
  }));

  const summary = dashboardSummary(incomes, expenses);
  const vsActual = budgetVsActual(budgetItems, expenses);

  const prevSummary = dashboardSummary(
    prevIncomeRows.map((i) => ({ memberId: i.memberId, amount: Number(i.amount) })),
    prevExpenseRows.map((e) => ({
      categoryId: e.categoryId,
      ownerMemberId: e.ownerMemberId,
      amount: Number(e.amount),
    })),
  );

  const category = (id: string) => categories.find((c) => c.id === id);
  const categoryName = (id: string) => category(id)?.name ?? "Unknown";

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

  const ownerLabel = (id: string | null) => {
    if (id === null) return "Shared";
    if (id === memberId) return "Me";
    return members.find((m) => m.id === id)?.user.name ?? "Partner";
  };

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
          <section>
            <h2 className="mb-2 text-lg font-semibold">Overview</h2>
            <OwnerTabs views={ownerViews} />
          </section>

          <ComingSoonCard
            icon={Gauge}
            title="Financial Health"
            description="A safe-to-spend forecast based on your budget and spending pace is coming soon."
          />

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Budget Overview</h2>
              <Link href="/budget" className="text-sm text-primary underline">
                View all budgets
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vsActual.map((row) => (
                <BudgetCard
                  key={`${row.categoryId}-${row.ownerMemberId ?? "shared"}`}
                  categoryName={categoryName(row.categoryId)}
                  planned={row.planned}
                  actual={row.actual}
                  icon={getCategoryIcon(category(row.categoryId)?.groupName ?? "")}
                />
              ))}
              {vsActual.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No budget set for this month yet.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Budget vs Actual</h2>
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
          </section>
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

- [ ] **Step 3: Verify**

1. `npx tsc --noEmit` and `npm run build` — both must succeed with **zero** errors now (this resolves the two pre-existing errors from Tasks 6 and 8).
2. Real-login + curl verification of `/dashboard` on a clean dataset (no income/budget/expenses for the current or previous month): confirm 200, no crash, the greeting renders with the real member's name, all 4 summary cards render (Combined Income/Expenses/Unallocated show "NPR 0", Total Savings shows "Coming soon"), no trend lines appear (previous month is also empty, `trendPct` returns `null`), "No budget set for this month yet." appears in the Budget Overview section, the Budget vs Actual table renders with 0 rows, Recent Expenses shows "No expenses yet.", and both Coming Soon cards render.
3. Seed a realistic scenario via throwaway scripts (current + previous month income, several budget items across owners including one pushed over 80% and one over 100%, several expenses, at least one expense in a category with NO budget item to confirm the "uncovered spend" row still surfaces correctly): re-curl `/dashboard` and confirm: summary card numbers are correct, trend lines show correct sign/percentage vs. the previous month's seeded totals, budget cards show correct icons/percentages/status labels ("On track"/"Approaching limit"/"Over budget"), the table's new Status column matches each card's status, Recent Expenses shows up to 5 most recent rows with correct relative dates ("Today" for today's date).
4. Clean up all test data, confirm the DB is back to baseline (same verification pattern as prior tasks — count rows in `incomes`, `budget_items`, `monthly_budgets`, `expenses` for both months, confirm 0).
5. Kill any dev server by specific PID.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: rewrite dashboard page with redesigned layout, trends, and recent expenses"
```

---

## Task 11: Wire "viewing as" into the expense form pages

**Files:**
- Modify: `src/app/(app)/expenses/new/page.tsx`, `src/app/(app)/expenses/[id]/edit/page.tsx`

- [ ] **Step 1: Update the "new expense" page**

In `src/app/(app)/expenses/new/page.tsx`, change the import and the destructured call:
```tsx
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
```
```tsx
  const { memberId, householdId } = await getEffectiveMember();
```
(Only these two lines change — the rest of the file, including the `ExpenseForm` JSX, stays exactly as it is.)

- [ ] **Step 2: Update the edit page**

In `src/app/(app)/expenses/[id]/edit/page.tsx`, change the import and the destructured call:
```tsx
import { getEffectiveMember, getHouseholdMembers } from "@/lib/session";
```
```tsx
  const { memberId, householdId } = await getEffectiveMember();
```
(Only these two lines change — the rest of the file, including the household-isolation-guarded expense lookup and the `ExpenseForm` JSX, stays exactly as it is.)

- [ ] **Step 3: Verify**

1. `npx tsc --noEmit` and `npm run build` — both succeed.
2. Real-login + curl: set the viewing-as cookie to the partner's member id (via the throwaway-route technique from Task 2, or by re-verifying the already-proven `setViewingAsAction` + a manual `Cookie` header on the curl request), then fetch `/expenses/new` and confirm the "For" select's default-selected value now corresponds to the partner (rendered as "Me" from the switched perspective) rather than the real logged-in member. Reset the cookie back afterward (or just note that cookies don't persist beyond the test session).
3. Confirm household-isolation is unaffected: the underlying `createExpenseAction`/`updateExpenseAction` calls still derive `householdId` via `getCurrentMember()` (unchanged in `src/lib/actions/expenses.ts` — this task doesn't touch that file), so submitting an expense while "viewing as" the partner still correctly writes to the real household, just with different UI defaults.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: use viewing-as perspective for expense form defaults"
```

---

## Task 12: Final end-to-end verification

**Files:** none (verification pass)

- [ ] **Step 1: Full build and test suite**

```bash
npx tsc --noEmit
npm run test
npm run build
```
Expect all three to succeed with no errors/failures.

- [ ] **Step 2: Full manual walkthrough**

Using the real-login + curl technique (or, if convenient, an actual browser at this point), walk through:
1. `/dashboard` renders the full redesigned layout: header with greeting/month/bell/avatar, 4 summary cards, Overview/Me/Partner/Shared tabs, Financial Health "Coming soon" card, Budget Overview cards with icons and correct status, Budget vs Actual table with status column, Recent Expenses panel, Savings Goals "Coming soon" card.
2. The sidebar shows the restyled nav with working Home/Expenses/Budget links, six disabled "Soon"-badged items, and the viewing-as switcher.
3. Switching "Viewing as" actually changes the Dashboard's "Me" label and the Overview tab's default income/expense split to the other member's data.
4. `/expenses/new` and `/expenses/[id]/edit` still work correctly (owner→paid-by auto-default from Task 12 of the prior plan still functions), and reflect the viewing-as perspective for their defaults.
5. Bottom nav (simulate via a narrow viewport if using a browser, or just confirm via code review that the `md:hidden` class is intact) still shows Home/Expenses/Budget/Add with icons.

- [ ] **Step 3: Fix any issues found**

If anything fails, fix the underlying code and re-verify the specific failing step. Commit any fixes separately with a clear message.

- [ ] **Step 4: Final commit (if needed)**

```bash
git add -A
git commit -m "chore: verify dashboard redesign end-to-end"
```
(Skip if Step 3 required no changes — nothing to commit.)

---

## Plan Self-Review Notes

- **Spec coverage:** Every section of `docs/superpowers/specs/2026-08-18-dashboard-redesign-design.md` maps to a task — shell/sidebar/header (§3) → Tasks 3-5, viewing-as (§3.3) → Tasks 2-3 and 11, dashboard body (§4) → Tasks 6-10, data additions (§5) → Tasks 1, 2, 9. The "explicitly not changed" section (§6) is honored: no server action's household-scoping logic is touched anywhere in this plan.
- **Placeholder scan:** No TBD/TODO markers; every code block is complete.
- **Type consistency:** `BudgetCard`'s new `icon: LucideIcon` prop, `SummaryCards`' new `incomeTrendPct`/`expenseTrendPct: number | null` props, and `BudgetVsActualTable`'s (unchanged) `Row` type are used identically at their one call site in the Task 10 dashboard rewrite. `getEffectiveMember()`'s return type (`CurrentMember`, already defined in `session.ts`) matches `getCurrentMember()`'s, so both `expenses/new/page.tsx` and `expenses/[id]/edit/page.tsx` need no other changes beyond the one-line swap.
- **Sequencing:** Tasks 6 and 8 intentionally leave the dashboard page in a non-compiling state (documented, expected, isolated-by-design via the `tsc` verification steps) until Task 10 rewrites it — this lets each component's changes be reviewed independently before they're wired together, consistent with how earlier plans in this project have been executed.
