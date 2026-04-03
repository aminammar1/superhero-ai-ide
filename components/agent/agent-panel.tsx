"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { AvatarStage } from "@/components/agent/avatar-stage";
import { ChatMessageBubble } from "@/components/agent/chat-message";
import { generateCode, requestTextToSpeech, streamChat } from "@/services/api";
import { useAppStore, type VoiceMode } from "@/store/app-store";
import { useFileStore } from "@/store/file-store";
import { useAudioRecorder } from "@/features/agent/use-audio-recorder";
import { useSpeechRecognition } from "@/features/agent/use-speech-recognition";
import { heroThemeMap } from "@/themes/superheroes";
import { HeroMotif } from "@/components/ui/hero-motif";
import { cn } from "@/lib/utils";

const VOICE_MODE_LABELS: Record<VoiceMode, string> = {
  "voice-voice": "Voice to Voice",
  "text-text": "Text to Text",
};

const CODE_TRIGGERS = [
  "generate code",
  "write code",
  "create a function",
  "create a class",
  "build me a",
  "implement a",
  "write me a",
  "code for",
  "make a component",
];

function looksLikeCodeRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return CODE_TRIGGERS.some((t) => lower.includes(t));
}

export function AgentPanel() {
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const code = useAppStore((s) => s.code);
  const messages = useAppStore((s) => s.messages);
  const transcript = useAppStore((s) => s.transcript);
  const isListening = useAppStore((s) => s.isListening);
  const isStreamingChat = useAppStore((s) => s.isStreamingChat);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const voiceMode = useAppStore((s) => s.voiceMode);
  const setCode = useAppStore((s) => s.setCode);
  const pushMessage = useAppStore((s) => s.pushMessage);
  const startAssistantMessage = useAppStore((s) => s.startAssistantMessage);
  const appendAssistantChunk = useAppStore((s) => s.appendAssistantChunk);
  const setStreamingChat = useAppStore((s) => s.setStreamingChat);
  const setListening = useAppStore((s) => s.setListening);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const setVoiceMode = useAppStore((s) => s.setVoiceMode);

  const [chatInput, setChatInput] = useState("");
  const [isExecutingSkill, setIsExecutingSkill] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingCodePrompt, setPendingCodePrompt] = useState<string | null>(null);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const welcomePlayedRef = useRef(false);
  const speechTranscriptRef = useRef("");

  const hero = heroThemeMap[theme];
  const usesVoiceInput = voiceMode === "voice-voice";
  const usesVoiceOutput = voiceEnabled && voiceMode === "voice-voice";

  const { startRecording: startRecordedListening, stopRecording: stopRecordedListening } = useAudioRecorder({
    onResult: (value: string) => {
      setListening(false);
      setTranscript(value);
      void handleSend(value);
    },
    onError: (msg: string) => {
      setListening(false);
      toast.error(msg);
    },
  });

  const {
    supported: speechRecognitionSupported,
    startListening: startRealtimeListening,
    stopListening: stopRealtimeListening,
  } = useSpeechRecognition({
    onResult: (value: string) => {
      speechTranscriptRef.current = value;
      setTranscript(value);
    },
    onEnd: () => {
      setListening(false);
      const finalTranscript = speechTranscriptRef.current.trim();
      speechTranscriptRef.current = "";
      if (finalTranscript) {
        void handleSend(finalTranscript);
      }
    },
    onError: (msg: string) => {
      setListening(false);
      toast.error(msg);
    },
  });

  const startVoiceInput = useCallback(() => {
    setTranscript("");
    if (speechRecognitionSupported) {
      speechTranscriptRef.current = "";
      setListening(true);
      startRealtimeListening();
      return;
    }

    setListening(true);
    void startRecordedListening();
  }, [
    setListening,
    setTranscript,
    speechRecognitionSupported,
    startRealtimeListening,
    startRecordedListening,
  ]);

  const stopVoiceInput = useCallback(() => {
    if (speechRecognitionSupported) {
      stopRealtimeListening();
    } else {
      stopRecordedListening();
    }
  }, [speechRecognitionSupported, stopRealtimeListening, stopRecordedListening]);

  // Welcome message + play voice
  useEffect(() => {
    if (messages.length > 0 || !profile?.username || welcomePlayedRef.current) return;
    welcomePlayedRef.current = true;
    const greeting = `${hero.name} online. Ready when you are, ${profile.username}.`;
    pushMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: greeting,
      createdAt: new Date().toISOString(),
    });
    if (usesVoiceOutput) {
      void playVoice(greeting);
    }
  }, [hero.name, messages.length, profile?.username, pushMessage, usesVoiceOutput]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const history = useMemo(
    () => messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  useEffect(() => {
    if (voiceMode === "voice-voice") return;
    speechTranscriptRef.current = "";
    setTranscript("");
    if (!isListening) return;
    stopVoiceInput();
  }, [isListening, setTranscript, stopVoiceInput, voiceMode]);

  const toggleMic = () => {
    if (!usesVoiceInput) return;
    if (isListening) {
      stopVoiceInput();
      return;
    }
    startVoiceInput();
  };

  const playVoice = async (text: string) => {
    if (!text.trim()) return;
    try {
      setIsSpeaking(true);
      const blob = await requestTextToSpeech({ text, heroTheme: theme });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        // Auto-resume microphone in Voice-to-Voice mode for continuous conversation
        const state = useAppStore.getState();
        if (state.voiceMode === "voice-voice" && state.voiceEnabled) {
          startVoiceInput();
        }
      };
      audio.onerror = () => {
        setIsSpeaking(false);
      };
      await audio.play();
    } catch (error: any) {
      setIsSpeaking(false);
      const isMissingConfig = error?.response?.status === 503;
      toast.error(
        isMissingConfig
          ? "Voice disabled: ElevenLabs API Key is not configured in .env."
          : "Voice playback failed. Check backend logs."
      );
    }
  };

  const handleCodeGen = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const result = await generateCode({ prompt, language, heroTheme: theme });
      setCode(result.code || code);
      const reply = result.explanation || "Code inserted into the editor.";
      pushMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      });
      toast.success(`${language} code inserted.`);
      if (usesVoiceOutput) {
        await playVoice(reply);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Code generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChat = async (prompt: string) => {
    const assistantId = crypto.randomUUID();
    startAssistantMessage(assistantId);
    setStreamingChat(true);
    try {
      await streamChat(
        { prompt, heroTheme: theme, history },
        (chunk) => appendAssistantChunk(assistantId, chunk)
      );
      let finalText =
        useAppStore.getState().messages.find((m) => m.id === assistantId)?.content ?? "";

      // Parse agentic commands
      const fileStore = useFileStore.getState();

      // 1. Create files: [CREATE: filename]
      const createMatches = [...finalText.matchAll(/\[CREATE:\s*(.*?)\]/g)];
      createMatches.forEach((m) => {
        if (m[1]) fileStore.createNode("examples", m[1].trim(), "file");
      });

      // 2. Delete files: [DELETE: filename]
      const deleteMatches = [...finalText.matchAll(/\[DELETE:\s*(.*?)\]/g)];
      deleteMatches.forEach((m) => {
        const file = fileStore.files[0]?.children?.find((c) => c.name === m[1]?.trim());
        if (file) fileStore.deleteNode(file.id);
      });

      // 3. Edit files: [EDIT: filename]
      // Just sets it as active to indicate it's generated code target
      const editMatches = [...finalText.matchAll(/\[EDIT:\s*(.*?)\]/g)];
      editMatches.forEach((m) => {
        const file = fileStore.files[0]?.children?.find((c) => c.name === m[1]?.trim());
        if (file) fileStore.setActiveFile(file.id);
      });

      finalText = finalText.replace(/\[(CREATE|DELETE|EDIT):\s*.*?\]/g, "").trim();

      // Clean up message so tag doesn't stay visible if we removed it
      useAppStore.setState((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantId ? { ...msg, content: finalText } : msg
        ),
      }));

      // Trigger custom agentic animation if skills executed
      if (createMatches.length > 0 || deleteMatches.length > 0 || editMatches.length > 0) {
        setIsExecutingSkill(true);
        setTimeout(() => setIsExecutingSkill(false), 2000);
      }

      if (usesVoiceOutput) {
        await playVoice(finalText);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Response failed.");
    } finally {
      setStreamingChat(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const prompt = overrideText || chatInput.trim() || transcript.trim();
    if (!prompt) return;

    // If user says yes to pending code gen
    if (pendingCodePrompt) {
      const lower = prompt.toLowerCase();
      if (lower === "yes" || lower === "y" || lower === "go" || lower === "do it") {
        pushMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: prompt,
          createdAt: new Date().toISOString(),
        });
        const codePrompt = pendingCodePrompt;
        setPendingCodePrompt(null);
        setChatInput("");
        setTranscript("");
        await handleCodeGen(codePrompt);
        return;
      }
      setPendingCodePrompt(null);
    }

    pushMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    });
    setChatInput("");
    setTranscript("");

    // Detect code request - ask first instead of auto-generating
    if (looksLikeCodeRequest(prompt)) {
      setPendingCodePrompt(prompt);
      const askMsg = `Want me to generate ${language} code for that and insert it into the editor? Say "yes" to confirm.`;
      pushMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: askMsg,
        createdAt: new Date().toISOString(),
      });
      if (usesVoiceOutput) {
        await playVoice(askMsg);
      }
      return;
    }

    await handleChat(prompt);
  };

  const isProcessing = isStreamingChat || isGenerating;

  return (
    <div className="relative flex h-full flex-col border-l border-white/[0.06] bg-[#0a0a0e]/80 overflow-hidden">
      {/* Background hero motif */}
      <HeroMotif theme={theme} className="bottom-10 right-[-20px] h-[200px] w-[200px] text-primary" />

      <div className="relative">
        <AvatarStage isSpeaking={isSpeaking} isThinking={isProcessing} />
        {isExecutingSkill && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in zoom-in duration-300">
            <div className="rounded-full border border-primary/50 bg-primary/20 px-4 py-1.5 text-xs font-bold tracking-widest text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]">
              EXECUTING SKILL...
            </div>
          </div>
        )}
      </div>

      {/* Voice mode selector */}
      <div className="relative flex items-center justify-center gap-2 border-b border-white/[0.04] py-2 px-4">
        <button
          type="button"
          onClick={() => setShowModeMenu(!showModeMenu)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] tracking-wide text-white/40 transition hover:bg-white/[0.06]"
        >
          <Settings2 className="h-3 w-3" />
          {VOICE_MODE_LABELS[voiceMode]}
        </button>

        {showModeMenu && (
          <div className="absolute top-full left-1/2 z-20 mt-1 -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#12121a] p-1 shadow-2xl">
            {(Object.entries(VOICE_MODE_LABELS) as [VoiceMode, string][]).map(
              ([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setVoiceMode(mode);
                    setShowModeMenu(false);
                  }}
                  className={cn(
                    "block w-full rounded-lg px-4 py-1.5 text-left text-xs transition",
                    mode === voiceMode
                      ? "bg-primary/15 text-primary"
                      : "text-white/50 hover:bg-white/[0.06]"
                  )}
                >
                  {label}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-white/15">Ask me anything.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} theme={theme} />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="mx-4 mb-2 rounded-lg border border-accent/15 bg-accent/5 px-3 py-2 text-xs text-accent/70">
          {transcript}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
        {/* Mic button - always visible but styled based on mode */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={!usesVoiceInput}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
            isListening
              ? "bg-red-500/15 text-red-400 animate-pulse"
              : usesVoiceInput
                ? "bg-primary/10 text-primary/60 hover:bg-primary/15"
                : "cursor-not-allowed bg-white/[0.03] text-white/20"
          )}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={usesVoiceInput ? "Or type here..." : `Message ${hero.name}...`}
          className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/20 focus:border-primary/25"
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isProcessing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/70 text-white transition hover:bg-primary disabled:opacity-30"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
