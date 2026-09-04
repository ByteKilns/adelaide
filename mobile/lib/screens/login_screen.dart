// mobile/lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/api_client_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'settings_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final baseUrl = ref.read(serverUrlProvider).value!;
      final client = ref.read(apiClientProvider);
      final token = await client.login(baseUrl, _emailController.text.trim(), _passwordController.text);
      await ref.read(authProvider.notifier).setToken(token);
      if (mounted) {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not reach the server. Check your connection or the server URL.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.auto_awesome, color: Colors.white),
              ),
              const SizedBox(height: 32),
              const Text('PERSONAL SPENDING, SIMPLIFIED', style: AppTheme.eyebrow),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: AppTheme.headline,
                  children: [
                    const TextSpan(text: 'Know where '),
                    TextSpan(
                      text: 'your money',
                      style: AppTheme.headline.copyWith(color: AppColors.primary, fontStyle: FontStyle.italic),
                    ),
                    const TextSpan(text: ' goes.'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'A calmer way to capture everyday expenses — by voice or in a few taps.',
                style: AppTheme.subtitle,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email', hintText: 'you@example.com'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password', hintText: '••••••••'),
                obscureText: true,
                onSubmitted: (_) => _submitting ? null : _submit(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Log in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
