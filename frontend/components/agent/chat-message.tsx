"use client";

import { cn } from "@/lib/utils";
import type { ActionIndicator, ChatMessage, HeroTheme } from "@/lib/types";
import { heroThemeMap } from "@/themes/superheroes";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  FileText,
  FilePlus,
  FileEdit,
  FolderPlus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Brain,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ────────────────────────────────────────────
   Action Icon + Color Maps
   ──────────────────────────────────────────── */
const ACTION_ICONS: Record<ActionIndicator["type"], typeof FileSearch> = {
  search_files: FileSearch,
  read_file: FileText,
  write_file: FileEdit,
  create_file: FilePlus,
  delete_file: Trash2,
  create_folder: FolderPlus,
  modify_file: FileEdit,
  thinking: Sparkles,
};

const ACTION_COLORS: Record<ActionIndicator["type"], string> = {
  search_files: "#60a5fa",
  read_file: "#a78bfa",
  write_file: "#34d399",
  create_file: "#34d399",
  delete_file: "#f87171",
  create_folder: "#fbbf24",
  modify_file: "#34d399",
  thinking: "#818cf8",
};

const ACTION_VERBS: Record<ActionIndicator["type"], string> = {
  search_files: "Searched",
  read_file: "Read",
  write_file: "Wrote",
  create_file: "Created",
  delete_file: "Deleted",
  create_folder: "Created",
  modify_file: "Modified",
  thinking: "Processed",
};

/* ────────────────────────────────────────────
   Cursor/Copilot-style streaming dots
   ──────────────────────────────────────────── */
function StreamingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-[3px] ml-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-[5px] w-[5px] rounded-full"
          style={{ background: color }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

/* ────────────────────────────────────────────
   Cursor-style Action Step
   ──────────────────────────────────────────── */
function ActionStep({ action }: { action: ActionIndicator }) {
  const Icon = ACTION_ICONS[action.type] || FileText;
  const color = ACTION_COLORS[action.type] || "#60a5fa";
  const isDone = action.status === "done";
  const isError = action.status === "error";
  const isRunning = action.status === "running";
  const verb = isDone ? ACTION_VERBS[action.type] || "Done" : action.label;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.1 }}
      className="flex items-center gap-2 py-[3px]"
    >
      {/* Progress indicator */}
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        {isRunning ? (
          <motion.div
            className="h-3 w-3 rounded-full border-[1.5px] border-t-transparent"
            style={{ borderColor: color, borderTopColor: "transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          />
        ) : isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#34d399" }} />
        ) : (
          <XCircle className="h-3.5 w-3.5" style={{ color: "#f87171" }} />
        )}
      </div>

      {/* Icon */}
      <Icon
        className="h-3 w-3 shrink-0"
        style={{ color, opacity: isDone ? 0.5 : 0.8 }}
      />

      {/* Label */}
      <span className={cn(
        "text-[10px]",
        isDone ? "text-white/35" : isError ? "text-red-400/60" : "text-white/50"
      )}>
        {verb}
      </span>

      {/* File name badge */}
      {action.fileName && (
        <span
          className="rounded px-1.5 py-[1px] text-[9px] font-mono truncate max-w-[140px]"
          style={{
            background: isDone ? "rgba(255,255,255,0.03)" : `${color}08`,
            color: isDone ? "rgba(255,255,255,0.3)" : `${color}90`,
            border: `1px solid ${isDone ? "rgba(255,255,255,0.04)" : `${color}18`}`,
          }}
        >
          {action.fileName}
        </span>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   Chat Message Bubble
   ──────────────────────────────────────────── */
export function ChatMessageBubble({
  message,
  theme,
}: {
  message: ChatMessage;
  theme: HeroTheme;
}) {
  const hero = heroThemeMap[theme];
  const color = hero.palette[0];
  const isAssistant = message.role === "assistant";
  const isAction = message.role === "action";
  const hasActions = message.actions && message.actions.length > 0;
  const isThinkingOnly = hasActions && message.actions!.every((a) => a.type === "thinking");
  const allDone = hasActions && message.actions!.every((a) => a.status === "done" || a.status === "error");

  // For "thinking" only action messages — show as inline Cursor-style indicator
  if (isAction && isThinkingOnly) {
    const thinkAction = message.actions![0];
    // When done, don't render at all (the assistant message handles it)
    if (thinkAction.status === "done") return null;
    if (thinkAction.status === "error") return null;

    // Show compact inline "generating" indicator
    return (
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        className="flex gap-2"
      >
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] mt-0.5">
          <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
        </div>
        <div
          className="flex items-center gap-2 rounded-2xl border px-3 py-2"
          style={{
            borderColor: `${color}15`,
            background: `${color}05`,
          }}
        >
          <motion.div
            className="h-3 w-3 rounded-full border-[1.5px] border-t-transparent"
            style={{ borderColor: `${color}60`, borderTopColor: "transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-[11px] text-white/35">Generating</span>
          <StreamingDots color={`${color}80`} />
        </div>
      </motion.div>
    );
  }

  // Action-only message (file operations — Cursor-like tool execution steps)
  if (isAction && hasActions) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        {/* Vertical connection line */}
        <div className="flex flex-col items-center ml-3">
          <div className="w-[1px] flex-1" style={{ background: `linear-gradient(180deg, transparent, ${color}15, transparent)` }} />
        </div>

        <div className="flex flex-col rounded-lg border border-white/[0.04] bg-white/[0.015] px-2.5 py-1.5 max-w-[85%]">
          <AnimatePresence>
            {message.actions!.map((action, i) => (
              <ActionStep key={`${action.type}-${action.fileName ?? i}`} action={action} />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("flex gap-2", !isAssistant && "justify-end")}>
      {isAssistant && (
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] mt-0.5">
          <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[82%]">
        {/* Show action indicators above the message text */}
        {hasActions && !isAction && (
          <div className="flex flex-col rounded-lg border border-white/[0.04] bg-white/[0.015] px-2 py-1 mb-0.5">
            {message.actions!.map((action, i) => (
              <ActionStep key={`${action.type}-${action.fileName ?? i}`} action={action} />
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-[12px] leading-relaxed",
            isAssistant
              ? "border border-white/[0.05] bg-white/[0.025] text-white/75"
              : "bg-primary/70 text-white"
          )}
        >
          {message.content || (
            isAssistant ? (
              <StreamingDots color={`${color}80`} />
            ) : (
              <span className="text-white/25">...</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
