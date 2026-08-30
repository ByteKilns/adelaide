# Voice Entry — Design

## Summary

Let the user speak a record instead of filling in a form by hand. Speech is transcribed
in the browser, a Gemini call turns the transcript into structured fields, and the
result opens the app's existing add-record modal pre-filled for review before saving.

This spec covers the full vision (voice entry across all record types) but scopes
**Phase 1** to Expenses only, building the shared pipeline once and proving it works
before extending it. Phase 2 (the other 7 actions) is described at a high level here
and gets its own follow-up plan once Phase 1 has shipped and been used for a while.

## Scope

- **Language**: English only.
- **Phase 1 record type**: Expenses (`createExpenseAction`).
- **Phase 2 record types** (future, same pattern): Income (`setIncomeAction`), new Loan
  (`createLoanAction`), Loan Payment (`addLoanPaymentAction`), new Dhuku
  (`createDhukuAction`), Dhuku Entry (`addDhukuEntryAction`), new Savings Goal
  (`createSavingsGoalAction`), Savings Contribution (`addContributionAction`).
- **Parsing provider**: Google Gemini API, free tier (`@google/genai` SDK). Chosen over
  Anthropic Claude and OpenRouter's free tier for reliability of the free tier
  (first-party capacity, not shared/deprioritized), given this task doesn't need
  Claude-tier reasoning (it's short-sentence classification + field extraction).
- **Model**: a current Gemini Flash-Lite-tier model, chosen at implementation time by
  checking Google's live model list — Gemini's model lineup has moved past what any
  static reference would show (confirmed during this design session: 3.5/3.6/3.7 Flash
  exist now), so pinning a specific ID here would likely already be stale. Implementation
  must verify the exact current model ID and its free-tier rate limits via Google AI
  Studio / the Gemini API docs before writing the client wrapper.
- **Out of scope for Phase 1**: any record type besides Expenses; auto-save without
  review; non-English speech; offline/no-network operation.

## Architecture

```
[VoiceEntryButton] --tap--> [VoiceEntryModal: Listening]
       |                            |
       |                    useSpeechRecognition
       |                    (browser SpeechRecognition API,
       |                     transcription only, no network)
       |                            |
       |                    user taps Stop
       |                            v
       |                  [VoiceEntryModal: Parsing]
       |                            |
       |                 parseVoiceEntryAction(transcript)
       |                            |
       |                  loads household categories/members
       |                  (existing listCategories/getHouseholdMembers)
       |                            |
       |                  calls Gemini (src/lib/gemini.ts)
       |                  with transcript + context + JSON schema
       |                            |
       |                  validates/sanitizes response
       |                  (IDs checked against real household data;
       |                   invalid ones fall back to sane defaults)
       |                            v
       +-------------------> [AddExpenseModal, pre-filled]
                                    |
                              user reviews/edits, taps Save
                                    |
                            createExpenseAction (unchanged)
```

The Gemini API key lives server-side only (`.env.local`, read inside the Server
Action) — it is never sent to the client.

## Components

1. **`VoiceEntryButton`** (`src/components/nav/VoiceEntryButton.tsx`) — mic-icon
   trigger. Rendered next to the existing "Add Expense" affordances: inside
   `SidebarNav` next to its Add Expense button, and inside `BottomNav` next to its
   floating Add Expense button. Feature-detects `SpeechRecognition` support on mount;
   renders disabled with an explanatory tooltip if unsupported (Firefox today).

2. **`VoiceEntryModal`** (`src/components/nav/VoiceEntryModal.tsx`) — owns the
   Listening → Parsing → (hand off to `AddExpenseModal` | Error) state machine.
   Built on the existing `Modal`/`Sheet` primitives, matching the rest of the app's
   modal styling.

3. **`useSpeechRecognition`** (`src/lib/useSpeechRecognition.ts`) — thin hook around
   the browser's `SpeechRecognition`/`webkitSpeechRecognition`: exposes `start()`,
   `stop()`, live `interimTranscript`, final `transcript`, `isSupported`, and error
   state (`no-speech`, `not-allowed`, etc.).

4. **`parseVoiceEntryAction`** (`src/modules/voice-entry/api/voice-entry.actions.ts`,
   `"use server"`) — the only new Server Action for Phase 1:
   - `getCurrentMember()` for `householdId` (same auth pattern as every other action).
   - Loads `listCategories(householdId)` and `getHouseholdMembers(householdId)`.
   - Builds a compact context block: category `{id, name, groupName}` list, member
     `{id, name}` list.
   - Calls Gemini via `src/lib/gemini.ts` with the transcript, context, and a JSON
     schema shaped like `ExpenseInput` plus an `understood: boolean` field.
   - Sanitizes the response: any `categoryId`/`ownerMemberId`/`paidByMemberId` Gemini
     returns is checked against the real household lists; an invalid/missing one is
     replaced with a default (current member for owner/paidBy, first category) rather
     than rejecting the whole parse.
   - Returns a discriminated result: `{ ok: true; draft: ExpenseInput } | { ok: false;
     reason: "not_understood" | "parse_error"; transcript: string }`.

5. **`src/lib/gemini.ts`** — thin wrapper around `@google/genai`: client construction
   (`GEMINI_API_KEY` from env), one exported function that takes a prompt + JSON schema
   and returns parsed JSON, with the model ID as a single named constant.

## Data flow (Phase 1)

1. Tap the mic button → browser prompts for mic permission (first use) →
   `VoiceEntryModal` opens in the Listening state, showing the live interim transcript
   as the user speaks.
2. User taps **Stop** (manual stop — auto-stop-on-silence is inconsistent across
   browsers, so the user controls it explicitly) → final transcript is captured.
3. Modal moves to the Parsing state; client calls `parseVoiceEntryAction(transcript)`.
4. Server Action loads categories/members, sends transcript + context + schema to
   Gemini, gets back structured JSON, sanitizes IDs against real household data.
5. On success (`ok: true`): client closes `VoiceEntryModal` and opens the existing
   `AddExpenseModal` with `initial` set from `draft` — the same `initial` prop
   `ExpenseForm` already supports (used today by `EditExpenseModal`). No changes to
   `ExpenseForm`, `AddExpenseModal`, or `createExpenseAction`.
6. On failure (`ok: false`): `VoiceEntryModal` shows an Error state with the preserved
   transcript, a human-readable reason, and two actions: **Try again** (re-opens
   Listening) and **Add manually** (opens the empty `AddExpenseModal`).

## Error handling

| Condition | Behavior |
|---|---|
| Browser has no `SpeechRecognition` (e.g. Firefox) | `VoiceEntryButton` renders disabled with a tooltip: "Voice input isn't supported in this browser." |
| Mic permission denied | Listening state shows: "Microphone access is blocked — check your browser's site settings." with a Close action. |
| No speech detected (`no-speech` event) | Immediate retry available in the Listening state; no Gemini call is made. |
| Gemini call fails (network/API error) | Error state: "Voice parsing is temporarily unavailable — try again in a moment." Transcript preserved; Try again re-runs only the parse step, not the recording. |
| Gemini free-tier rate limit hit | Same as above — the message is generic/user-facing, not a raw API error; the specific rate-limit numbers aren't surfaced to the user. |
| Gemini returns `understood: false` | Error state: "Couldn't quite catch that as an expense — try rephrasing, or add it manually." with transcript shown and both retry/manual-add actions. |
| Gemini returns an invalid category/member ID | Silently sanitized to a default (see Components §4) — never surfaced as an error, since the review step in `AddExpenseModal` is exactly where the user catches and fixes this. |

## Testing

- **Unit-tested (pure logic)**: the response-sanitization function that takes
  Gemini's raw parsed JSON plus the household's real category/member lists and
  produces a safe `ExpenseInput` draft (clamping invalid/missing IDs to defaults).
  Same pattern as `src/modules/expenses/lib/expense-filters.ts` — TDD, no network,
  no mocking.
- **Not unit-tested (verified by hand in a real browser)**: the Gemini API call itself
  and the browser `SpeechRecognition` API — both are external/browser-only and not
  meaningfully mockable in a way that proves anything. Verified live during
  implementation, consistent with how UI changes were verified earlier in this
  project's history (Playwright against a disposable local Postgres, real browser
  interaction) — voice capture itself can only be verified by hand (Playwright can't
  simulate a microphone), but the parse-and-prefill path downstream of a transcript
  can still be exercised via Playwright by injecting a transcript directly.

## Phase 2 (future, not detailed here)

Once Phase 1 has shipped and been used for a while, `parseVoiceEntryAction` extends to
a `recordType` union covering the other 7 actions. Each addition follows the exact
same pattern: existing Zod schema for validation, existing form/modal component for
review, existing Server Action for the save — only the Gemini schema, the household
context passed in (e.g. existing loans/dhukus/goals so spoken references like "car
loan" can resolve to a real ID), and the client-side routing switch grow. This becomes
its own spec once Phase 1 has proven the pipeline out.

## Setup requirement

`@google/genai` needs to be added as a dependency, and a `GEMINI_API_KEY` needs to be
added to `.env.local` (and documented in `.env.example`) before this can run. The user
will obtain a free-tier key from Google AI Studio and add it before testing.
