"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send, Radio, MessageSquare, ArrowUp, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AvatarStage } from "@/components/agent/avatar-stage";
import { ChatMessageBubble } from "@/components/agent/chat-message";
import { requestTextToSpeech, streamChat } from "@/services/api";
import { useAppStore, type VoiceMode } from "@/store/app-store";
import { useFileStore } from "@/store/file-store";
import { useAgentStore } from "@/store/agent-store";
import { useAudioRecorder } from "@/features/agent/use-audio-recorder";
import { useSpeechRecognition } from "@/features/agent/use-speech-recognition";
import { parseToolCalls, executeToolCall, requiresApproval } from "@/features/agent/tool-executor";
import { heroThemeMap } from "@/themes/superheroes";
import { HeroMotif } from "@/components/ui/hero-motif";
import { ModelSelector } from "@/components/agent/model-selector";
import { cn } from "@/lib/utils";
import type { HeroTheme, ActionIndicator } from "@/lib/types";

const CODE_PROMPT_HINTS = [
  "code", "function", "class", "component", "bug", "fix", "refactor",
  "typescript", "javascript", "python", "golang", "go ", "java", "c++",
  "cpp", "algorithm", "file", "create", "modify", "edit",
];

function pickModelForPrompt(prompt: string, chatModel: string, codeModel: string): string {
  const text = prompt.toLowerCase();
  if (CODE_PROMPT_HINTS.some((hint) => text.includes(hint))) return codeModel;
  return chatModel;
}

/* ────────────────────────────────────────────
   JARVIS HUD Welcome (empty state)
   ──────────────────────────────────────────── */
function JarvisWelcome({ theme, onSuggestion }: { theme: HeroTheme; onSuggestion: (text: string) => void }) {
  const hero = heroThemeMap[theme];
  const color = hero.palette[0];

  const suggestions = [
    "Scaffold a React project",
    "Create an Express API",
    "Set up a Python Flask app",
    "Help me debug",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 relative">
      {/* HUD grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 h-full w-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="j-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke={color} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#j-grid)" />
        </svg>
        <motion.div
          className="absolute left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}20, transparent)` }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Core orb */}
      <motion.div className="relative">
        <motion.div
          className="absolute -inset-6 rounded-full"
          style={{ background: `radial-gradient(circle, ${color}06, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -inset-3 rounded-full border"
          style={{ borderColor: `${color}10` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          animate={{ opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <HeroMotif theme={theme} className="relative h-12 w-12 text-primary" />
        </motion.div>
      </motion.div>

      {/* Status */}
      <div className="flex flex-col items-center gap-1 z-10">
        <div className="flex items-center gap-2">
          <motion.span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: `${color}70` }}>
            Systems Online
          </span>
        </div>
        <p className="text-[10px] text-white/15 text-center">
          Ready for your command
        </p>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap justify-center gap-1.5 z-10 max-w-[280px]">
        {suggestions.map((hint, i) => (
          <motion.button
            key={hint}
            type="button"
            onClick={() => onSuggestion(hint)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="rounded-lg border px-2.5 py-1 text-[9px] transition-all hover:scale-[1.02]"
            style={{
              borderColor: `${color}12`,
              color: `${color}50`,
              background: `${color}04`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${color}10`;
              e.currentTarget.style.borderColor = `${color}25`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${color}04`;
              e.currentTarget.style.borderColor = `${color}12`;
            }}
          >
            {hint}
          </motion.button>
        ))}
      </div>

      {/* Corner marks */}
      {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
        <div
          key={pos}
          className={cn("absolute pointer-events-none", pos)}
          style={{
            width: 12, height: 12,
            borderColor: `${color}0a`,
            borderTopWidth: i < 2 ? 1 : 0,
            borderBottomWidth: i >= 2 ? 1 : 0,
            borderLeftWidth: i % 2 === 0 ? 1 : 0,
            borderRightWidth: i % 2 !== 0 ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Voice Waveform
   ──────────────────────────────────────────── */
function VoiceWaveform({ isActive, color }: { isActive: boolean; color: string }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ background: color }}
          animate={isActive
            ? { height: [6, 16 + Math.random() * 16, 6], opacity: [0.3, 0.8, 0.3] }
            : { height: 3, opacity: 0.15 }
          }
          transition={{ duration: 0.35 + Math.random() * 0.2, repeat: isActive ? Infinity : 0, delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Voice Orb
   ──────────────────────────────────────────── */
function VoiceOrb({ isListening, isSpeaking, isThinking, color, onClick }: {
  isListening: boolean; isSpeaking: boolean; isThinking: boolean; color: string; onClick: () => void;
}) {
  const active = isListening || isSpeaking || isThinking;
  const label = isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : "TAP TO SPEAK";
  return (
    <button type="button" onClick={onClick} className="relative flex flex-col items-center gap-3">
      <motion.div
        className="absolute rounded-full"
        style={{ width: 120, height: 120, background: `radial-gradient(circle, ${color}18, transparent 70%)` }}
        animate={active ? { scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] } : { scale: 1, opacity: 0.08 }}
        transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
      />
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: isListening ? `radial-gradient(circle, ${color}, ${color}80)` : `radial-gradient(circle, ${color}25, ${color}08)`,
          boxShadow: active ? `0 0 24px ${color}30` : "none",
        }}
        animate={isListening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.7, repeat: isListening ? Infinity : 0 }}
      >
        {isListening ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white/60" />}
      </motion.div>
      <motion.span
        className="text-[8px] tracking-[0.25em] font-bold"
        style={{ color }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {label}
      </motion.span>
    </button>
  );
}

/* ────────────────────────────────────────────
   Tool action utilities
   ──────────────────────────────────────────── */
function toolToActionType(tool: string): ActionIndicator["type"] {
  const map: Record<string, ActionIndicator["type"]> = {
    create_file: "create_file", create_folder: "create_folder", delete_file: "delete_file",
    modify_file: "modify_file", read_file: "read_file", list_files: "search_files", write_file: "write_file",
  };
  return map[tool] || "thinking";
}

function toolToLabel(tool: string): string {
  const map: Record<string, string> = {
    create_file: "Creating", create_folder: "Creating folder", delete_file: "Deleting",
    modify_file: "Modifying", read_file: "Reading", list_files: "Scanning workspace", write_file: "Writing",
  };
  return map[tool] || "Processing";
}

/* ────────────────────────────────────────────
   Main Agent Panel
   ──────────────────────────────────────────── */
export function AgentPanel() {
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const messages = useAppStore((s) => s.messages);
  const transcript = useAppStore((s) => s.transcript);
  const isListening = useAppStore((s) => s.isListening);
  const isStreamingChat = useAppStore((s) => s.isStreamingChat);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const voiceMode = useAppStore((s) => s.voiceMode);
  const chatModel = useAppStore((s) => s.chatModel);
  const codeModel = useAppStore((s) => s.codeModel);
  const taskContext = useAppStore((s) => s.taskContext);

  const pushMessage = useAppStore((s) => s.pushMessage);
  const startAssistantMessage = useAppStore((s) => s.startAssistantMessage);
  const appendAssistantChunk = useAppStore((s) => s.appendAssistantChunk);
  const setStreamingChat = useAppStore((s) => s.setStreamingChat);
  const setListening = useAppStore((s) => s.setListening);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const setVoiceMode = useAppStore((s) => s.setVoiceMode);
  const setChatModel = useAppStore((s) => s.setChatModel);
  const setCodeModel = useAppStore((s) => s.setCodeModel);
  const pushActionMessage = useAppStore((s) => s.pushActionMessage);
  const updateActionStatus = useAppStore((s) => s.updateActionStatus);
  const addTaskContext = useAppStore((s) => s.addTaskContext);

  const queueAction = useAgentStore((s) => s.queueAction);
  const setHeroAnimation = useAgentStore((s) => s.setHeroAnimation);
  const pendingActions = useAgentStore((s) => s.pendingActions);

  const [chatInput, setChatInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const welcomePlayedRef = useRef(false);
  const speechTranscriptRef = useRef("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hero = heroThemeMap[theme];
  const usesVoiceInput = voiceMode === "voice-voice";
  const usesVoiceOutput = voiceEnabled && voiceMode === "voice-voice";

  const { startRecording, stopRecording } = useAudioRecorder({
    onResult: (value: string) => { setListening(false); setTranscript(value); void handleSend(value); },
    onError: (msg: string) => { setListening(false); toast.error(msg); },
  });

  const { supported: speechSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: (v: string) => { speechTranscriptRef.current = v; setTranscript(v); },
    onEnd: () => {
      setListening(false);
      const t = speechTranscriptRef.current.trim();
      speechTranscriptRef.current = "";
      if (t) void handleSend(t);
    },
    onError: (msg: string) => { setListening(false); toast.error(msg); },
  });

  const startVoice = useCallback(() => {
    setTranscript("");
    if (speechSupported) { speechTranscriptRef.current = ""; setListening(true); startListening(); return; }
    setListening(true); void startRecording();
  }, [setListening, setTranscript, speechSupported, startListening, startRecording]);

  const stopVoice = useCallback(() => {
    speechSupported ? stopListening() : stopRecording();
  }, [speechSupported, stopListening, stopRecording]);

  const handleModelChange = useCallback((id: string) => { setChatModel(id); setCodeModel(id); }, [setChatModel, setCodeModel]);

  // Welcome
  useEffect(() => {
    if (messages.length > 0 || !profile?.username || welcomePlayedRef.current) return;
    welcomePlayedRef.current = true;
    pushMessage({ id: crypto.randomUUID(), role: "assistant", content: `${hero.name} online. What do you need, ${profile.username}?`, createdAt: new Date().toISOString() });
    if (usesVoiceOutput) void playVoice(`${hero.name} online. What do you need, ${profile.username}?`);
  }, [hero.name, messages.length, profile?.username, pushMessage, usesVoiceOutput]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const history = useMemo(() => {
    const ctx = taskContext.length > 0
      ? [{ role: "system", content: `Previous task context: ${taskContext.slice(-5).join(" | ")}` }]
      : [];
    return [...ctx, ...messages.slice(-8).map((m) => ({ role: m.role === "action" ? "assistant" : m.role, content: m.content }))];
  }, [messages, taskContext]);

  useEffect(() => {
    if (voiceMode === "voice-voice") return;
    speechTranscriptRef.current = ""; setTranscript("");
    if (isListening) stopVoice();
  }, [isListening, setTranscript, stopVoice, voiceMode]);

  // Process approved actions — instant execution, no artificial delay
  useEffect(() => {
    const approved = pendingActions.filter((a) => a.status === "approved");
    if (approved.length === 0) return;
    setHeroAnimation("processing");
    const msgId = crypto.randomUUID();
    const indicators: ActionIndicator[] = approved.map((a) => ({
      type: toolToActionType(a.toolCall.tool), label: toolToLabel(a.toolCall.tool),
      fileName: a.toolCall.args.path || a.toolCall.args.name, status: "running" as const,
    }));
    pushActionMessage(msgId, indicators);
    // Execute all immediately — no setTimeout/await delays
    for (let i = 0; i < approved.length; i++) {
      useAgentStore.getState().setActionStatus(approved[i].id, "executing");
      const result = executeToolCall(approved[i].toolCall);
      if (result.success) {
        useAgentStore.getState().setActionStatus(approved[i].id, "done", result.message);
        updateActionStatus(msgId, i, "done");
        addTaskContext(`${approved[i].toolCall.tool}: ${approved[i].toolCall.args.path || ""}`);
      } else {
        useAgentStore.getState().setActionStatus(approved[i].id, "error", undefined, result.message);
        updateActionStatus(msgId, i, "error");
      }
    }
    setHeroAnimation("success");
    setTimeout(() => setHeroAnimation("idle"), 800);
  }, [pendingActions, setHeroAnimation, pushActionMessage, updateActionStatus, addTaskContext]);

  const toggleMic = () => { if (!usesVoiceInput) return; isListening ? stopVoice() : startVoice(); };

  const playVoice = async (text: string) => {
    if (!text.trim()) return;
    try {
      setIsSpeaking(true);
      const blob = await requestTextToSpeech({ text, heroTheme: theme });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setIsSpeaking(false); const s = useAppStore.getState(); if (s.voiceMode === "voice-voice" && s.voiceEnabled) startVoice(); };
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch { setIsSpeaking(false); }
  };

  // Abort / stop the current stream
  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreamingChat(false);
  }, [setStreamingChat]);

  const handleChat = async (prompt: string) => {
    const model = pickModelForPrompt(prompt, chatModel, codeModel);
    const thinkId = crypto.randomUUID();
    pushActionMessage(thinkId, [{ type: "thinking", label: "Thinking", status: "running" }]);
    const aId = crypto.randomUUID();
    startAssistantMessage(aId);
    setStreamingChat(true);

    // Create abort controller for this stream
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        { prompt, heroTheme: theme, model, history },
        (chunk) => appendAssistantChunk(aId, chunk),
        controller.signal,
      );

      // If aborted, mark as interrupted and stop processing
      if (controller.signal.aborted) {
        updateActionStatus(thinkId, 0, "done");
        return;
      }

      updateActionStatus(thinkId, 0, "done");
      const finalText = useAppStore.getState().messages.find((m) => m.id === aId)?.content ?? "";
      const { cleanText, toolCalls } = parseToolCalls(finalText);
      useAppStore.setState((s) => ({ messages: s.messages.map((msg) => msg.id === aId ? { ...msg, content: cleanText } : msg) }));
      addTaskContext(`User: ${prompt.slice(0, 50)} → ${cleanText.slice(0, 50)}`);
      if (toolCalls.length > 0) {
        // Separate auto-exec tools from approval-needed tools
        const autoTools = toolCalls.filter((tc) => !requiresApproval(tc.tool));
        const approvalTools = toolCalls.filter((tc) => requiresApproval(tc.tool));

        // Show action indicators only for auto-exec tools (approval tools get their own via pendingActions effect)
        if (autoTools.length > 0) {
          const toolMsgId = crypto.randomUUID();
          pushActionMessage(toolMsgId, autoTools.map((tc) => ({
            type: toolToActionType(tc.tool), label: toolToLabel(tc.tool),
            fileName: tc.args.path || tc.args.name, status: "running" as const,
          })));
          for (let i = 0; i < autoTools.length; i++) {
            const r = executeToolCall(autoTools[i]);
            updateActionStatus(toolMsgId, i, r.success ? "done" : "error");
          }
        }

        // Queue approval-needed tools (pendingActions effect will show their indicators)
        for (const tc of approvalTools) {
          queueAction(tc);
        }
      }
      if (usesVoiceOutput) await playVoice(cleanText);
    } catch (e) {
      // Don't show error toast on abort
      if (controller.signal.aborted) return;
      updateActionStatus(thinkId, 0, "error");
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      abortRef.current = null;
      setStreamingChat(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const prompt = overrideText || chatInput.trim() || transcript.trim();
    if (!prompt) return;
    pushMessage({ id: crypto.randomUUID(), role: "user", content: prompt, createdAt: new Date().toISOString() });
    setChatInput(""); setTranscript("");
    await handleChat(prompt);
  };

  const isProcessing = isStreamingChat;

  return (
    <div className="relative flex h-full flex-col border-l border-white/[0.06] bg-[#0a0a0e]/80 overflow-hidden">
      <HeroMotif theme={theme} className="bottom-10 right-[-20px] h-[200px] w-[200px] text-primary" />

      <AvatarStage isSpeaking={isSpeaking} isThinking={isProcessing} />

      {/* Messages or Voice UI */}
      {voiceMode === "voice-voice" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-4">
          <VoiceWaveform isActive={isListening || isSpeaking} color={hero.palette[0]} />
          <VoiceOrb isListening={isListening} isSpeaking={isSpeaking} isThinking={isProcessing} color={hero.palette[0]} onClick={toggleMic} />
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-full rounded-xl border border-accent/15 bg-accent/5 px-3 py-2 text-xs text-accent/60 text-center"
              >{transcript}</motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="scrollbar-thin min-h-0 flex-1 overflow-auto px-3 py-3">
          {messages.length === 0 ? (
            <JarvisWelcome theme={theme} onSuggestion={(t) => setChatInput(t)} />
          ) : (
            <div className="space-y-2.5">
              {messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} theme={theme} />)}
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      )}

      {/* Transcript bar */}
      {transcript && voiceMode !== "voice-voice" && (
        <div className="mx-3 mb-2 rounded-lg border border-accent/12 bg-accent/5 px-3 py-1.5 text-[11px] text-accent/50">{transcript}</div>
      )}

      {/* Input area - model selector inside */}
      <div className="border-t border-white/[0.06] p-2.5">
        {/* Model + voice mode row */}
        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            onClick={() => setVoiceMode(voiceMode === "voice-voice" ? "text-text" : "voice-voice")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[9px] text-white/30 hover:bg-white/[0.04] hover:text-white/50 transition"
          >
            {voiceMode === "voice-voice" ? <Radio className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
            {voiceMode === "voice-voice" ? "Voice" : "Text"}
          </button>
          <div className="flex-1" />
          <ModelSelector value={chatModel} onChange={handleModelChange} accentColor={hero.palette[0]} />
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2">
          {usesVoiceInput && (
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                isListening ? "bg-red-500/15 text-red-400 animate-pulse" : "bg-white/[0.04] text-white/25 hover:bg-white/[0.06]"
              )}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
          )}
          <input
            ref={inputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleSend(); } }}
            placeholder={`Message ${hero.name}...`}
            className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white/80 outline-none placeholder:text-white/18 focus:border-primary/20"
          />
          {isProcessing ? (
            <button
              type="button"
              onClick={handleStop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition hover:bg-red-500/30"
              title="Stop generating"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSend()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/60 text-white transition hover:bg-primary/80 disabled:opacity-25"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
