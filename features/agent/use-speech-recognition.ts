"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechOptions {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options?: UseSpeechOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const Recognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!Recognition) {
      setSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
      }

      const transcript = (finalTranscript || interimTranscript).trim();
      if (transcript) {
        optionsRef.current?.onResult?.(transcript);
      }
    };

    recognition.onend = () => {
      optionsRef.current?.onEnd?.();
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        optionsRef.current?.onError?.("Microphone permission denied.");
      } else if (event.error === "no-speech") {
        optionsRef.current?.onError?.("No speech detected. Try again.");
      } else if (event.error !== "aborted") {
        optionsRef.current?.onError?.(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    try {
      recognitionRef.current?.start();
    } catch {
      // Already started
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, startListening, stopListening };
}
