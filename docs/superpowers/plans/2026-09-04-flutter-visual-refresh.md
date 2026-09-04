# Flutter App Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every screen of the already-working "Piko" Flutter app with a
soft-lavender, card-based design system and a bundled Space Grotesk typeface,
matching the two reference mockups, with no functional/logic changes.

**Architecture:** A new `lib/theme/app_theme.dart` (colors, `ThemeData`, shared
text styles) and `lib/theme/category_style.dart` (a pure icon/color mapping
function, unit tested) are consumed by every screen's `build()` method. Only
`build()` methods and static widget trees change — state fields, providers,
API calls, and validation logic in every screen are untouched.

**Tech Stack:** Flutter/Dart, bundled Space Grotesk `.ttf` fonts (no new
package dependencies).

**Scope note:** Presentation-layer only. See the design doc at
[docs/superpowers/specs/2026-09-04-flutter-visual-refresh-design.md](../specs/2026-09-04-flutter-visual-refresh-design.md)
and the app's existing implementation plan at
[docs/superpowers/plans/2026-09-03-flutter-mobile-app.md](2026-09-03-flutter-mobile-app.md).
All 21 existing tests (`mobile/test/`) must keep passing unchanged throughout
— none of them assert on colors or fonts, only on `Key`-located widgets and
button enabled/disabled state.

---

## Task 1: Bundle the Space Grotesk font

**Files:**
- Create: `mobile/assets/fonts/SpaceGrotesk-Regular.ttf`
- Create: `mobile/assets/fonts/SpaceGrotesk-Medium.ttf`
- Create: `mobile/assets/fonts/SpaceGrotesk-Bold.ttf`
- Modify: `mobile/pubspec.yaml`

- [ ] **Step 1: Download the font files**

These URLs are verified working (return real TrueType font binaries, not
HTML) — Space Grotesk is SIL Open Font License, from its own open-source
repository:

```bash
cd mobile
mkdir -p assets/fonts
curl -sL -o assets/fonts/SpaceGrotesk-Regular.ttf "https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Regular.ttf"
curl -sL -o assets/fonts/SpaceGrotesk-Medium.ttf "https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Medium.ttf"
curl -sL -o assets/fonts/SpaceGrotesk-Bold.ttf "https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Bold.ttf"
```

- [ ] **Step 2: Verify the downloads are real font files, not error pages**

Run: `file assets/fonts/*.ttf`

Expected: all three report `TrueType Font data` (not `HTML document` or
`ASCII text`). If any one doesn't, the download failed — check the URL and
retry that one file specifically before continuing.

- [ ] **Step 3: Declare the font family in `pubspec.yaml`**

Add this `fonts:` block inside the existing `flutter:` section (replacing
the commented-out example fonts block that's currently there):

```yaml
  fonts:
    - family: SpaceGrotesk
      fonts:
        - asset: assets/fonts/SpaceGrotesk-Regular.ttf
        - asset: assets/fonts/SpaceGrotesk-Medium.ttf
          weight: 500
        - asset: assets/fonts/SpaceGrotesk-Bold.ttf
          weight: 700
```

- [ ] **Step 4: Verify**

Run: `flutter pub get` then `flutter analyze`

Expected: both succeed with no errors (the font isn't referenced by any
Dart code yet, so this just confirms the pubspec is valid YAML and the
asset paths resolve).

- [ ] **Step 5: Commit**

```bash
git add mobile/assets/fonts mobile/pubspec.yaml
git commit -m "feat(mobile): bundle Space Grotesk font files"
```

---

## Task 2: App theme and wiring into `main.dart`

**Files:**
- Create: `mobile/lib/theme/app_theme.dart`
- Modify: `mobile/lib/main.dart`

- [ ] **Step 1: Implement the theme**

```dart
// mobile/lib/theme/app_theme.dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const background = Color(0xFFF5F1FA);
  static const surface = Color(0xFFFFFFFF);
  static const primary = Color(0xFF5B3FA6);
  static const textPrimary = Color(0xFF1A1625);
  static const textMuted = Color(0xFF8A8398);
}

class AppTheme {
  AppTheme._();

  static const eyebrow = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w500,
    fontSize: 12,
    letterSpacing: 1.5,
    color: AppColors.textMuted,
  );

  static const headline = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w700,
    fontSize: 32,
    color: AppColors.textPrimary,
    height: 1.15,
  );

  static const wordmark = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w700,
    fontSize: 32,
    color: AppColors.textPrimary,
  );

  static const sectionHeading = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontWeight: FontWeight.w700,
    fontSize: 20,
    color: AppColors.textPrimary,
  );

  static const subtitle = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontSize: 15,
    color: AppColors.textMuted,
  );

  static ThemeData get theme {
    final base = ThemeData(
      useMaterial3: true,
      colorSchemeSeed: AppColors.primary,
      fontFamily: 'SpaceGrotesk',
    );

    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: AppColors.textMuted.withValues(alpha: 0.25)),
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.primary,
        surface: AppColors.surface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontFamily: 'SpaceGrotesk',
          fontWeight: FontWeight.w700,
          fontSize: 22,
          color: AppColors.textPrimary,
        ),
      ),
      textTheme: base.textTheme.apply(
        fontFamily: 'SpaceGrotesk',
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        labelStyle: const TextStyle(color: AppColors.textMuted, fontFamily: 'SpaceGrotesk'),
        hintStyle: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.6), fontFamily: 'SpaceGrotesk'),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.textPrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w500, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w500, fontSize: 16),
        ),
      ),
    );
  }
}
```

Note: `Color.withValues(alpha: ...)` is the current (non-deprecated) API on
this Flutter version — don't use the older `withOpacity`, which triggers a
`deprecated_member_use` lint on Flutter 3.27+.

- [ ] **Step 2: Wire it into `main.dart`**

Replace the `theme:` line in `PikoApp.build`:

```dart
theme: ThemeData(colorSchemeSeed: Colors.deepPurple, useMaterial3: true),
```

with:

```dart
theme: AppTheme.theme,
```

And add the import at the top of `mobile/lib/main.dart`, alongside the
existing ones:

```dart
import 'theme/app_theme.dart';
```

- [ ] **Step 3: Verify**

Run: `flutter analyze`

Expected: no errors. Fix anything the analyzer flags (e.g. if a Material API
used above has a different name/signature on the resolved Flutter version —
check the exact error and adjust that one line, the overall theme structure
shouldn't need to change).

Run: `flutter test`

Expected: all 21 tests still pass (this task doesn't touch any tested
widget's structure, only the global theme, and none of the tests assert on
theme values).

- [ ] **Step 4: Commit**

```bash
git add mobile/lib/theme/app_theme.dart mobile/lib/main.dart
git commit -m "feat(mobile): add app theme with Space Grotesk typography"
```

---

## Task 3: Category icon/color mapper, unit tested

**Files:**
- Create: `mobile/lib/theme/category_style.dart`
- Test: `mobile/test/theme/category_style_test.dart`

- [ ] **Step 1: Write the failing tests**

```dart
// mobile/test/theme/category_style_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:piko/theme/category_style.dart';

void main() {
  group('styleFor', () {
    test('matches a keyword case-insensitively', () {
      final lower = styleFor('groceries');
      final mixed = styleFor('Groceries');
      expect(lower.icon, Icons.local_grocery_store);
      expect(mixed.icon, Icons.local_grocery_store);
    });

    test('falls back to the default icon for an unmatched category name', () {
      final style = styleFor('Miscellaneous');
      expect(style.icon, Icons.category);
    });

    test('returns the same icon and colors for the same category name across calls', () {
      final a = styleFor('Transportation');
      final b = styleFor('Transportation');
      expect(a.icon, b.icon);
      expect(a.background, b.background);
      expect(a.foreground, b.foreground);
    });

    test('returns a background/foreground pair from the fixed palette', () {
      final style = styleFor('Anything');
      expect(style.background, isA<Color>());
      expect(style.foreground, isA<Color>());
    });
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `flutter test test/theme/category_style_test.dart`

Expected: FAIL — `Target of URI doesn't exist: 'package:piko/theme/category_style.dart'`.

- [ ] **Step 3: Implement it**

```dart
// mobile/lib/theme/category_style.dart
import 'package:flutter/material.dart';

class CategoryStyle {
  final IconData icon;
  final Color background;
  final Color foreground;

  const CategoryStyle({required this.icon, required this.background, required this.foreground});
}

const _palette = [
  (background: Color(0xFFF3E8FF), foreground: Color(0xFF7C3AED)),
  (background: Color(0xFFFCE7F3), foreground: Color(0xFFDB2777)),
  (background: Color(0xFFDBEAFE), foreground: Color(0xFF2563EB)),
  (background: Color(0xFFDCFCE7), foreground: Color(0xFF16A34A)),
  (background: Color(0xFFFFEDD5), foreground: Color(0xFFEA580C)),
];

const _keywordIcons = <String, IconData>{
  'food': Icons.restaurant,
  'lunch': Icons.restaurant,
  'dinner': Icons.restaurant,
  'breakfast': Icons.restaurant,
  'grocery': Icons.local_grocery_store,
  'groceries': Icons.local_grocery_store,
  'transport': Icons.directions_car,
  'petrol': Icons.local_gas_station,
  'fuel': Icons.local_gas_station,
  'car': Icons.directions_car,
  'shop': Icons.shopping_bag,
  'cloth': Icons.shopping_bag,
  'cosmetic': Icons.shopping_bag,
  'medic': Icons.medical_services,
  'health': Icons.medical_services,
  'pharmacy': Icons.medical_services,
  'mobile': Icons.phone_iphone,
  'phone': Icons.phone_iphone,
  'internet': Icons.wifi,
  'bill': Icons.receipt_long,
  'rent': Icons.home,
  'date': Icons.favorite,
  'gift': Icons.card_giftcard,
  'travel': Icons.flight,
  'entertainment': Icons.movie,
};

const _defaultIcon = Icons.category;

IconData _iconFor(String categoryName) {
  final lower = categoryName.toLowerCase();
  for (final entry in _keywordIcons.entries) {
    if (lower.contains(entry.key)) return entry.value;
  }
  return _defaultIcon;
}

CategoryStyle styleFor(String categoryName) {
  final icon = _iconFor(categoryName);
  // Dart's `%` on int always returns a non-negative result when the divisor
  // is positive, so this is safe for any hashCode without needing `.abs()`.
  final index = categoryName.hashCode % _palette.length;
  final colors = _palette[index];
  return CategoryStyle(icon: icon, background: colors.background, foreground: colors.foreground);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `flutter test test/theme/category_style_test.dart`

Expected: PASS — 4 tests green.

- [ ] **Step 5: Full analyze and test run**

Run: `flutter analyze` — expected: no errors.
Run: `flutter test` — expected: all 25 tests pass (21 previous + 4 new).

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/theme/category_style.dart mobile/test/theme/category_style_test.dart
git commit -m "feat(mobile): add category icon/color mapper, unit tested"
```

---

## Task 4: Redesign the Login screen

**Files:**
- Modify: `mobile/lib/screens/login_screen.dart`

Only the `build()` method changes. Every state field, `_submit()`, and
`dispose()` stay byte-identical — do not touch them.

- [ ] **Step 1: Replace the imports and `build()` method**

Add this import alongside the existing ones at the top of the file:

```dart
import '../theme/app_theme.dart';
```

Replace the entire `build()` method with:

```dart
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.auto_awesome, color: Colors.white),
              ),
              const SizedBox(height: 32),
              const Text('PERSONAL SPENDING, SIMPLIFIED', style: AppTheme.eyebrow),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: AppTheme.headline,
                  children: [
                    const TextSpan(text: 'Know where '),
                    TextSpan(
                      text: 'your money',
                      style: AppTheme.headline.copyWith(color: AppColors.primary, fontStyle: FontStyle.italic),
                    ),
                    const TextSpan(text: ' goes.'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'A calmer way to capture everyday expenses — by voice or in a few taps.',
                style: AppTheme.subtitle,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email', hintText: 'you@example.com'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password', hintText: '••••••••'),
                obscureText: true,
                onSubmitted: (_) => _submitting ? null : _submit(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Log in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
```

Confirm no "Create an account" / sign-up link is present anywhere in this
file — there shouldn't be, since none of the code above adds one.

- [ ] **Step 2: Verify**

Run: `flutter analyze` — expected: no errors.
Run: `flutter test` — expected: all 25 tests still pass (Login has no
dedicated tests, but this confirms nothing else broke).

- [ ] **Step 3: Commit**

```bash
git add mobile/lib/screens/login_screen.dart
git commit -m "feat(mobile): redesign Login screen with new visual style"
```

---

## Task 5: Redesign the Home screen and expense list card

**Files:**
- Modify: `mobile/lib/screens/home_screen.dart`
- Modify: `mobile/lib/widgets/expense_list_tile.dart`

All handler methods (`_openVoiceFlow`, `_openManualEntry`,
`_openConfirmSheet`) stay exactly as they are — only `build()` changes, plus
one small addition to `_openConfirmSheet`'s `showModalBottomSheet` call
(giving the sheet rounded top corners, matching the new card-based look).

- [ ] **Step 1: Add the rounded-top-corners shape to the bottom sheet**

In `_openConfirmSheet`, add a `shape:` parameter to the existing
`showModalBottomSheet` call:

```dart
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheetContext) => Padding(
```

(Everything else in `_openConfirmSheet`, `_openVoiceFlow`, and
`_openManualEntry` is unchanged.)

- [ ] **Step 2: Replace imports and `build()`**

Add this import alongside the existing ones:

```dart
import '../theme/app_theme.dart';
```

Replace the entire `build()` method with:

```dart
  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expensesAsync = ref.watch(recentExpensesProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_greeting(), style: AppTheme.eyebrow),
                        const SizedBox(height: 4),
                        const Text('Piko.', style: AppTheme.wordmark),
                      ],
                    ),
                  ),
                  IconButton(
                    style: IconButton.styleFrom(backgroundColor: AppColors.surface, shape: const CircleBorder()),
                    icon: const Icon(Icons.settings_outlined, color: AppColors.textPrimary),
                    onPressed: () =>
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ACTIVITY', style: AppTheme.eyebrow),
                        SizedBox(height: 4),
                        Text('Recent expenses', style: AppTheme.sectionHeading),
                      ],
                    ),
                  ),
                  expensesAsync.maybeWhen(
                    data: (expenses) =>
                        Text('${expenses.length} entries', style: const TextStyle(color: AppColors.textMuted)),
                    orElse: () => const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async => ref.invalidate(recentExpensesProvider),
                child: expensesAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (error, _) => ListView(
                    children: [
                      const SizedBox(height: 80),
                      Center(child: Text('Could not load expenses: $error')),
                    ],
                  ),
                  data: (expenses) {
                    if (expenses.isEmpty) {
                      return ListView(
                        children: const [
                          SizedBox(height: 80),
                          Center(child: Text('No expenses yet — tap the mic to add one.')),
                        ],
                      );
                    }
                    final categories = categoriesAsync.valueOrNull?.categories ?? [];
                    return ListView.builder(
                      padding: const EdgeInsets.fromLTRB(24, 8, 24, 120),
                      itemCount: expenses.length,
                      itemBuilder: (context, index) {
                        final expense = expenses[index];
                        final category = categories.firstWhereOrNull((c) => c.id == expense.categoryId);
                        return ExpenseListTile(expense: expense, category: category);
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'manual-add',
            backgroundColor: AppColors.textPrimary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            onPressed: () => _openManualEntry(context, ref),
            child: const Icon(Icons.edit, color: Colors.white),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.large(
            heroTag: 'voice-add',
            backgroundColor: AppColors.primary,
            onPressed: () => _openVoiceFlow(context, ref),
            child: const Icon(Icons.mic, color: Colors.white),
          ),
        ],
      ),
    );
  }
```

- [ ] **Step 3: Redesign the expense list card**

Replace the full contents of `mobile/lib/widgets/expense_list_tile.dart`:

```dart
import 'package:flutter/material.dart';

import '../models/category_option.dart';
import '../models/expense.dart';
import '../theme/app_theme.dart';
import '../theme/category_style.dart';

class ExpenseListTile extends StatelessWidget {
  final Expense expense;
  final CategoryOption? category;

  const ExpenseListTile({super.key, required this.expense, required this.category});

  @override
  Widget build(BuildContext context) {
    final name = category?.name ?? 'Uncategorized';
    final style = styleFor(name);
    final subtitle = '${expense.date}${expense.note != null ? ' · ${expense.note}' : ''}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: AppColors.textMuted.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: style.background, shape: BoxShape.circle),
            child: Center(child: Icon(style.icon, color: style.foreground, size: 22)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
              ],
            ),
          ),
          Text(
            'NPR ${expense.amount.toStringAsFixed(0)}',
            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Verify**

Run: `flutter analyze` — expected: no errors.
Run: `flutter test` — expected: all 25 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/screens/home_screen.dart mobile/lib/widgets/expense_list_tile.dart
git commit -m "feat(mobile): redesign Home screen and expense card with category chips"
```

---

## Task 6: Redesign the Settings screen

**Files:**
- Modify: `mobile/lib/screens/settings_screen.dart`

Only `build()` changes — all state fields and logic stay identical.

- [ ] **Step 1: Replace imports and `build()`**

Add this import alongside the existing ones:

```dart
import '../theme/app_theme.dart';
```

Replace the entire `build()` method with:

```dart
  @override
  Widget build(BuildContext context) {
    final serverUrl = ref.watch(serverUrlProvider);
    final isLoggedIn = ref.watch(authProvider).value != null;

    if (!_initialized && serverUrl.hasValue) {
      _urlController.text = serverUrl.value!;
      _initialized = true;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('SERVER', style: AppTheme.eyebrow),
              const SizedBox(height: 12),
              TextField(
                controller: _urlController,
                decoration: const InputDecoration(labelText: 'Server URL'),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  final url = _urlController.text.trim();
                  if (url.isEmpty) return;
                  await ref.read(serverUrlProvider.notifier).setUrl(url);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Server URL saved')),
                    );
                  }
                },
                child: const Text('Save'),
              ),
              if (isLoggedIn) ...[
                const SizedBox(height: 40),
                const Text('ACCOUNT', style: AppTheme.eyebrow),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: const Text('Log out'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
```

- [ ] **Step 2: Verify**

Run: `flutter analyze` — expected: no errors.
Run: `flutter test` — expected: all 25 tests still pass.

- [ ] **Step 3: Commit**

```bash
git add mobile/lib/screens/settings_screen.dart
git commit -m "feat(mobile): redesign Settings screen with new visual style"
```

---

## Task 7: Redesign the voice capture screen

**Files:**
- Modify: `mobile/lib/screens/voice_capture_screen.dart`

Only `build()` and `_buildBody()` change — the state machine
(`_startListening`, `_stopAndParse`, `_parse`, `_emptyDraft`, `dispose`) and
all their `mounted` guards stay byte-identical. Do not touch anything except
the two build methods listed below.

- [ ] **Step 1: Replace imports**

Add this import alongside the existing ones:

```dart
import '../theme/app_theme.dart';
```

- [ ] **Step 2: Replace `build()` and `_buildBody()`**

```dart
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add by voice')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(child: _buildBody()),
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_stage) {
      case _VoiceStage.listening:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Icon(Icons.mic, size: 40, color: Colors.white),
            ),
            const SizedBox(height: 24),
            Text(
              _transcript.isEmpty ? 'Listening… say what you spent.' : _transcript,
              textAlign: TextAlign.center,
              style: const TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 16, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _stopAndParse,
              icon: const Icon(Icons.stop),
              label: const Text('Stop'),
            ),
          ],
        );
      case _VoiceStage.parsing:
        return const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 16),
            Text('Understanding…', style: TextStyle(fontFamily: 'SpaceGrotesk', color: AppColors.textPrimary)),
          ],
        );
      case _VoiceStage.notUnderstood:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _notUnderstoodMessage ?? 'Not understood.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontFamily: 'SpaceGrotesk', color: AppColors.textPrimary),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              alignment: WrapAlignment.center,
              children: [
                OutlinedButton(onPressed: _startListening, child: const Text('Try again')),
                if (_transcript.isNotEmpty)
                  OutlinedButton(
                    onPressed: () => _parse(_transcript),
                    child: const Text('Retry parsing'),
                  ),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(_emptyDraft()),
                  child: const Text('Add manually'),
                ),
              ],
            ),
          ],
        );
    }
  }
```

- [ ] **Step 3: Verify**

Run: `flutter analyze` — expected: no errors.
Run: `flutter test` — expected: all 25 tests still pass.

- [ ] **Step 4: Commit**

```bash
git add mobile/lib/screens/voice_capture_screen.dart
git commit -m "feat(mobile): redesign voice capture screen with new visual style"
```

---

## Task 8: Redesign the expense confirm/edit sheet

**Files:**
- Modify: `mobile/lib/widgets/expense_confirm_sheet.dart`

**Critical constraint:** every `Key` (`amount-field`, `category-field`,
`paid-by-field`, `owner-field`, `note-field`, `save-button`) must stay
exactly as-is — the 5 existing widget tests in
`mobile/test/widgets/expense_confirm_sheet_test.dart` locate elements by
these keys and must keep passing unmodified. All state fields and methods
(`_amount`, `_canSave`, `initState`, `_formatAmount`, `_save`, `_pickDate`)
stay byte-identical — only `build()` changes.

- [ ] **Step 1: Replace the import and `build()` method**

Add this import alongside the existing ones:

```dart
import '../theme/app_theme.dart';
```

Replace the entire `build()` method with:

```dart
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)),
            ),
          ),
          TextField(
            key: const Key('amount-field'),
            controller: _amountController,
            decoration: const InputDecoration(labelText: 'Amount'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 20, fontWeight: FontWeight.w600),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            key: const Key('category-field'),
            value: widget.categories.any((c) => c.id == _categoryId) ? _categoryId : null,
            decoration: const InputDecoration(labelText: 'Category'),
            items: widget.categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
            onChanged: (value) => setState(() => _categoryId = value!),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            key: const Key('paid-by-field'),
            value: widget.members.any((m) => m.id == _paidByMemberId) ? _paidByMemberId : null,
            decoration: const InputDecoration(labelText: 'Paid by'),
            items: widget.members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.name))).toList(),
            onChanged: (value) => setState(() => _paidByMemberId = value!),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            key: const Key('owner-field'),
            value: _ownerMemberId == null || widget.members.any((m) => m.id == _ownerMemberId) ? _ownerMemberId : null,
            decoration: const InputDecoration(labelText: 'For'),
            items: [
              const DropdownMenuItem<String>(value: null, child: Text('Shared')),
              ...widget.members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.name))),
            ],
            onChanged: (value) => setState(() => _ownerMemberId = value),
          ),
          const SizedBox(height: 14),
          InkWell(
            onTap: _pickDate,
            borderRadius: BorderRadius.circular(14),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Date'),
              child: Text(_date, style: const TextStyle(fontFamily: 'SpaceGrotesk', color: AppColors.textPrimary)),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            key: const Key('note-field'),
            controller: _noteController,
            decoration: const InputDecoration(labelText: 'Note (optional)'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            key: const Key('save-button'),
            onPressed: _canSave ? _save : null,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Save'),
          ),
        ],
      ),
    );
  }
```

- [ ] **Step 2: Run the confirm sheet's own tests first**

Run: `flutter test test/widgets/expense_confirm_sheet_test.dart`

Expected: all 5 tests still pass, unmodified. If any fail, the failure will
be because a `Key` was accidentally changed or removed — compare your
`build()` against the keys listed in the constraint above and fix, don't
change the test file.

- [ ] **Step 3: Full verify**

Run: `flutter analyze` — expected: no errors.
Run: `flutter test` — expected: all 25 tests pass.

- [ ] **Step 4: Commit**

```bash
git add mobile/lib/widgets/expense_confirm_sheet.dart
git commit -m "feat(mobile): redesign expense confirm/edit sheet with new visual style"
```

---

## Task 9: Final verification — full app, real device

**Files:** none (verification only, plus fixing anything it surfaces).

- [ ] **Step 1: Full automated suite**

Run: `flutter analyze` — expected: no errors (a handful of pre-existing
info-level lints from before this plan are fine; no NEW errors or warnings).
Run: `flutter test` — expected: all 25 tests pass.

- [ ] **Step 2: Release build**

Run: `flutter build apk --release`

Expected: succeeds, producing `mobile/build/app/outputs/flutter-apk/app-release.apk`.

- [ ] **Step 3: Manual verification on a real device/emulator**

If an Android device or emulator is available (check with `flutter
devices`), install the new build and walk through every screen: Login
(headline/subtitle/inputs render with Space Grotesk, no signup link),
Home (greeting, wordmark, card list with category icon chips, both FABs),
manual add → confirm sheet (rounded sheet, styled fields, Save
enables/disables exactly as before), voice add (mic circle, listening/
parsing/not-understood states), Settings (styled fields, Log out), and
confirm the logout-returns-to-Login and note-omission-still-saves behaviors
from the previous plan still work (this plan didn't touch that logic, but
worth confirming the restyled widgets still trigger it correctly).

If no device is available, report that plainly rather than fabricating a
walkthrough — the automated suite (Step 1) and release build (Step 2) are
still real signals that the code is correct even without a visual pass.

- [ ] **Step 4: No commit needed** unless Step 1-3 surfaces a real bug, in
which case fix it as a small new commit and re-run Steps 1-3.

---

## What's next

Once you've used the restyled app for a bit, the "Out of scope" items in
the design doc (dark mode, animations, app icon changes) are the natural
next candidates if you want to keep iterating on the look.
