"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechRecognitionErrorReason = "no-speech" | "not-allowed" | "other";

type State = {
  error: SpeechRecognitionErrorReason | null;
  interimTranscript: string;
  isListening: boolean;
  transcript: string;
};

const INITIAL_STATE: State = {
  error: null,
  interimTranscript: "",
  isListening: false,
  transcript: "",
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [state, setState] = useState<State>(INITIAL_STATE);

  const start = useCallback(() => {
    if (recognitionRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setState({ ...INITIAL_STATE, error: "other" });
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setState((s) => ({ ...s, interimTranscript: interim, transcript: finalTranscript }));
    };

    recognition.onerror = (event) => {
      const reason: SpeechRecognitionErrorReason =
        event.error === "no-speech" ? "no-speech" : event.error === "not-allowed" ? "not-allowed" : "other";
      setState((s) => ({ ...s, error: reason, isListening: false }));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setState((s) => ({ ...s, isListening: false }));
    };

    recognitionRef.current = recognition;
    setState({ ...INITIAL_STATE, isListening: true });
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognitionRef.current = null;
    recognition.stop();
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (!recognition) return;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
      recognition.stop();
    };
  }, []);

  return { ...state, start, stop };
}
