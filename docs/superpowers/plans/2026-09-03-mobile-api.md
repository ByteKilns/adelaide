# Mobile API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bearer-token-authenticated REST API surface (`/api/mobile/*`) to the existing Next.js app so the future Flutter app can log in, fetch categories/members, parse a voice transcript into an expense draft, list recent expenses, and create an expense — all by calling the same underlying logic the web app's server actions already use.

**Architecture:** Extract the DB-touching cores of three existing pieces (credential verification in `auth.ts`, voice parsing in `voice-entry.actions.ts`, expense creation/listing in `expenses.actions.ts`) into household/user-parameterized functions that both the existing cookie-session code paths *and* new token-authenticated route handlers can call — no logic is duplicated. A new `mobile-auth.ts` issues/verifies long-lived HS256 JWTs (via `jose`, reusing the existing `AUTH_SECRET`), and a `requireMobileAuth()` helper wraps every new route handler.

**Tech Stack:** Next.js 16 App Router route handlers, `jose` (JWT), Drizzle ORM, existing Gemini voice-parsing pipeline, Vitest.

**Scope note:** This plan covers the server API only. The Flutter app (`mobile/`) that consumes it is a separate, independently-testable subsystem and gets its own plan once this one is implemented and verified — see the design doc's scope split in
[docs/superpowers/specs/2026-09-03-mobile-voice-expense-app-design.md](../specs/2026-09-03-mobile-voice-expense-app-design.md).

---

## Task 1: Add the `jose` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install jose**

Run: `npm install jose`

Expected: `package.json` gains a `"jose": "^6.x.x"` entry under `"dependencies"`, and `package-lock.json` updates.

- [ ] **Step 2: Verify it installed at the version already vendored transitively**

Run: `node -e "console.log(require('jose/package.json').version)"`

Expected: prints `6.2.9` or newer (next-auth already depends on `jose` transitively, so this should already be present in `node_modules` and just gets promoted to a direct, pinned dependency).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jose as a direct dependency for mobile JWT signing"
```

---

## Task 2: Extract `verifyCredentials` from `auth.ts`

Both the web login (NextAuth) and the new mobile login route need to run the
exact same email/password/lockout check. Extract it once so the rules can
never drift between the two.

**Files:**
- Create: `src/lib/verify-credentials.ts`
- Modify: `src/auth.ts`

- [ ] **Step 1: Create the extracted helper**

```ts
// src/lib/verify-credentials.ts
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { isLockedOut, recordFailedAttempt, resetAttempts } from "@/lib/login-lockout";
import { getPasswordHashForComparison } from "@/lib/password-comparison";

export type VerifiedUser = { email: string; id: string; name: string };

export async function verifyCredentials(email: string, password: string): Promise<VerifiedUser | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  const now = new Date();
  if (user && isLockedOut(user, now)) return null;

  // Always compare against *some* bcrypt hash, even when no user was
  // found, so a nonexistent email can't be distinguished from a wrong
  // password by response time.
  const valid = await bcrypt.compare(password, getPasswordHashForComparison(user));
  if (!user || !valid) {
    if (user) {
      const next = recordFailedAttempt(user, now);
      await db.update(users).set(next).where(eq(users.id, user.id));
    }
    return null;
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.update(users).set(resetAttempts()).where(eq(users.id, user.id));
  }

  return { id: user.id, email: user.email, name: user.name };
}
```

- [ ] **Step 2: Point `auth.ts`'s `authorize` callback at it**

Replace the full body of the `Credentials({ ... })` provider in
`src/auth.ts` (currently lines 15–47) with:

```ts
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        return verifyCredentials(email, password);
      },
    }),
```

And update the top of `src/auth.ts` to drop the now-unused imports and add
the new one:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { verifyCredentials } from "@/lib/verify-credentials";
```

(`bcrypt`, `eq`, `db`, `users`, `isLockedOut`, `recordFailedAttempt`,
`resetAttempts`, `getPasswordHashForComparison` are no longer referenced
directly in this file — remove those imports.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Manual verification (no DB test harness exists in this repo for this kind of code — see how `auth.ts` itself has no test file today)**

Run: `npm run dev`, then log into the web app at `/login` with a known-good
account. Expected: login still succeeds, exactly as before the refactor.
Also try a wrong password 5 times in a row and confirm the existing lockout
message still appears — this proves the extraction preserved the lockout
side effects.

- [ ] **Step 5: Commit**

```bash
git add src/lib/verify-credentials.ts src/auth.ts
git commit -m "refactor: extract verifyCredentials so mobile login can reuse it"
```

---

## Task 3: `mobile-auth.ts` — sign/verify mobile bearer tokens

**Files:**
- Create: `src/lib/mobile-auth.ts`
- Test: `src/lib/mobile-auth.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/mobile-auth.test.ts
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signMobileToken, verifyMobileToken } from "./mobile-auth";

const TEST_SECRET = "test-secret-at-least-32-bytes-long-for-hmac";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", TEST_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signMobileToken / verifyMobileToken", () => {
  it("round-trips a userId through sign then verify", async () => {
    const token = await signMobileToken("user-123");
    expect(await verifyMobileToken(token)).toBe("user-123");
  });

  it("rejects a tampered token", async () => {
    const token = await signMobileToken("user-123");
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(await verifyMobileToken(tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const otherToken = await new SignJWT({ sub: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("90d")
      .sign(new TextEncoder().encode("a-completely-different-secret-value"));
    expect(await verifyMobileToken(otherToken)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifyMobileToken("not-a-jwt")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/mobile-auth.test.ts`

Expected: FAIL — `Cannot find module './mobile-auth'` (the module doesn't
exist yet).

- [ ] **Step 3: Implement `mobile-auth.ts`**

```ts
// src/lib/mobile-auth.ts
import { jwtVerify, SignJWT } from "jose";

// Reuses next-auth's own AUTH_SECRET rather than introducing a second
// secret to manage — acceptable here since this app has exactly two users
// and a compromised secret would already mean a compromised deployment.
const MOBILE_TOKEN_TTL = "90d";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(MOBILE_TOKEN_TTL)
    .sign(getSecretKey());
}

export async function verifyMobileToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/mobile-auth.test.ts`

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mobile-auth.ts src/lib/mobile-auth.test.ts
git commit -m "feat: add mobile bearer-token sign/verify helpers"
```

---

## Task 4: `getCurrentMemberFromToken` in `session.ts`

Shares the exact same household-member lookup query `getCurrentMember()`
already uses, so a token-authenticated caller resolves to the same
`CurrentMember` shape the rest of the codebase already relies on.

**Files:**
- Modify: `src/lib/session.ts`

- [ ] **Step 1: Extract the shared lookup and add the token variant**

Replace the current `getCurrentMember` function (lines 15–31) with:

```ts
async function getMemberForUser(userId: string): Promise<CurrentMember> {
  const member = await db.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, userId),
    with: { household: true, user: true },
  });

  if (!member) {
    throw new Error("User does not belong to a household");
  }

  return {
    memberId: member.id,
    householdId: member.householdId,
    userId: member.userId,
    name: member.user.name,
  };
}

export async function getCurrentMember(): Promise<CurrentMember> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  return getMemberForUser(session.user.id);
}

export async function getCurrentMemberFromToken(token: string): Promise<CurrentMember | null> {
  const userId = await verifyMobileToken(token);
  if (!userId) return null;

  try {
    return await getMemberForUser(userId);
  } catch {
    return null;
  }
}
```

Add the new import at the top of the file, alongside the existing ones:

```ts
import { verifyMobileToken } from "@/lib/mobile-auth";
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/session.ts
git commit -m "feat: add getCurrentMemberFromToken alongside cookie-based getCurrentMember"
```

---

## Task 5: `requireMobileAuth` request helper

A single place every `/api/mobile/*` route calls to turn an
`Authorization: Bearer <token>` header into a `CurrentMember`, or a ready-to-
return 401 `NextResponse`.

**Files:**
- Create: `src/lib/mobile-request.ts`

- [ ] **Step 1: Implement it**

```ts
// src/lib/mobile-request.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { type CurrentMember, getCurrentMemberFromToken } from "@/lib/session";

export async function requireMobileAuth(request: NextRequest): Promise<CurrentMember | NextResponse> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const member = await getCurrentMemberFromToken(token);
  if (!member) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return member;
}
```

Every route below calls this as:

```ts
const auth = await requireMobileAuth(request);
if (auth instanceof NextResponse) return auth;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mobile-request.ts
git commit -m "feat: add requireMobileAuth bearer-token guard for mobile routes"
```

---

## Task 6: `POST /api/mobile/login`

**Files:**
- Create: `src/app/api/mobile/login/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/mobile/login/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { signMobileToken } from "@/lib/mobile-auth";
import { verifyCredentials } from "@/lib/verify-credentials";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : undefined;
  const password = typeof body?.password === "string" ? body.password : undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signMobileToken(user.id);
  return NextResponse.json({ token });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, then in another terminal:

```bash
curl -i -X POST http://localhost:3000/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_TEST_EMAIL","password":"YOUR_TEST_PASSWORD"}'
```

Expected: `200` with a JSON body like `{"token":"eyJ..."}`. Save that token
to a shell variable for the remaining manual checks:

```bash
export MOBILE_TOKEN="<paste the token>"
```

Also verify the failure path:

```bash
curl -i -X POST http://localhost:3000/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_TEST_EMAIL","password":"wrong-password"}'
```

Expected: `401` with `{"error":"Invalid email or password"}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mobile/login/route.ts
git commit -m "feat: add POST /api/mobile/login issuing a bearer token"
```

---

## Task 7: Exclude `/api/mobile/*` from the cookie-session redirect middleware

`src/proxy.ts` currently redirects any unauthenticated request to `/login`
unless the path matches its exclusion list — which does not yet include
`api/mobile`. Without this fix, every mobile API call would get a `307`
redirect to `/login` instead of reaching the route handler, since the
Flutter app never carries a next-auth session cookie.

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Update the matcher**

Change:

```ts
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

to:

```ts
export const config = {
  matcher: ["/((?!api/auth|api/mobile|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Manual verification**

Restart `npm run dev` (middleware config changes require a restart), then
repeat the Task 6 login curl call and confirm it still returns `200` (not a
`307` redirect to `/login`).

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "fix: exclude /api/mobile from the session-cookie redirect middleware"
```

---

## Task 8: `GET /api/mobile/categories`

Returns the household's categories and members, so the Flutter app can
populate the confirm/edit sheet's pickers.

**Files:**
- Create: `src/app/api/mobile/categories/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/mobile/categories/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireMobileAuth } from "@/lib/mobile-request";
import { getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const [categories, members] = await Promise.all([
    listCategories(auth.householdId),
    getHouseholdMembers(auth.householdId),
  ]);

  return NextResponse.json({
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    members: members.map((m) => ({ id: m.id, name: m.user.name })),
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
curl -i http://localhost:3000/api/mobile/categories \
  -H "Authorization: Bearer $MOBILE_TOKEN"
```

Expected: `200` with `{"categories":[...],"members":[...]}` reflecting your
household's real categories and the two of you as members. Also check the
no-token case:

```bash
curl -i http://localhost:3000/api/mobile/categories
```

Expected: `401` with `{"error":"Missing bearer token"}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mobile/categories/route.ts
git commit -m "feat: add GET /api/mobile/categories"
```

---

## Task 9: Extract `parseVoiceEntry` so the mobile route can reuse it

**Files:**
- Modify: `src/modules/voice-entry/api/voice-entry.actions.ts`

- [ ] **Step 1: Split the household-parameterized core out of the action**

Replace the full contents of the file with:

```ts
"use server";

import { parseExpenseTranscript } from "@/lib/gemini";
import { getCurrentMember, getHouseholdMembers } from "@/lib/session";
import { listCategories } from "@/modules/categories/api/categories";
import { sanitizeVoiceExpense, type VoiceParseResult } from "@/modules/voice-entry/lib/sanitize-voice-expense";

export async function parseVoiceEntry(
  transcript: string,
  { householdId, memberId }: { householdId: string; memberId: string },
): Promise<VoiceParseResult> {
  const [categories, members] = await Promise.all([listCategories(householdId), getHouseholdMembers(householdId)]);

  if (categories.length === 0 || members.length === 0) {
    return { ok: false, reason: "not_understood" };
  }

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
  const memberOptions = members.map((m) => ({ id: m.id, name: m.user.name }));

  try {
    const raw = await parseExpenseTranscript(transcript, {
      categories: categoryOptions,
      members: memberOptions,
      today: new Date().toISOString().slice(0, 10),
    });
    return sanitizeVoiceExpense(raw, {
      categories: categoryOptions,
      currentMemberId: memberId,
      members: memberOptions,
    });
  } catch {
    return { ok: false, reason: "not_understood" };
  }
}

export async function parseVoiceEntryAction(transcript: string): Promise<VoiceParseResult> {
  const { householdId, memberId } = await getCurrentMember();
  return parseVoiceEntry(transcript, { householdId, memberId });
}
```

- [ ] **Step 2: Run the existing voice-entry unit tests**

Run: `npx vitest run src/modules/voice-entry`

Expected: PASS — `sanitize-voice-expense.test.ts` is untouched by this
refactor and should still be green, confirming the sanitize logic this
function delegates to still behaves identically.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/voice-entry/api/voice-entry.actions.ts
git commit -m "refactor: extract parseVoiceEntry so mobile can reuse the parsing pipeline"
```

---

## Task 10: `POST /api/mobile/voice/parse`

**Files:**
- Create: `src/app/api/mobile/voice/parse/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/mobile/voice/parse/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireMobileAuth } from "@/lib/mobile-request";
import { parseVoiceEntry } from "@/modules/voice-entry/api/voice-entry.actions";

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const transcript = typeof body?.transcript === "string" ? body.transcript : "";

  if (!transcript.trim()) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const result = await parseVoiceEntry(transcript, {
    householdId: auth.householdId,
    memberId: auth.memberId,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
curl -i -X POST http://localhost:3000/api/mobile/voice/parse \
  -H "Authorization: Bearer $MOBILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"I spent 500 rupees on groceries today"}'
```

Expected: `200` with `{"ok":true,"draft":{"amount":500,"categoryId":"...","date":"...","note":"...","ownerMemberId":...,"paidByMemberId":"..."}}`
(exact category/member ids depend on your seeded data). Also try nonsense
input:

```bash
curl -i -X POST http://localhost:3000/api/mobile/voice/parse \
  -H "Authorization: Bearer $MOBILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"good morning how are you"}'
```

Expected: `200` with `{"ok":false,"reason":"not_understood"}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mobile/voice/parse/route.ts
git commit -m "feat: add POST /api/mobile/voice/parse"
```

---

## Task 11: Extract household-parameterized create/list functions in `expenses.actions.ts`

**Files:**
- Modify: `src/modules/expenses/api/expenses.actions.ts`

- [ ] **Step 1: Extract `createExpenseForHousehold` from `createExpenseAction`**

Replace the current `createExpenseAction` function (originally lines 31–72)
with the version below. `createExpenseForHousehold` is exported directly
(not wrapped) so the mobile route in Task 12 can call it with a
`householdId`/`actorName` pair resolved from the bearer token, instead of
from `getCurrentMember()`'s cookie session:

```ts
export async function createExpenseForHousehold(
  input: ExpenseInput,
  { actorName, householdId }: { actorName: string; householdId: string },
) {
  const parsed = expenseSchema.parse(input);
  const categories = await listCategories(householdId);
  if (!categories.some((c) => c.id === parsed.categoryId)) {
    throw new Error("Category does not belong to this household");
  }
  await assertMemberInHousehold(householdId, parsed.paidByMemberId);
  if (parsed.ownerMemberId) {
    await assertMemberInHousehold(householdId, parsed.ownerMemberId);
  }

  const [created] = await db
    .insert(expenses)
    .values({
      householdId,
      amount: String(parsed.amount),
      categoryId: parsed.categoryId,
      ownerMemberId: parsed.ownerMemberId,
      paidByMemberId: parsed.paidByMemberId,
      date: parsed.date,
      note: parsed.note,
    })
    .returning();

  const categoryName = categories.find((c) => c.id === parsed.categoryId)?.name ?? "Unknown";

  if (parsed.ownerMemberId === null) {
    await insertNotification({
      body: `${actorName} added ${categoryName} · ${formatNPR(parsed.amount)} to shared expenses.`,
      category: "shared",
      dedupeKey: `expense:${created.id}`,
      householdId,
      severity: "info",
      title: "New shared expense added",
    });
  }
  await checkBudgetThreshold(householdId, parsed.categoryId, parsed.ownerMemberId, parsed.date);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return created;
}

export async function createExpenseAction(input: ExpenseInput) {
  const { householdId, name: actorName } = await getCurrentMember();
  await createExpenseForHousehold(input, { actorName, householdId });
}
```

- [ ] **Step 2: Extract `listRecentExpensesForHousehold` from `listRecentExpenses`**

Replace the current `listRecentExpenses` function with:

```ts
export async function listRecentExpensesForHousehold(householdId: string, limit: number) {
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.householdId, householdId))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))
    .limit(limit);
}

export async function listRecentExpenses(limit: number) {
  const { householdId } = await getCurrentMember();
  return listRecentExpensesForHousehold(householdId, limit);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors. (This confirms every existing caller of
`createExpenseAction` / `listRecentExpenses` still compiles unchanged,
since their signatures didn't change — only their bodies got thinner.)

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, add an expense through the existing web UI at
`/expenses`, and confirm it still appears in the list and on `/dashboard`
exactly as before (proves `createExpenseForHousehold`'s notification/budget
side effects still fire correctly through the unchanged `createExpenseAction`
wrapper).

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/api/expenses.actions.ts
git commit -m "refactor: extract household-parameterized create/list expense functions"
```

---

## Task 12: `GET` + `POST /api/mobile/expenses`

**Files:**
- Create: `src/app/api/mobile/expenses/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/mobile/expenses/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createExpenseForHousehold, listRecentExpensesForHousehold } from "@/modules/expenses/api/expenses.actions";
import { requireMobileAuth } from "@/lib/mobile-request";
import { expenseSchema } from "@/modules/expenses/schemas/expense.schema";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  const rows = await listRecentExpensesForHousehold(auth.householdId, limit);

  return NextResponse.json({
    expenses: rows.map((row) => ({ ...row, amount: Number(row.amount) })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await createExpenseForHousehold(parsed.data, {
      actorName: auth.name,
      householdId: auth.householdId,
    });
    return NextResponse.json({ expense: { ...created, amount: Number(created.amount) } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create expense";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

Note the import order here follows the repo's perfectionist-plugin rule
(third-party → project, alphabetical within each group) — double check
`npx eslint src/app/api/mobile/expenses/route.ts` doesn't flag it before
committing; reorder if it does.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint -- --fix src/app/api/mobile/expenses/route.ts`

Expected: no remaining errors (import ordering, if any, gets auto-fixed).

- [ ] **Step 4: Manual verification**

```bash
curl -i http://localhost:3000/api/mobile/expenses \
  -H "Authorization: Bearer $MOBILE_TOKEN"
```

Expected: `200` with `{"expenses":[...]}`, most recent first, `amount` as a
JSON number (not a string).

```bash
curl -i -X POST http://localhost:3000/api/mobile/expenses \
  -H "Authorization: Bearer $MOBILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"categoryId":"<a real category id from /api/mobile/categories>","paidByMemberId":"<a real member id>","ownerMemberId":null,"date":"2026-09-03","note":"curl test"}'
```

Expected: `201` with `{"expense":{...}}`. Re-run the `GET` above and confirm
this new expense appears at the top. Then check it in the web app at
`/expenses` — it should show up there too, and on `/dashboard`.

Also verify validation:

```bash
curl -i -X POST http://localhost:3000/api/mobile/expenses \
  -H "Authorization: Bearer $MOBILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":-5}'
```

Expected: `400` with a Zod validation error body.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/mobile/expenses/route.ts
git commit -m "feat: add GET/POST /api/mobile/expenses"
```

---

## Task 13: Full pre-commit gate

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass, including the new `mobile-auth.test.ts` and the
untouched `sanitize-voice-expense.test.ts`.

- [ ] **Step 2: Run the full build**

Run: `npm run build`

Expected: succeeds — this exercises `tsc` across the whole project plus
Next's route-collection step, which will catch any route handler exported
with a wrong signature (e.g. a non-`NextRequest` param) that per-file
`tsc --noEmit` checks in earlier tasks might not have fully covered.

- [ ] **Step 3: Confirm working tree is clean**

Run: `git status`

Expected: nothing to commit — every task above already committed its own
changes.

---

## What's next

Once this is merged and the routes are confirmed working against your
deployed instance (not just `localhost`), the Flutter app plan can be
written — it will target `POST /api/mobile/login`, `GET
/api/mobile/categories`, `POST /api/mobile/voice/parse`, and `GET`/`POST
/api/mobile/expenses` exactly as implemented here.
