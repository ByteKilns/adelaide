// mobile/lib/widgets/expense_confirm_sheet.dart
import 'package:flutter/material.dart';

import '../models/category_option.dart';
import '../models/expense_draft.dart';
import '../models/member_option.dart';

class ExpenseConfirmSheet extends StatefulWidget {
  final ExpenseDraft initialDraft;
  final List<CategoryOption> categories;
  final List<MemberOption> members;
  final Future<void> Function(ExpenseDraft draft) onSave;

  const ExpenseConfirmSheet({
    super.key,
    required this.initialDraft,
    required this.categories,
    required this.members,
    required this.onSave,
  });

  @override
  State<ExpenseConfirmSheet> createState() => _ExpenseConfirmSheetState();
}

class _ExpenseConfirmSheetState extends State<ExpenseConfirmSheet> {
  late TextEditingController _amountController;
  late TextEditingController _noteController;
  late String _categoryId;
  late String _paidByMemberId;
  late String? _ownerMemberId; // null = shared
  late String _date;
  bool _saving = false;

  double get _amount => double.tryParse(_amountController.text) ?? -1;
  bool get _canSave =>
      _amount > 0 &&
      !_saving &&
      widget.categories.any((c) => c.id == _categoryId) &&
      widget.members.any((m) => m.id == _paidByMemberId);

  @override
  void initState() {
    super.initState();
    final d = widget.initialDraft;
    _amountController = TextEditingController(text: d.amount > 0 ? _formatAmount(d.amount) : '');
    _noteController = TextEditingController(text: d.note ?? '');
    _categoryId = d.categoryId;
    _paidByMemberId = d.paidByMemberId;
    _ownerMemberId = d.ownerMemberId;
    _date = d.date;
  }

  String _formatAmount(double amount) {
    return amount == amount.roundToDouble() ? amount.toStringAsFixed(0) : amount.toString();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final draft = ExpenseDraft(
      amount: _amount,
      categoryId: _categoryId,
      ownerMemberId: _ownerMemberId,
      paidByMemberId: _paidByMemberId,
      date: _date,
      note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
    );
    try {
      await widget.onSave(draft);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final initial = DateTime.tryParse(_date) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(initial.year - 5),
      lastDate: DateTime(initial.year + 1),
    );
    if (picked != null) {
      setState(() {
        _date =
            '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            key: const Key('amount-field'),
            controller: _amountController,
            decoration: const InputDecoration(labelText: 'Amount'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: const Key('category-field'),
            value: widget.categories.any((c) => c.id == _categoryId) ? _categoryId : null,
            decoration: const InputDecoration(labelText: 'Category'),
            items: widget.categories
                .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                .toList(),
            onChanged: (value) => setState(() => _categoryId = value!),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: const Key('paid-by-field'),
            value: widget.members.any((m) => m.id == _paidByMemberId) ? _paidByMemberId : null,
            decoration: const InputDecoration(labelText: 'Paid by'),
            items: widget.members
                .map((m) => DropdownMenuItem(value: m.id, child: Text(m.name)))
                .toList(),
            onChanged: (value) => setState(() => _paidByMemberId = value!),
          ),
          const SizedBox(height: 12),
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
          const SizedBox(height: 12),
          InkWell(
            onTap: _pickDate,
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Date'),
              child: Text(_date),
            ),
          ),
          const SizedBox(height: 12),
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
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
    );
  }
}
