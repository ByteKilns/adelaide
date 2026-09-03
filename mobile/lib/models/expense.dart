export 'expense_draft.dart';

class Expense {
  final String id;
  final double amount;
  final String categoryId;
  final String? ownerMemberId;
  final String paidByMemberId;
  final String date;
  final String? note;

  Expense({
    required this.id,
    required this.amount,
    required this.categoryId,
    required this.ownerMemberId,
    required this.paidByMemberId,
    required this.date,
    required this.note,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      categoryId: json['categoryId'] as String,
      ownerMemberId: json['ownerMemberId'] as String?,
      paidByMemberId: json['paidByMemberId'] as String,
      date: json['date'] as String,
      note: json['note'] as String?,
    );
  }
}
