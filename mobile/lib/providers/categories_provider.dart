import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/categories_result.dart';
import 'api_client_provider.dart';

final categoriesProvider = FutureProvider<CategoriesResult>((ref) async {
  final client = ref.watch(apiClientProvider);
  return client.fetchCategories();
});
