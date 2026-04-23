"use client";

import { useEffect } from "react";
import { Play, Loader2, Code2, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CodeEditor } from "@/components/ide/code-editor";
import { TerminalOutput } from "@/components/ide/terminal-output";
import { runCode } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import { useFileStore } from "@/store/file-store";
import type { Language } from "@/lib/types";

const LANG_ICONS: Record<string, string> = {
  typescript: "TS",
  javascript: "JS",
  python: "PY",
  go: "GO",
  java: "JV",
  c: "C",
  cpp: "C+",
  bash: "SH",
  html: "HT",
  css: "CS",
  json: "{}",
  rust: "RS",
  ruby: "RB",
  php: "PH",
  swift: "SW",
};

export function EditorPanel() {
  const language = useAppStore((s) => s.language);
  const code = useAppStore((s) => s.code);
  const isRunningCode = useAppStore((s) => s.isRunningCode);
  const setCode = useAppStore((s) => s.setCode);
  const setOutput = useAppStore((s) => s.setOutput);
  const setRunningCode = useAppStore((s) => s.setRunningCode);
  const activeFileId = useFileStore((s) => s.activeFileId);
  const activeFile = activeFileId ? useFileStore.getState().getFileById(activeFileId) : null;
  const updateFileContent = useFileStore((s) => s.updateFileContent);
  const setActiveFile = useFileStore((s) => s.setActiveFile);

  useEffect(() => {
    if (!activeFileId) {
      setCode("");
      return;
    }
    const latest = useFileStore.getState().getFileById(activeFileId);
    if (!latest) {
      setCode("");
      return;
    }
    setCode(latest.content ?? "");
  }, [activeFileId, setCode]);

  const displayLanguage = activeFile?.language || language;

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (activeFileId) {
      updateFileContent(activeFileId, value);
    }
  };

  const handleCloseFile = () => {
    setActiveFile(null as unknown as string);
    setCode("");
  };

  const handleRun = async () => {
    setRunningCode(true);
    setOutput(null);
    try {
      const result = await runCode({ language: displayLanguage, code });
      setOutput(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Execution failed."
      );
    } finally {
      setRunningCode(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Editor toolbar */}
      <div
        className="flex h-10 shrink-0 items-center gap-2 px-3"
        style={{
          borderBottom: "1px solid rgba(var(--theme-primary-raw), 0.06)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))",
        }}
      >
        {/* File tab */}
        {activeFile ? (
          <div className="group flex items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-1">
            <span
              className="flex h-4 w-5 items-center justify-center rounded text-[8px] font-bold tracking-wider text-primary/60"
              style={{ backgroundColor: "rgba(var(--theme-primary-raw), 0.1)" }}
            >
              {LANG_ICONS[displayLanguage] || "?"}
            </span>
            <span className="text-xs font-medium text-white/75">{activeFile.name}</span>
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary/50 group-hover:hidden"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Close button — appears on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseFile();
              }}
              className="hidden h-4 w-4 items-center justify-center rounded-sm text-white/30 transition hover:bg-white/10 hover:text-white/70 group-hover:flex"
              title="Close file"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/25">
            <Code2 className="h-3.5 w-3.5" />
            <span className="text-xs">No file open</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Run button */}
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={isRunningCode}
          className="flex h-7 items-center gap-1.5 rounded-md px-4 text-xs font-bold tracking-wide text-white transition disabled:opacity-40"
          style={{
            background: isRunningCode
              ? "rgba(245, 158, 11, 0.2)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.7), rgba(16, 185, 129, 0.5))",
            boxShadow: isRunningCode
              ? "none"
              : "0 0 15px rgba(16, 185, 129, 0.2)",
          }}
        >
          {isRunningCode ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isRunningCode ? "Running" : "Run"}
        </button>
      </div>

      {/* Code editor */}
      <div className="min-h-0 flex-1">
        <CodeEditor language={displayLanguage} value={code} onChange={handleCodeChange} />
      </div>

      {/* Terminal */}
      <div className="h-[220px] shrink-0">
        <TerminalOutput />
      </div>
    </div>
  );
}
