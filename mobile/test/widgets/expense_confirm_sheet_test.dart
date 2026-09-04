// mobile/test/widgets/expense_confirm_sheet_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:piko/models/category_option.dart';
import 'package:piko/models/expense_draft.dart';
import 'package:piko/models/member_option.dart';
import 'package:piko/widgets/expense_confirm_sheet.dart';

void main() {
  final categories = [CategoryOption(id: 'cat-1', name: 'Groceries'), CategoryOption(id: 'cat-2', name: 'Transport')];
  final members = [MemberOption(id: 'mem-1', name: 'Nirjal'), MemberOption(id: 'mem-2', name: 'Karuna')];

  ExpenseDraft draft({double amount = 500}) => ExpenseDraft(
        amount: amount,
        categoryId: 'cat-1',
        ownerMemberId: 'mem-1',
        paidByMemberId: 'mem-1',
        date: '2026-09-03',
        note: 'groceries',
      );

  Future<void> pumpSheet(
    WidgetTester tester, {
    required ExpenseDraft initialDraft,
    required void Function(ExpenseDraft) onSave,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExpenseConfirmSheet(
            initialDraft: initialDraft,
            categories: categories,
            members: members,
            onSave: (d) async => onSave(d),
          ),
        ),
      ),
    );
  }

  testWidgets('shows the prefilled amount and note', (tester) async {
    await pumpSheet(tester, initialDraft: draft(), onSave: (_) {});

    expect(find.text('500'), findsOneWidget);
    expect(find.text('groceries'), findsOneWidget);
  });

  testWidgets('Save is disabled when amount is zero or empty', (tester) async {
    await pumpSheet(tester, initialDraft: draft(amount: 0), onSave: (_) {});

    final saveButton = tester.widget<FilledButton>(find.byKey(const Key('save-button')));
    expect(saveButton.onPressed, isNull);
  });

  testWidgets('Save is enabled and calls onSave with the edited amount', (tester) async {
    ExpenseDraft? saved;
    await pumpSheet(tester, initialDraft: draft(), onSave: (d) => saved = d);

    await tester.enterText(find.byKey(const Key('amount-field')), '750');
    await tester.pump();

    final saveButton = tester.widget<FilledButton>(find.byKey(const Key('save-button')));
    expect(saveButton.onPressed, isNotNull);

    await tester.tap(find.byKey(const Key('save-button')));
    await tester.pump();

    expect(saved, isNotNull);
    expect(saved!.amount, 750);
  });

  testWidgets('negative amount keeps Save disabled', (tester) async {
    await pumpSheet(tester, initialDraft: draft(), onSave: (_) {});

    await tester.enterText(find.byKey(const Key('amount-field')), '-5');
    await tester.pump();

    final saveButton = tester.widget<FilledButton>(find.byKey(const Key('save-button')));
    expect(saveButton.onPressed, isNull);
  });
}
