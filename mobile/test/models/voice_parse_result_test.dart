import 'package:flutter_test/flutter_test.dart';
import 'package:piko/models/voice_parse_result.dart';

void main() {
  group('VoiceParseResult.fromJson', () {
    test('parses a successful result into a draft', () {
      final result = VoiceParseResult.fromJson({
        'ok': true,
        'draft': {
          'amount': 500,
          'categoryId': 'cat-1',
          'date': '2026-09-03',
          'note': 'groceries',
          'ownerMemberId': 'mem-1',
          'paidByMemberId': 'mem-1',
        },
      });

      expect(result.ok, isTrue);
      expect(result.draft, isNotNull);
      expect(result.draft!.amount, 500.0);
      expect(result.draft!.categoryId, 'cat-1');
    });

    test('parses a not-understood result with no draft', () {
      final result = VoiceParseResult.fromJson({'ok': false, 'reason': 'not_understood'});

      expect(result.ok, isFalse);
      expect(result.draft, isNull);
    });
  });
}
