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
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

const ACTION_ICONS: Record<ActionIndicator["type"], typeof FileSearch> = {
  search_files: FileSearch, read_file: FileText, write_file: FileEdit,
  create_file: FilePlus, delete_file: Trash2, create_folder: FolderPlus,
  modify_file: FileEdit, thinking: Sparkles,
};

const ACTION_COLORS: Record<ActionIndicator["type"], string> = {
  search_files: "#60a5fa", read_file: "#a78bfa", write_file: "#34d399",
  create_file: "#34d399", delete_file: "#f87171", create_folder: "#fbbf24",
  modify_file: "#34d399", thinking: "#818cf8",
};

const ACTION_VERBS: Record<ActionIndicator["type"], string> = {
  search_files: "Searched", read_file: "Read", write_file: "Wrote",
  create_file: "Created", delete_file: "Deleted", create_folder: "Created",
  modify_file: "Modified", thinking: "Processed",
};

function ArcReactorSpinner({ color, size = 36 }: { color: string; size?: number }) {
  const r1 = size * 0.42;
  const r2 = size * 0.3;
  const r3 = size * 0.16;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <motion.circle cx={cx} cy={cy} r={r1} fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="5 4" opacity={0.25}
          animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "center" }} />
        <motion.circle cx={cx} cy={cy} r={r2} fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="8 5" opacity={0.4}
          animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "center" }} />
        <circle cx={cx} cy={cy} r={r3} fill={`${color}12`} stroke={color} strokeWidth="0.8" opacity={0.5} />
      </svg>
      <motion.div className="absolute rounded-full" style={{
        width: r3 * 1.4, height: r3 * 1.4, top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: `radial-gradient(circle, ${color}35, transparent 70%)`
      }} animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
    </div>
  );
}

function HolographicBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="relative h-[2px] w-full overflow-hidden rounded-full" style={{ background: `${color}10` }}>
      <motion.div className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, ${color}80)` }}
        animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
      <motion.div className="absolute inset-y-0 h-full w-8"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
        animate={{ left: ["-10%", "110%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}

function JarvisActionStep({ action, index, color }: { action: ActionIndicator; index: number; color: string }) {
  const Icon = ACTION_ICONS[action.type] || FileText;
  const stepColor = ACTION_COLORS[action.type] || color;
  const isDone = action.status === "done";
  const isError = action.status === "error";
  const isRunning = action.status === "running";
  const verb = isDone ? ACTION_VERBS[action.type] || "Done" : action.label;

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }} className="flex items-center gap-2 py-[2px]">
      <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {isRunning ? (
          <motion.div className="h-2.5 w-2.5 rounded-full border-[1.5px] border-t-transparent"
            style={{ borderColor: stepColor, borderTopColor: "transparent" }}
            animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} />
        ) : isDone ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
            <CheckCircle2 className="h-3 w-3" style={{ color: "#34d399" }} />
          </motion.div>
        ) : (
          <XCircle className="h-3 w-3" style={{ color: "#f87171" }} />
        )}
      </div>
      <Icon className="h-2.5 w-2.5 shrink-0" style={{ color: stepColor, opacity: isDone ? 0.4 : 0.7 }} />
      <span className={cn("text-[9px] font-mono", isDone ? "text-white/25" : isError ? "text-red-400/50" : "text-white/45")}>
        {verb}
      </span>
      {action.fileName && (
        <span className="rounded px-1 py-[0.5px] text-[8px] font-mono truncate max-w-[120px]"
          style={{
            background: isDone ? "rgba(255,255,255,0.02)" : `${stepColor}06`,
            color: isDone ? "rgba(255,255,255,0.2)" : `${stepColor}80`,
            border: `1px solid ${isDone ? "rgba(255,255,255,0.03)" : `${stepColor}12`}`,
          }}>
          {action.fileName}
        </span>
      )}
    </motion.div>
  );
}

function JarvisHud({ actions, color }: { actions: ActionIndicator[]; color: string }) {
  const doneCount = actions.filter(a => a.status === "done" || a.status === "error").length;
  const total = actions.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;
  const allDone = doneCount === total;
  const hasErrors = actions.some(a => a.status === "error");

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-lg border max-w-[90%]"
      style={{
        borderColor: allDone ? (hasErrors ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.12)") : `${color}10`,
        background: `linear-gradient(145deg, ${color}03, ${color}06)`,
      }}>
      {!allDone && (
        <motion.div className="absolute left-0 right-0 h-[1px] pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${color}12, transparent)` }}
          animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      )}
      <div className="relative px-2.5 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          {!allDone ? (
            <ArcReactorSpinner color={color} size={22} />
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: hasErrors ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)" }}>
              {hasErrors ? <XCircle className="h-3 w-3 text-red-400/60" /> : <CheckCircle2 className="h-3 w-3 text-emerald-400/60" />}
            </motion.div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono font-bold tracking-[0.12em] uppercase" style={{ color: `${color}60` }}>
                {allDone ? (hasErrors ? "ERRORS" : "COMPLETE") : "EXECUTING"}
              </span>
              {!allDone && (
                <motion.span className="text-[8px] font-mono" style={{ color: `${color}35` }}
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  {doneCount}/{total}
                </motion.span>
              )}
            </div>
            <HolographicBar progress={allDone ? 100 : progress} color={allDone ? (hasErrors ? "#f87171" : "#34d399") : color} />
          </div>
        </div>
        <div className="space-y-0">
          {actions.map((action, i) => (
            <JarvisActionStep key={`${action.type}-${action.fileName ?? i}`} action={action} index={i} color={color} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function JarvisStreamingHud({ color }: { color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      className="relative overflow-hidden rounded-lg border max-w-[90%]"
      style={{ borderColor: `${color}10`, background: `linear-gradient(145deg, ${color}03, ${color}06)` }}>
      <motion.div className="absolute left-0 right-0 h-[1px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color}12, transparent)` }}
        animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
      <div className="relative flex items-center gap-2.5 px-2.5 py-2">
        <ArcReactorSpinner color={color} size={24} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[8px] font-mono font-bold tracking-[0.12em] uppercase" style={{ color: `${color}55` }}>
              GENERATING
            </span>
            <div className="flex items-center gap-[2px]">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div key={i} className="w-[1.5px] rounded-full" style={{ background: color }}
                  animate={{ height: [2, 6 + Math.random() * 4, 2], opacity: [0.15, 0.5, 0.15] }}
                  transition={{ duration: 0.35 + Math.random() * 0.15, repeat: Infinity, delay: i * 0.05 }} />
              ))}
            </div>
          </div>
          <HolographicBar progress={50} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

export function ChatMessageBubble({ message, theme, isStreaming = false }: { message: ChatMessage; theme: HeroTheme; isStreaming?: boolean }) {
  const hero = heroThemeMap[theme];
  const color = hero.palette[0];
  const isAssistant = message.role === "assistant";
  const isAction = message.role === "action";
  const hasActions = message.actions && message.actions.length > 0;
  const isThinkingOnly = hasActions && message.actions!.every((a) => a.type === "thinking");
  const currentlyStreaming = isStreaming || (isAssistant && !message.content);
  const hasToolContent = isAssistant && message.content && /\[TOOL:/.test(message.content);

  if (isAction && isThinkingOnly) {
    const thinkAction = message.actions![0];
    if (thinkAction.status === "done" || thinkAction.status === "error") return null;
    return (
      <div className="flex gap-2">
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] mt-0.5">
          <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
        </div>
        <JarvisStreamingHud color={color} />
      </div>
    );
  }

  if (isAction && hasActions) {
    return (
      <div className="flex gap-2">
        <div className="flex flex-col items-center ml-1">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-white/[0.08]">
            <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
          </div>
          <motion.div className="w-[1px] flex-1 mt-1"
            style={{ background: `linear-gradient(180deg, ${color}15, transparent)` }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
        </div>
        <JarvisHud actions={message.actions!} color={color} />
      </div>
    );
  }

  if (currentlyStreaming) {
    return (
      <div className="flex gap-2">
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] mt-0.5">
          <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
        </div>
        <JarvisStreamingHud color={color} />
      </div>
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
        {hasActions && !isAction && (
          <JarvisHud actions={message.actions!} color={color} />
        )}
        <div className={cn(
          "rounded-2xl px-3 py-2 text-[12px] leading-relaxed",
          isAssistant ? "border border-white/[0.05] bg-white/[0.025] text-white/75" : "bg-primary/70 text-white"
        )}>
          {message.content}
        </div>
      </div>
    </div>
  );
}
