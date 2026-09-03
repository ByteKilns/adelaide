import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_client.dart';
import '../services/settings_service.dart';
import 'auth_provider.dart';
import 'settings_provider.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    getBaseUrl: () => ref.read(serverUrlProvider).value ?? SettingsService.defaultUrl,
    getToken: () => ref.read(authProvider).value,
    onUnauthorized: () => ref.read(authProvider.notifier).logout(),
  );
});
