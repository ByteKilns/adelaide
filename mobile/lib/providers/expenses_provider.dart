import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/expense.dart';
import 'api_client_provider.dart';

final recentExpensesProvider = FutureProvider.autoDispose<List<Expense>>((ref) async {
  final client = ref.watch(apiClientProvider);
  return client.fetchRecentExpenses();
});
