"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, FileText, FolderPlus, Trash2, Pencil, Eye, List, Shield } from "lucide-react";
import { useAgentStore, type AgentAction, type AgentToolName } from "@/store/agent-store";
import { useAppStore } from "@/store/app-store";
import { heroThemeMap } from "@/themes/superheroes";
import { cn } from "@/lib/utils";
import type { HeroTheme } from "@/lib/types";

const TOOL_ICONS: Record<AgentToolName, typeof FileText> = {
  create_file: FileText,
  create_folder: FolderPlus,
  delete_file: Trash2,
  modify_file: Pencil,
  read_file: Eye,
  list_files: List,
};

const TOOL_LABELS: Record<AgentToolName, string> = {
  create_file: "Create File",
  create_folder: "Create Folder",
  delete_file: "Delete File",
  modify_file: "Modify File",
  read_file: "Read File",
  list_files: "List Files",
};

const TOOL_RISK: Record<AgentToolName, "safe" | "warning" | "danger"> = {
  create_file: "safe",
  create_folder: "safe",
  delete_file: "danger",
  modify_file: "warning",
  read_file: "safe",
  list_files: "safe",
};

const RISK_COLORS = {
  safe: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  danger: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
};

function ActionCard({ action }: { action: AgentAction }) {
  const tool = action.toolCall.tool;
  const Icon = TOOL_ICONS[tool];
  const risk = TOOL_RISK[tool];
  const colors = RISK_COLORS[risk];

  return (
    <div className={cn("rounded-xl border p-4", colors.border, colors.bg, colors.glow)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/85">{TOOL_LABELS[tool]}</p>
          <p className="text-xs text-white/40 font-mono mt-0.5">
            {action.toolCall.args.path || action.toolCall.args.name || "workspace"}
          </p>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider",
          risk === "safe" && "bg-emerald-500/20 text-emerald-400",
          risk === "warning" && "bg-amber-500/20 text-amber-400",
          risk === "danger" && "bg-red-500/20 text-red-400"
        )}>
          {risk.toUpperCase()}
        </span>
      </div>

      {/* Preview content */}
      {action.toolCall.preview && (
        <div className="mt-3 rounded-lg bg-black/30 p-3 font-mono text-xs text-white/60 max-h-40 overflow-auto scrollbar-thin">
          <pre className="whitespace-pre-wrap">{action.toolCall.preview}</pre>
        </div>
      )}

      {/* Args display */}
      {Object.entries(action.toolCall.args).length > 0 && !action.toolCall.preview && (
        <div className="mt-3 space-y-1">
          {Object.entries(action.toolCall.args).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="text-white/25 font-mono">{key}:</span>
              <span className="text-white/60 font-mono truncate">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ApprovalModal() {
  const showModal = useAgentStore((s) => s.showApprovalModal);
  const currentAction = useAgentStore((s) => s.currentApprovalAction);
  const pendingActions = useAgentStore((s) => s.pendingActions);
  const approveAction = useAgentStore((s) => s.approveAction);
  const rejectAction = useAgentStore((s) => s.rejectAction);
  const approveAll = useAgentStore((s) => s.approveAll);
  const rejectAll = useAgentStore((s) => s.rejectAll);
  const theme = useAppStore((s) => s.theme);
  const hero = heroThemeMap[theme];

  const pendingCount = pendingActions.filter((a) => a.status === "pending").length;

  if (!showModal || !currentAction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-[480px] max-h-[80vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c14]/95 backdrop-blur-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white/85">
                {hero.name} requests permission
              </h3>
              <p className="text-xs text-white/35 mt-0.5">
                {pendingCount} action{pendingCount !== 1 ? "s" : ""} pending approval
              </p>
            </div>
            <button
              type="button"
              onClick={rejectAll}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:bg-white/[0.06] hover:text-white/50 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions list */}
          <div className="max-h-[50vh] overflow-auto p-5 space-y-3 scrollbar-thin">
            <ActionCard action={currentAction} />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-white/[0.06] p-5">
            <button
              type="button"
              onClick={() => rejectAction(currentAction.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-sm font-medium text-red-400/80 transition hover:bg-red-500/10"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => approveAction(currentAction.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/15"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          </div>

          {/* Approve all shortcut */}
          {pendingCount > 1 && (
            <div className="border-t border-white/[0.04] px-5 py-3 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={approveAll}
                className="text-xs text-primary/60 hover:text-primary transition"
              >
                Approve all ({pendingCount})
              </button>
              <span className="text-white/10">│</span>
              <button
                type="button"
                onClick={rejectAll}
                className="text-xs text-white/30 hover:text-red-400/60 transition"
              >
                Reject all
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
