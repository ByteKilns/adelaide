# Flutter App Visual Refresh — Design

**Date:** 2026-09-04
**Status:** Approved for planning

## Problem

The Flutter app ("Piko", merged and verified working end-to-end against the
real deployed API — see
[2026-09-03-flutter-mobile-app-design.md](2026-09-03-flutter-mobile-app-design.md))
currently uses Flutter's default Material look. The user wants a visual
refresh across the whole app, inspired by two reference mockups (a card-based
"Recent expenses" home screen with a soft-lavender background and rounded
white cards, and a Login screen with a bold headline and softly-bordered
inputs), while keeping two explicit constraints:

- **No "Create an account" link or flow** — this app is invite-only for two
  household members; login-only stays exactly as it is functionally.
- **Space Grotesk** is the app's typeface, bundled locally (not fetched at
  runtime).

This is a presentation-layer pass only — no provider, `ApiClient`, model, or
validation logic changes. All 21 existing tests must keep passing unchanged.

## Scope

The whole app: Login, Home, Settings, voice-capture flow, and the
confirm/edit sheet all get the new design system. Functional behavior
(auth flow, save flow, validation, error handling, the three whole-system
fixes already shipped) is unchanged — only how it looks.

## Font

Space Grotesk, bundled as static `.ttf` files (Bold, Medium, Regular) under
`mobile/assets/fonts/`, sourced from the font's own open-source repository
(SIL Open Font License) at verified URLs:

- `https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Regular.ttf`
- `https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Medium.ttf`
- `https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Bold.ttf`

Declared as a `fonts:` entry in `pubspec.yaml` under a single `SpaceGrotesk`
family with three weights, applied globally via `ThemeData.fontFamily` /
`textTheme` in a new `lib/theme/app_theme.dart` — no per-widget font
overrides needed elsewhere.

## Design system (`lib/theme/app_theme.dart`)

- **Background**: soft lavender `#F5F1FA`
- **Surface (cards, inputs)**: white `#FFFFFF`, 16px rounded corners, a
  subtle low-opacity shadow
- **Primary**: deep purple `#5B3FA6` (close to the current Material
  `deepPurple` seed, so this reads as a refinement, not a rebrand)
- **Text**: near-black `#1A1625` for headings/body, muted gray `#8A8398` for
  labels/eyebrows/subtitles
- **Type scale** (all Space Grotesk): eyebrow labels (small, uppercase,
  letter-spaced, muted, Medium weight), headline (large, Bold), body
  (Regular), button label (Medium)
- A single `ThemeData` built from these tokens, consumed by every screen —
  no screen defines its own colors/fonts inline.

## Category icon/color mapping (`lib/theme/category_style.dart`)

A pure function `CategoryStyle styleFor(String categoryName)` that:
1. Lower-cases the name and matches against a small fixed set of keyword
   groups (e.g. `food`/`lunch`/`dinner`/`grocery` → restaurant icon;
   `transport`/`petrol`/`fuel`/`car` → directions-car icon; `shop`/`cloth`/
   `cosmetic` → bag icon; `medic`/`health`/`pharmacy` → medical icon;
   `mobile`/`phone`/`internet`/`bill` → phone icon; unmatched → a default
   category icon).
2. Assigns a pastel chip background + matching icon color by cycling a
   fixed 5-color palette, keyed by a stable hash of the category name (so
   the same category always gets the same color within a session, without
   needing any new data from the backend).

This is presentation-only — it does not change what data is fetched or
stored; `CategoryOption` stays `{id, name}`.

## Screen-by-screen changes

- **Login** (`login_screen.dart`): small rounded icon badge, "PERSONAL
  SPENDING, SIMPLIFIED" eyebrow, bold headline "Know where **your money**
  goes." (the emphasized phrase in primary-color italic), a subtitle line,
  softly-bordered rounded input fields (replacing the underline
  `TextField`s), full-width dark "Log in" button. **No signup link is
  added.** All existing behavior (validation, error display, loading state,
  settings gear in the app bar) is preserved exactly — only the widget tree
  styling changes.
- **Home** (`home_screen.dart`, `expense_list_tile.dart`): a
  greeting eyebrow (time-of-day aware: "Good morning"/"Good afternoon"/
  "Good evening") above a bold "Piko." wordmark, circular settings button,
  "ACTIVITY" eyebrow + "Recent expenses" heading with a live entry count
  pulled from the already-fetched list's length, and the list re-rendered
  as rounded white cards (category icon chip via `category_style.dart`,
  category name, existing note-or-date subtitle logic unchanged, amount
  right-aligned bold). The two floating action buttons become a smaller
  dark square manual-add button and a larger primary-colored circular mic
  button, positioned as a pair bottom-right (visual change only — the same
  `_openVoiceFlow`/`_openManualEntry` handlers from Task 14 stay wired up
  unchanged).
- **Settings** (`settings_screen.dart`): same input/button styling as
  Login; otherwise unchanged (URL field, Save, conditional Log out).
- **Voice capture** (`voice_capture_screen.dart`): the listening/parsing/
  not-understood states get the new card/button styling; the state machine,
  `mounted` guards, and API calls are untouched.
- **Confirm/edit sheet** (`expense_confirm_sheet.dart`): fields restyled to
  match (rounded bordered inputs, styled dropdowns), Save button restyled;
  all validation logic (amount > 0, category/paid-by must resolve to a real
  selection, the owner-dropdown guard) stays exactly as already
  implemented and tested — this file's existing 5 widget tests must keep
  passing against the restyled widget tree (tests locate elements by
  `Key`, not by visual appearance, so this should require no test changes).

## Testing

No new automated tests are required — this is a visual pass over
already-tested logic. The existing 21 tests (models, `ApiClient`, and the
confirm sheet's 5 widget tests, which assert on `Key`-located widgets and
`FilledButton.onPressed`, not on colors/fonts) must all still pass
unchanged. Manual verification on the emulator (already proven reachable
and working end-to-end in this session) confirms the new visuals render
correctly and no interaction regressed.

## Out of scope

Dark mode, animations/transitions beyond what already exists, app icon
changes (the penguin icon stays), any change to data fetching, validation,
or the three whole-system fixes already shipped (note-omission, 401
routing, storage-load error handling).
