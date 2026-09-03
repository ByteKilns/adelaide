# Mobile Voice Expense App — Design

**Date:** 2026-09-03
**Status:** Approved for planning

## Problem

Adding an expense currently requires opening the web app. The goal is a minimal
Flutter app, distributed as a shared APK to two users (no Play Store), that
lets either person record an expense in a few seconds primarily by voice:
speak the expense, see a parsed confirmation, optionally edit any field, then
save. Manual (non-voice) entry must also be available as a fallback/override.

Scope is intentionally narrow: quick-add only, plus a short recent-entries
list for context. Dashboard, budgets, reports, recurring, loans, savings
goals, categories management, and settings all stay web-only for now.

## Existing system (recap)

- Next.js 16 app (App Router), Postgres via Drizzle, NextAuth (Credentials
  provider, JWT session strategy, bcrypt + login lockout) — [auth.ts](../../../src/auth.ts).
- Data model: `users` → `householdMembers` (household + member identity) →
  `expenses` (amount, categoryId, ownerMemberId nullable "shared", paidByMemberId,
  date, note) — [expense.schema.ts](../../../src/modules/expenses/schemas/expense.schema.ts).
- Session resolution is cookie-based: `getCurrentMember()` in
  [session.ts](../../../src/lib/session.ts) calls next-auth's `auth()` to read the
  session cookie, then looks up the caller's `householdMembers` row.
- Voice entry already exists **on web**: browser Web Speech API produces a
  transcript client-side → `parseVoiceEntryAction(transcript)` server action
  → Gemini (`parseExpenseTranscript`, `@/lib/gemini`) → `sanitizeVoiceExpense()`
  clamps the LLM's output against the household's real categories/members →
  returns an `ExpenseDraft` the UI shows for confirm/edit before saving via
  `createExpenseAction`. See
  [voice-entry.actions.ts](../../../src/modules/voice-entry/api/voice-entry.actions.ts),
  [sanitize-voice-expense.ts](../../../src/modules/voice-entry/lib/sanitize-voice-expense.ts).
- The app is already deployed somewhere reachable from the internet, so the
  phone app can call it directly by URL — no new hosting needed.
- Server Actions are not callable from outside the Next.js client runtime, so
  none of the above is reachable from Flutter as-is.

## Approach

Add a small set of plain REST routes under `src/app/api/mobile/*` that call
the *same* underlying functions the web app's server actions already call
(`parseExpenseTranscript`, `sanitizeVoiceExpense`, `listCategories`,
`createExpenseAction`'s logic, `getHouseholdMembers`). No parsing/validation
logic is duplicated — only a thin HTTP + bearer-auth wrapper is new.

Auth: a new `POST /api/mobile/login` route reuses the existing
email/password/lockout verification from `auth.ts` and returns a long-lived
(90-day) signed JWT instead of setting a cookie. The Flutter app stores it in
secure storage and sends `Authorization: Bearer <token>` on every request. A
new `getCurrentMemberFromToken(token)` helper mirrors `getCurrentMember()`'s
household-member lookup but resolves the user id from the bearer token
instead of the next-auth session cookie — the existing cookie-based auth
path is untouched.

Speech-to-text happens on-device (Flutter `speech_to_text` plugin, using the
OS recognizer), matching how the web app already only sends a text
transcript to the server, never audio. This avoids adding server-side audio
transcription.

Repo layout: a new `mobile/` folder at the repo root, sibling to `src/`,
containing the Flutter project. It is not part of the npm workspace/toolchain
(own `pubspec.yaml`, own build/CI) so it does not affect the existing
`tsc --noEmit` / `npm run build` pre-commit hook.

### Alternatives considered

- **Separate backend service (tRPC/GraphQL gateway) instead of REST routes
  in the existing app.** Rejected — three endpoints don't justify a second
  service; it would also duplicate the household/category/member logic that
  already lives in `src/modules/*`.
- **Upload raw audio, transcribe server-side.** Rejected for v1 — adds a new
  server-side STT integration and a bigger payload per request for no
  functional gain over the OS recognizer, which the web app's equivalent
  (Web Speech API) already relies on successfully.
- **Session cookie shared with mobile via a webview.** Rejected — fragile
  (cookie expiry/refresh, no native feel), and a bearer token is the standard
  fit for a native HTTP client.

## New server surface

All new files; nothing existing is modified except where noted.

```
src/lib/mobile-auth.ts
  - signMobileToken(userId): string            (90-day JWT, distinct secret/claim from next-auth's)
  - verifyMobileToken(token): { userId } | null
  - getCurrentMemberFromToken(token): same shape as getCurrentMember()'s return,
    reusing the same householdMembers lookup query

src/app/api/mobile/login/route.ts
  POST { email, password } -> 200 { token } | 401
  Reuses bcrypt compare + isLockedOut/recordFailedAttempt/resetAttempts from auth.ts's logic
  (factored into a shared helper so the rules aren't duplicated — see auth.ts's
  authorize() callback for the exact sequence to extract).

src/app/api/mobile/voice/parse/route.ts
  Authorization: Bearer required
  POST { transcript: string } -> 200 VoiceParseResult | 401
  Calls the same parseExpenseTranscript + sanitizeVoiceExpense pipeline as
  parseVoiceEntryAction, using getCurrentMemberFromToken() in place of getCurrentMember().

src/app/api/mobile/expenses/route.ts
  Authorization: Bearer required
  POST ExpenseInput -> 201 | 400 | 401
  Same validation/insert path as createExpenseAction (expenseSchema, household/category
  ownership checks, notification + budget-threshold side effects preserved).
  GET ?limit=20 -> recent expenses for the "today" list (wraps listRecentExpenses).

src/app/api/mobile/categories/route.ts
  Authorization: Bearer required
  GET -> categories + household members, for populating the edit sheet's pickers
  (wraps listCategories + getHouseholdMembers).
```

`getCurrentMember()` itself is left untouched; the mobile routes get their
own `getCurrentMemberFromToken()` that shares the same household-member query
but takes a userId directly instead of reading the session cookie.

## Flutter app (`mobile/`)

### Screens

1. **Login** — email + password → `POST /api/mobile/login` → store token
   (`flutter_secure_storage`) → navigate to Home. Shown on cold start if no
   stored token, or after a 401.
2. **Home** — minimal: a large centered mic button (primary action), a short
   "recent expenses" list below it (last ~20, from `GET /api/mobile/expenses`)
   for context/undo-by-eye. A small "+" for manual add (opens the same
   confirm/edit sheet, empty).
3. **Listening** — full-bleed state while `speech_to_text` streams; shows
   live partial transcript, a stop button, subtle waveform/pulse animation on
   the mic icon.
4. **Parsing** — brief transitional state while `POST /api/mobile/voice/parse`
   is in flight ("Understanding...", matches web copy).
5. **Confirm/Edit sheet** — prefilled from the parsed `ExpenseDraft`: amount,
   category (picker), paid-by (picker), owner/shared (picker), date, note.
   Every field editable — this is also the manual-entry form when opened from
   "+". Save → `POST /api/mobile/expenses` → success animation (checkmark) →
   sheet dismisses → new item appears at top of the recent list.
6. **Not understood** — mirrors the web app's fallback: show the raw
   transcript, "Try again" (restart listening) / "Retry parsing" (resend same
   transcript) / "Add manually" (opens confirm sheet empty).

### State/data

- `speech_to_text` for on-device recognition.
- `flutter_secure_storage` for the bearer token.
- A single HTTP client wrapper attaches the bearer token and redirects to
  Login on 401.
- No local database/offline queue for v1 — each save is a direct network
  call; if it fails, the confirm sheet stays open with an inline error and a
  retry button (data isn't lost, just not yet submitted).

### Visual direction

Minimalist: one dominant action per screen, generous whitespace, small
animation budget spent on (a) the mic's listening pulse, (b) the
confirm-sheet's slide-up transition, (c) a brief success checkmark on save.
No onboarding flow, no theming options, no settings screen — matches "as
minimalist as possible."

## Error handling

- Mic permission denied → inline message + button to open OS app settings.
- Speech recognition unsupported/unavailable on device → same message,
  degrade straight to manual entry.
- Parse returns `{ ok: false }` (LLM didn't understand) → "Not understood"
  screen described above.
- Network error on any call → inline retry; on `POST /api/mobile/expenses`
  specifically, the filled-in confirm sheet is preserved so nothing typed is
  lost.
- 401 from any authenticated call → clear stored token, navigate to Login.

## Testing

- Server: Vitest coverage for the new route handlers — token issuance/
  rejection in `mobile-auth.ts`, and that `voice/parse` and `expenses` routes
  401 without a valid bearer token and otherwise delegate to the existing,
  already-tested parsing/creation logic.
- Flutter: widget test for the confirm/edit sheet's validation (amount
  required and positive, category/paid-by required). The voice
  capture→parse→confirm flow is validated by manual smoke test on a real
  device, since STT quality isn't meaningfully unit-testable.

## Out of scope (v1)

- Dashboard, budgets, reports, recurring, loans, savings goals, categories
  management, settings, notifications — web-only.
- Editing/deleting past expenses from mobile.
- Offline queueing of unsent expenses.
- Server-side audio transcription.
- Push notifications.
