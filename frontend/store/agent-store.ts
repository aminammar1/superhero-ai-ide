"use client";

import { create } from "zustand";
import type { FileNode } from "@/store/file-store";

/* ────────────────────────────────────────────
   Agent Tool Types
   ──────────────────────────────────────────── */
export type AgentToolName =
  | "create_file"
  | "create_folder"
  | "delete_file"
  | "modify_file"
  | "read_file"
  | "list_files";

export interface AgentToolCall {
  id: string;
  tool: AgentToolName;
  args: Record<string, string>;
  /** Optional: shows what will change (e.g., new content for modify) */
  preview?: string;
}

export type AgentActionStatus = "pending" | "approved" | "rejected" | "executing" | "done" | "error";

export interface AgentAction {
  id: string;
  toolCall: AgentToolCall;
  status: AgentActionStatus;
  result?: string;
  error?: string;
  createdAt: string;
}

/* ────────────────────────────────────────────
   Animation State
   ──────────────────────────────────────────── */
export type HeroAnimationType = "idle" | "processing" | "success" | "error";

/* ────────────────────────────────────────────
   Store
   ──────────────────────────────────────────── */
interface AgentStore {
  /** Pending actions waiting for user approval */
  pendingActions: AgentAction[];
  /** History of completed actions */
  actionHistory: AgentAction[];
  /** Current hero animation state */
  heroAnimation: HeroAnimationType;
  /** Whether the approval modal is showing */
  showApprovalModal: boolean;
  /** Currently featured action in modal */
  currentApprovalAction: AgentAction | null;

  // Actions
  queueAction: (toolCall: AgentToolCall) => void;
  showNextApproval: () => void;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  approveAll: () => void;
  rejectAll: () => void;
  setActionStatus: (id: string, status: AgentActionStatus, result?: string, error?: string) => void;
  setHeroAnimation: (animation: HeroAnimationType) => void;
  clearHistory: () => void;
  dismissModal: () => void;
}

export const useAgentStore = create<AgentStore>()((set, get) => ({
  pendingActions: [],
  actionHistory: [],
  heroAnimation: "idle",
  showApprovalModal: false,
  currentApprovalAction: null,

  queueAction: (toolCall) => {
    const action: AgentAction = {
      id: toolCall.id,
      toolCall,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      pendingActions: [...state.pendingActions, action],
    }));
    // Auto-show modal if not already open
    const state = get();
    if (!state.showApprovalModal) {
      set({ showApprovalModal: true, currentApprovalAction: action });
    }
  },

  showNextApproval: () => {
    const state = get();
    const next = state.pendingActions.find((a) => a.status === "pending");
    if (next) {
      set({ showApprovalModal: true, currentApprovalAction: next });
    } else {
      set({ showApprovalModal: false, currentApprovalAction: null });
    }
  },

  approveAction: (id) => {
    set((state) => ({
      pendingActions: state.pendingActions.map((a) =>
        a.id === id ? { ...a, status: "approved" as const } : a
      ),
    }));
    get().showNextApproval();
  },

  rejectAction: (id) => {
    set((state) => {
      const action = state.pendingActions.find((a) => a.id === id);
      return {
        pendingActions: state.pendingActions.filter((a) => a.id !== id),
        actionHistory: action
          ? [...state.actionHistory, { ...action, status: "rejected" as const }]
          : state.actionHistory,
      };
    });
    get().showNextApproval();
  },

  approveAll: () => {
    set((state) => ({
      pendingActions: state.pendingActions.map((a) =>
        a.status === "pending" ? { ...a, status: "approved" as const } : a
      ),
      showApprovalModal: false,
      currentApprovalAction: null,
    }));
  },

  rejectAll: () => {
    set((state) => ({
      pendingActions: [],
      actionHistory: [
        ...state.actionHistory,
        ...state.pendingActions
          .filter((a) => a.status === "pending")
          .map((a) => ({ ...a, status: "rejected" as const })),
      ],
      showApprovalModal: false,
      currentApprovalAction: null,
    }));
  },

  setActionStatus: (id, status, result, error) => {
    set((state) => {
      const actionIdx = state.pendingActions.findIndex((a) => a.id === id);
      if (actionIdx >= 0) {
        const action = { ...state.pendingActions[actionIdx], status, result, error };
        const remaining = state.pendingActions.filter((_, i) => i !== actionIdx);
        if (status === "done" || status === "error") {
          return {
            pendingActions: remaining,
            actionHistory: [...state.actionHistory, action],
          };
        }
        return {
          pendingActions: [
            ...remaining.slice(0, actionIdx),
            action,
            ...remaining.slice(actionIdx),
          ],
        };
      }
      return state;
    });
  },

  setHeroAnimation: (animation) => set({ heroAnimation: animation }),
  clearHistory: () => set({ actionHistory: [] }),
  dismissModal: () => set({ showApprovalModal: false, currentApprovalAction: null }),
}));
