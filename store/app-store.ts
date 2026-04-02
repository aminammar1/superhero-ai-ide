"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChatMessage,
  ExecutionResult,
  HeroTheme,
  Language,
  UserProfile
} from "@/lib/types";
import { languageTemplates } from "@/features/editor/templates";

type SessionStatus = "anonymous" | "loading" | "authenticated";

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
  isListening: boolean;
  transcript: string;
  messages: ChatMessage[];
  setSessionLoading: () => void;
  setAuthenticated: (token: string, user: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
  logout: () => void;
  setTheme: (theme: HeroTheme) => void;
  setLanguage: (language: Language) => void;
  setCode: (code: string) => void;
  setOutput: (output: ExecutionResult | null) => void;
  setRunningCode: (running: boolean) => void;
  setStreamingChat: (streaming: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setListening: (listening: boolean) => void;
  setTranscript: (transcript: string) => void;
  pushMessage: (message: ChatMessage) => void;
  startAssistantMessage: (id: string) => void;
  appendAssistantChunk: (id: string, chunk: string) => void;
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
      isListening: false,
      transcript: "",
      messages: [],
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
      setCode: (code) => set({ code }),
      setOutput: (output) => set({ output }),
      setRunningCode: (running) => set({ isRunningCode: running }),
      setStreamingChat: (streaming) => set({ isStreamingChat: streaming }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
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
        }))
    }),
    {
      name: "superhero-ai-ide",
      partialize: (state) => ({
        sessionStatus: state.sessionStatus,
        token: state.token,
        profile: state.profile,
        theme: state.theme,
        voiceEnabled: state.voiceEnabled,
        language: state.language,
        code: state.code
      })
    }
  )
);
