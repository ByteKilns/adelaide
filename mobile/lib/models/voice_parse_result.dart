import 'expense_draft.dart';

class VoiceParseResult {
  final bool ok;
  final ExpenseDraft? draft;

  VoiceParseResult({required this.ok, this.draft});

  factory VoiceParseResult.fromJson(Map<String, dynamic> json) {
    final ok = json['ok'] as bool;
    if (!ok) return VoiceParseResult(ok: false);

    final draftJson = json['draft'] as Map<String, dynamic>;
    return VoiceParseResult(
      ok: true,
      draft: ExpenseDraft(
        amount: (draftJson['amount'] as num).toDouble(),
        categoryId: draftJson['categoryId'] as String,
        ownerMemberId: draftJson['ownerMemberId'] as String?,
        paidByMemberId: draftJson['paidByMemberId'] as String,
        date: draftJson['date'] as String,
        note: draftJson['note'] as String?,
      ),
    );
  }
}
