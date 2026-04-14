"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActionIndicator,
  ChatMessage,
  ExecutionResult,
  HeroTheme,
  Language,
  UserProfile
} from "@/lib/types";
import { languageTemplates } from "@/features/editor/templates";
import { DEFAULT_CHAT_MODEL, DEFAULT_CODE_MODEL } from "@/lib/ai-models";

type SessionStatus = "anonymous" | "loading" | "authenticated";
export type VoiceMode = "voice-voice" | "text-text";

/** Max messages persisted for context memory */
const MAX_PERSISTED_MESSAGES = 50;

interface AppState {
  sessionStatus: SessionStatus;
  token: string | null;
  profile: UserProfile | null;
  theme: HeroTheme;
  language: Language;
  code: string;
  output: ExecutionResult | null;
  isRunningCode: boolean;
  isStreamingChat: boolean;
  voiceEnabled: boolean;
  voiceMode: VoiceMode;
  chatModel: string;
  codeModel: string;
  isListening: boolean;
  transcript: string;
  messages: ChatMessage[];
  /** Summarized context from past tasks for AI memory */
  taskContext: string[];
  setSessionLoading: () => void;
  setAuthenticated: (token: string, user: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
  logout: () => void;
  setTheme: (theme: HeroTheme) => void;
  setLanguage: (language: Language) => void;
  setLanguageKeepCode: (language: Language) => void;
  setCode: (code: string) => void;
  setOutput: (output: ExecutionResult | null) => void;
  setRunningCode: (running: boolean) => void;
  setStreamingChat: (streaming: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVoiceMode: (mode: VoiceMode) => void;
  setChatModel: (model: string) => void;
  setCodeModel: (model: string) => void;
  setListening: (listening: boolean) => void;
  setTranscript: (transcript: string) => void;
  pushMessage: (message: ChatMessage) => void;
  startAssistantMessage: (id: string) => void;
  appendAssistantChunk: (id: string, chunk: string) => void;
  /** Push an action-only message for inline tool indicators */
  pushActionMessage: (id: string, actions: ActionIndicator[]) => void;
  /** Update action status in an action message */
  updateActionStatus: (messageId: string, actionIndex: number, status: ActionIndicator["status"]) => void;
  /** Add context snippet from completed task */
  addTaskContext: (context: string) => void;
  /** Clear all messages but keep task context */
  clearMessages: () => void;
}

const defaultProfile: UserProfile = {
  id: "guest",
  username: "",
  heroTheme: "spiderman",
  avatar: "spiderman",
  onboarded: false
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sessionStatus: "anonymous",
      token: null,
      profile: defaultProfile,
      theme: "spiderman",
      language: "typescript",
      code: languageTemplates.typescript,
      output: null,
      isRunningCode: false,
      isStreamingChat: false,
      voiceEnabled: true,
      voiceMode: "text-text",
      chatModel: DEFAULT_CHAT_MODEL,
      codeModel: DEFAULT_CODE_MODEL,
      isListening: false,
      transcript: "",
      messages: [],
      taskContext: [],
      setSessionLoading: () => set({ sessionStatus: "loading" }),
      setAuthenticated: (token, user) =>
        set({
          token,
          sessionStatus: "authenticated",
          profile: user,
          theme: user.heroTheme
        }),
      completeOnboarding: (profile) =>
        set({
          profile,
          theme: profile.heroTheme
        }),
      logout: () =>
        set({
          sessionStatus: "anonymous",
          token: null,
          profile: defaultProfile,
          messages: []
        }),
      setTheme: (theme) =>
        set((state) => ({
          theme,
          profile: state.profile
            ? { ...state.profile, heroTheme: theme, avatar: theme }
            : state.profile
        })),
      setLanguage: (language) =>
        set({
          language,
          code: languageTemplates[language],
          output: null
        }),
      setLanguageKeepCode: (language) =>
        set({ language }),
      setCode: (code) => set({ code }),
      setOutput: (output) => set({ output }),
      setRunningCode: (running) => set({ isRunningCode: running }),
      setStreamingChat: (streaming) => set({ isStreamingChat: streaming }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setVoiceMode: (mode) => set({ voiceMode: mode }),
      setChatModel: (model) => set({ chatModel: model }),
      setCodeModel: (model) => set({ codeModel: model }),
      setListening: (listening) => set({ isListening: listening }),
      setTranscript: (transcript) => set({ transcript }),
      pushMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),
      startAssistantMessage: (id) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id,
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString()
            }
          ]
        })),
      appendAssistantChunk: (id, chunk) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id
              ? { ...message, content: `${message.content}${chunk}` }
              : message
          )
        })),
      pushActionMessage: (id, actions) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id,
              role: "action",
              content: "",
              createdAt: new Date().toISOString(),
              actions,
            },
          ],
        })),
      updateActionStatus: (messageId, actionIndex, status) =>
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id !== messageId || !msg.actions) return msg;
            const updatedActions = [...msg.actions];
            if (updatedActions[actionIndex]) {
              updatedActions[actionIndex] = { ...updatedActions[actionIndex], status };
            }
            return { ...msg, actions: updatedActions };
          }),
        })),
      addTaskContext: (context) =>
        set((state) => ({
          taskContext: [...state.taskContext.slice(-19), context],
        })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "superhero-ai-ide",
      partialize: (state) => ({
        sessionStatus: state.sessionStatus,
        token: state.token,
        profile: state.profile,
        theme: state.theme,
        voiceEnabled: state.voiceEnabled,
        chatModel: state.chatModel,
        codeModel: state.codeModel,
        language: state.language,
        code: state.code,
        // Persist recent messages for context memory
        messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
        taskContext: state.taskContext,
      })
    }
  )
);
