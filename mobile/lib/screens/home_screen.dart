import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/expense_draft.dart';
import '../providers/api_client_provider.dart';
import '../providers/categories_provider.dart';
import '../providers/expenses_provider.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/expense_confirm_sheet.dart';
import '../widgets/expense_list_tile.dart';
import 'settings_screen.dart';
import 'voice_capture_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _openVoiceFlow(BuildContext context, WidgetRef ref) async {
    final draft = await Navigator.of(context).push<ExpenseDraft?>(
      MaterialPageRoute(builder: (_) => const VoiceCaptureScreen()),
    );
    if (draft != null && context.mounted) {
      await _openConfirmSheet(context, ref, draft);
    }
  }

  Future<void> _openManualEntry(BuildContext context, WidgetRef ref) async {
    final categories = ref.read(categoriesProvider).valueOrNull;
    final firstCategoryId = categories?.categories.firstOrNull?.id ?? '';
    final firstMemberId = categories?.members.firstOrNull?.id ?? '';
    final today = DateTime.now();
    final dateStr =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    final draft = ExpenseDraft(
      amount: 0,
      categoryId: firstCategoryId,
      ownerMemberId: null,
      paidByMemberId: firstMemberId,
      date: dateStr,
      note: null,
    );
    await _openConfirmSheet(context, ref, draft);
  }

  Future<void> _openConfirmSheet(BuildContext context, WidgetRef ref, ExpenseDraft draft) async {
    final categoriesResult = ref.read(categoriesProvider).valueOrNull;
    if (categoriesResult == null) return;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
        child: ExpenseConfirmSheet(
          initialDraft: draft,
          categories: categoriesResult.categories,
          members: categoriesResult.members,
          onSave: (finalDraft) async {
            final client = ref.read(apiClientProvider);
            try {
              await client.createExpense(finalDraft);
              ref.invalidate(recentExpensesProvider);
              if (sheetContext.mounted) Navigator.of(sheetContext).pop();
            } on ApiException catch (e) {
              if (sheetContext.mounted) {
                ScaffoldMessenger.of(sheetContext).showSnackBar(SnackBar(content: Text(e.message)));
              }
            }
          },
        ),
      ),
    );
  }

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
}
