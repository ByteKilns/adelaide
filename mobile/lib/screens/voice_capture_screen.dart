import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../models/expense_draft.dart';
import '../providers/api_client_provider.dart';
import '../providers/categories_provider.dart';
import '../services/api_client.dart';

enum _VoiceStage { listening, parsing, notUnderstood }

class VoiceCaptureScreen extends ConsumerStatefulWidget {
  const VoiceCaptureScreen({super.key});

  @override
  ConsumerState<VoiceCaptureScreen> createState() => _VoiceCaptureScreenState();
}

class _VoiceCaptureScreenState extends ConsumerState<VoiceCaptureScreen> {
  final stt.SpeechToText _speech = stt.SpeechToText();
  _VoiceStage _stage = _VoiceStage.listening;
  String _transcript = '';
  String? _notUnderstoodMessage;

  @override
  void initState() {
    super.initState();
    _startListening();
  }

  @override
  void dispose() {
    _speech.stop();
    super.dispose();
  }

  Future<void> _startListening() async {
    final available = await _speech.initialize(
      onError: (error) {
        if (!mounted) return;
        setState(() {
          _stage = _VoiceStage.notUnderstood;
          _notUnderstoodMessage = 'Microphone error: ${error.errorMsg}';
        });
      },
    );

    if (!available) {
      setState(() {
        _stage = _VoiceStage.notUnderstood;
        _notUnderstoodMessage = "Voice input isn't available on this device.";
      });
      return;
    }

    setState(() {
      _stage = _VoiceStage.listening;
      _transcript = '';
    });

    await _speech.listen(
      onResult: (result) {
        if (!mounted) return;
        setState(() => _transcript = result.recognizedWords);
      },
    );
  }

  Future<void> _stopAndParse() async {
    await _speech.stop();
    final transcript = _transcript.trim();
    if (transcript.isEmpty) {
      setState(() {
        _stage = _VoiceStage.notUnderstood;
        _notUnderstoodMessage = "Didn't catch anything — try again.";
      });
      return;
    }
    await _parse(transcript);
  }

  Future<void> _parse(String transcript) async {
    setState(() => _stage = _VoiceStage.parsing);

    try {
      final client = ref.read(apiClientProvider);
      final result = await client.parseVoiceTranscript(transcript);
      if (!mounted) return;

      if (result.ok && result.draft != null) {
        Navigator.of(context).pop(result.draft);
        return;
      }

      setState(() {
        _stage = _VoiceStage.notUnderstood;
        _notUnderstoodMessage = "Couldn't quite catch that as an expense — try rephrasing, or add it manually.";
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _stage = _VoiceStage.notUnderstood;
        _notUnderstoodMessage = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _stage = _VoiceStage.notUnderstood;
        _notUnderstoodMessage = 'Something went wrong — check your connection and try again.';
      });
    }
  }

  ExpenseDraft _emptyDraft() {
    final categories = ref.read(categoriesProvider).valueOrNull;
    final firstCategoryId = categories?.categories.firstOrNull?.id ?? '';
    final firstMemberId = categories?.members.firstOrNull?.id ?? '';
    final today = DateTime.now();
    final dateStr =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    return ExpenseDraft(
      amount: 0,
      categoryId: firstCategoryId,
      ownerMemberId: null,
      paidByMemberId: firstMemberId,
      date: dateStr,
      note: null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add by voice')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(child: _buildBody()),
      ),
    );
  }

  Widget _buildBody() {
    switch (_stage) {
      case _VoiceStage.listening:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.mic, size: 64, color: Colors.deepPurple),
            const SizedBox(height: 16),
            Text(
              _transcript.isEmpty ? 'Listening… say what you spent.' : _transcript,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _stopAndParse,
              icon: const Icon(Icons.stop),
              label: const Text('Stop'),
            ),
          ],
        );
      case _VoiceStage.parsing:
        return const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Understanding…'),
          ],
        );
      case _VoiceStage.notUnderstood:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_notUnderstoodMessage ?? 'Not understood.', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              alignment: WrapAlignment.center,
              children: [
                OutlinedButton(onPressed: _startListening, child: const Text('Try again')),
                if (_transcript.isNotEmpty)
                  OutlinedButton(
                    onPressed: () => _parse(_transcript),
                    child: const Text('Retry parsing'),
                  ),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(_emptyDraft()),
                  child: const Text('Add manually'),
                ),
              ],
            ),
          ],
        );
    }
  }
}
