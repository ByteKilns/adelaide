import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/token_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => SecureTokenStorage());

class AuthNotifier extends StateNotifier<AsyncValue<String?>> {
  final TokenStorage _storage;

  AuthNotifier(this._storage) : super(const AsyncValue.loading()) {
    _load();
  }

  Future<void> _load() async {
    state = AsyncValue.data(await _storage.readToken());
  }

  Future<void> setToken(String token) async {
    await _storage.writeToken(token);
    state = AsyncValue.data(token);
  }

  Future<void> logout() async {
    await _storage.clearToken();
    state = const AsyncValue.data(null);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<String?>>(
  (ref) => AuthNotifier(ref.watch(tokenStorageProvider)),
);
