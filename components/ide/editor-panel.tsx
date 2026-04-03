"use client";

import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/ide/code-editor";
import { TerminalOutput } from "@/components/ide/terminal-output";
import { runCode } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { Language } from "@/lib/types";

const languages: Array<{ label: string; value: Language }> = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
  { label: "Java", value: "java" },
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
];

export function EditorPanel() {
  const language = useAppStore((s) => s.language);
  const code = useAppStore((s) => s.code);
  const isRunningCode = useAppStore((s) => s.isRunningCode);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setCode = useAppStore((s) => s.setCode);
  const setOutput = useAppStore((s) => s.setOutput);
  const setRunningCode = useAppStore((s) => s.setRunningCode);

  const handleRun = async () => {
    setRunningCode(true);
    try {
      const result = await runCode({ language, code });
      setOutput(result);
      if (result.exit_code === 0) {
        toast.success("Execution complete.");
      } else {
        toast.error(`Process exited with code ${result.exit_code}.`);
      }
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
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/30 px-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="h-7 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-xs text-white/70 outline-none focus:border-primary/30"
        >
          {languages.map((lang) => (
            <option
              key={lang.value}
              value={lang.value}
              className="bg-slate-900"
            >
              {lang.label}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={isRunningCode}
          className="flex h-7 items-center gap-1.5 rounded-md bg-emerald-600/80 px-3 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {isRunningCode ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isRunningCode ? "Running" : "Run"}
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <CodeEditor language={language} value={code} onChange={setCode} />
      </div>

      <div className="h-[200px] shrink-0">
        <TerminalOutput />
      </div>
    </div>
  );
}
