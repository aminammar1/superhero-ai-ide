"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface UseAudioRecorderOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useAudioRecorder(options?: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick a supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone quickly
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Sanity check – don't send near-empty recordings
        if (blob.size < 1000) {
          optionsRef.current?.onError?.("Recording too short. Hold the mic button longer.");
          return;
        }

        const formData = new FormData();
        formData.append("file", blob, `recording.${mimeType.includes("webm") ? "webm" : "mp4"}`);

        toast.loading("Transcribing audio…", { id: "stt-toast" });
        try {
          const res = await fetch("/api/voice/stt", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
          }

          const data = await res.json();
          toast.success("Transcription complete!", { id: "stt-toast" });
          if (data.transcript) {
            optionsRef.current?.onResult?.(data.transcript);
          } else {
            optionsRef.current?.onError?.("No speech detected. Try speaking louder or closer to the mic.");
          }
        } catch (error: any) {
          toast.error(`Transcription failed: ${error.message}`, { id: "stt-toast" });
          optionsRef.current?.onError?.(error.message);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      optionsRef.current?.onError?.("Could not access microphone. Check browser permissions.");
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
}
