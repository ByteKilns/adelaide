class ExpenseDraft {
  final double amount;
  final String categoryId;
  final String? ownerMemberId;
  final String paidByMemberId;
  final String date;
  final String? note;

  ExpenseDraft({
    required this.amount,
    required this.categoryId,
    required this.ownerMemberId,
    required this.paidByMemberId,
    required this.date,
    this.note,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'categoryId': categoryId,
        'ownerMemberId': ownerMemberId,
        'paidByMemberId': paidByMemberId,
        'date': date,
        if (note != null) 'note': note,
      };

  ExpenseDraft copyWith({
    double? amount,
    String? categoryId,
    String? ownerMemberId,
    bool ownerMemberIdSet = false,
    String? paidByMemberId,
    String? date,
    String? note,
    bool noteSet = false,
  }) {
    return ExpenseDraft(
      amount: amount ?? this.amount,
      categoryId: categoryId ?? this.categoryId,
      ownerMemberId: ownerMemberIdSet ? ownerMemberId : this.ownerMemberId,
      paidByMemberId: paidByMemberId ?? this.paidByMemberId,
      date: date ?? this.date,
      note: noteSet ? note : (note ?? this.note),
    );
  }
}
