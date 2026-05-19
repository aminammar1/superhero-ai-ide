"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, FileText, FolderPlus, Trash2, Pencil, Eye, List, Shield, Zap, BookOpen, FileCode } from "lucide-react";
import { useAgentStore, type AgentAction, type AgentToolName } from "@/store/agent-store";
import { useAppStore } from "@/store/app-store";
import { heroThemeMap } from "@/themes/superheroes";
import { cn } from "@/lib/utils";

const TOOL_ICONS: Record<AgentToolName, typeof FileText> = {
  create_file: FileText, create_folder: FolderPlus, delete_file: Trash2,
  modify_file: Pencil, read_file: Eye, list_files: List,
  explain_project: BookOpen, explain_code: FileCode,
};

const TOOL_LABELS: Record<AgentToolName, string> = {
  create_file: "Create File", create_folder: "Create Folder", delete_file: "Delete File",
  modify_file: "Modify File", read_file: "Read File", list_files: "List Files",
  explain_project: "Explain Project", explain_code: "Explain Code",
};

const TOOL_RISK: Record<AgentToolName, "safe" | "warning" | "danger"> = {
  create_file: "safe", create_folder: "safe", delete_file: "danger",
  modify_file: "warning", read_file: "safe", list_files: "safe",
  explain_project: "safe", explain_code: "safe",
};

function ActionCard({ action, color }: { action: AgentAction; color: string }) {
  const tool = action.toolCall.tool;
  const Icon = TOOL_ICONS[tool];
  const risk = TOOL_RISK[tool];

  const riskColor = risk === "danger" ? "#f87171" : risk === "warning" ? "#fbbf24" : "#34d399";

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
      className="rounded-lg border p-3 relative overflow-hidden"
      style={{ borderColor: `${riskColor}15`, background: `${riskColor}04` }}>
      <motion.div className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ background: `linear-gradient(180deg, ${riskColor}40, ${riskColor}10)` }}
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${riskColor}10` }}>
          <Icon className="h-4 w-4" style={{ color: riskColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/80">{TOOL_LABELS[tool]}</p>
          <p className="text-[10px] text-white/35 font-mono truncate mt-0.5">
            {action.toolCall.args.path || action.toolCall.args.name || "workspace"}
          </p>
        </div>
        <span className="rounded-full px-1.5 py-[1px] text-[7px] font-bold tracking-wider"
          style={{ color: riskColor, background: `${riskColor}12` }}>
          {risk.toUpperCase()}
        </span>
      </div>
      {action.toolCall.preview && (
        <div className="mt-2 rounded bg-black/30 p-2 font-mono text-[10px] text-white/50 max-h-32 overflow-auto scrollbar-thin">
          <pre className="whitespace-pre-wrap">{action.toolCall.preview}</pre>
        </div>
      )}
      {Object.entries(action.toolCall.args).length > 0 && !action.toolCall.preview && (
        <div className="mt-2 space-y-0.5">
          {Object.entries(action.toolCall.args).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5 text-[10px]">
              <span className="text-white/20 font-mono">{key}:</span>
              <span className="text-white/50 font-mono truncate">{value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
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
  const color = hero.palette[0];

  const pendingCount = pendingActions.filter((a) => a.status === "pending").length;

  if (!showModal || !currentAction) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", damping: 25 }}
          className="relative w-[440px] max-h-[80vh] overflow-hidden rounded-2xl border bg-[#08080e]/98 backdrop-blur-2xl shadow-2xl"
          style={{ borderColor: `${color}12` }}>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div className="absolute left-0 right-0 h-[1px]"
              style={{ background: `linear-gradient(90deg, transparent, ${color}08, transparent)` }}
              animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          </div>

          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />

          <div className="relative flex items-center gap-3 border-b p-4" style={{ borderColor: `${color}08` }}>
            <motion.div className="flex h-9 w-9 items-center justify-center rounded-xl relative"
              style={{ background: `${color}10` }}>
              <motion.div className="absolute inset-0 rounded-xl"
                style={{ border: `1px solid ${color}20` }}
                animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
              <Shield className="h-4 w-4" style={{ color }} />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <Zap className="h-3 w-3" style={{ color }} />
                {hero.name} requests access
              </h3>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: `${color}50` }}>
                {pendingCount} PENDING {pendingCount !== 1 ? "OPS" : "OP"}
              </p>
            </div>
            <button type="button" onClick={rejectAll}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:bg-white/[0.05] hover:text-white/50 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-auto p-4 space-y-2 scrollbar-thin">
            <ActionCard action={currentAction} color={color} />
          </div>

          <div className="flex items-center gap-2 border-t p-4" style={{ borderColor: `${color}08` }}>
            <button type="button" onClick={() => rejectAction(currentAction.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/5 py-2 text-xs font-medium text-red-400/70 transition hover:bg-red-500/10">
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
            <button type="button" onClick={() => approveAction(currentAction.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition hover:brightness-110"
              style={{ borderColor: `${color}20`, background: `${color}12`, color }}>
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
          </div>

          {pendingCount > 1 && (
            <div className="border-t px-4 py-2.5 flex items-center justify-center gap-3" style={{ borderColor: `${color}06` }}>
              <button type="button" onClick={approveAll}
                className="text-[10px] font-mono font-bold tracking-wider transition hover:brightness-125"
                style={{ color: `${color}70` }}>
                APPROVE ALL ({pendingCount})
              </button>
              <span style={{ color: `${color}15` }}>│</span>
              <button type="button" onClick={rejectAll}
                className="text-[10px] font-mono text-white/25 hover:text-red-400/50 transition">
                REJECT ALL
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
