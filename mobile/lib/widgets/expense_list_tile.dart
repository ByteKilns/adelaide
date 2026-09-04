import 'package:flutter/material.dart';

import '../models/category_option.dart';
import '../models/expense.dart';

class ExpenseListTile extends StatelessWidget {
  final Expense expense;
  final CategoryOption? category;

  const ExpenseListTile({super.key, required this.expense, required this.category});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(category?.name ?? 'Uncategorized'),
      subtitle: Text('${expense.date}${expense.note != null ? ' · ${expense.note}' : ''}'),
      trailing: Text(
        'NPR ${expense.amount.toStringAsFixed(0)}',
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}
