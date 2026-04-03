"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon } from "lucide-react";
import { runCode } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { HeroTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

const HERO_ASCII: Record<HeroTheme, string> = {
  spiderman: [
    "    /\\_/\\    ",
    "   ( o.o )   ",
    "    > ^ <    ",
    " /|/   \\|\\  ",
    "  SPIDER-MAN ",
  ].join("\n"),
  batman: [
    "    /\\_/\\    ",
    "   {o . o}   ",
    "   /> Y <\\   ",
    "  /       \\  ",
    "   BATMAN    ",
  ].join("\n"),
  superman: [
    "   _____     ",
    "  / ___ \\    ",
    " | / S \\ |   ",
    "  \\_____/    ",
    "  SUPERMAN   ",
  ].join("\n"),
  ironman: [
    "   [====]    ",
    "   |o  o|    ",
    "   | -- |    ",
    "   |____|    ",
    "  IRON MAN   ",
  ].join("\n"),
};

const THEME_COLORS: Record<HeroTheme, string> = {
  spiderman: "text-red-400/60",
  batman: "text-amber-400/60",
  superman: "text-blue-400/60",
  ironman: "text-orange-400/60",
};

export function TerminalOutput() {
  const output = useAppStore((s) => s.output);
  const setOutput = useAppStore((s) => s.setOutput);
  const isRunningCode = useAppStore((s) => s.isRunningCode);
  const theme = useAppStore((s) => s.theme);
  const hasError = output && output.exit_code !== 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cmdInput, setCmdInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, cmdHistory]);

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && cmdInput.trim()) {
      const args = cmdInput.trim().split(" ");
      const cmd = args[0].toLowerCase();
      
      const currentInput = cmdInput;
      setCmdInput("");
      
      if (cmd === "clear") {
        setOutput(null);
        setCmdHistory([]);
        return;
      }

      setCmdHistory((prev) => [...prev, `$ ${currentInput}\nExecuting...`]);
      
      try {
        const result = await runCode({ language: "bash", code: currentInput });
        setCmdHistory((prev) => {
          const updated = [...prev];
          let resText = `$ ${currentInput}`;
          if (result.stdout) resText += `\n${result.stdout}`;
          if (result.stderr) resText += `\n${result.stderr}`;
          if (result.exit_code !== 0) resText += `\n[exit ${result.exit_code}]`;
          updated[updated.length - 1] = resText;
          return updated;
        });
      } catch (err) {
        setCmdHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = `$ ${currentInput}\nError execution failed.`;
          return updated;
        });
      }
    }
  };

  return (
    <div className="flex h-full flex-col border-t border-white/[0.06] bg-[#0a0a0c]">
      <div className="flex h-8 shrink-0 items-center gap-3 border-b border-white/[0.04] px-3">
        <TerminalIcon className="h-3.5 w-3.5 text-white/30" />
        <span className="text-[11px] font-medium text-white/40">Terminal</span>
        {output && (
          <span
            className={cn(
              "ml-auto rounded px-1.5 py-0.5 text-[10px] font-mono",
              hasError
                ? "bg-red-500/10 text-red-400/80"
                : "bg-emerald-500/10 text-emerald-400/80"
            )}
          >
            exit {output.exit_code}
          </span>
        )}
      </div>

      <div 
        className="scrollbar-thin flex-1 overflow-auto p-3 font-mono text-[13px] leading-relaxed cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {isRunningCode ? (
          <div className="flex items-center gap-2 text-amber-400/70">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            <span>Executing in sandbox...</span>
          </div>
        ) : output ? (
          <pre className="whitespace-pre-wrap">
            {output.stdout && (
              <span className="text-emerald-300/80">{output.stdout}</span>
            )}
            {output.stderr && (
              <span className="text-red-400/80">
                {output.stdout ? "\n" : ""}
                {output.stderr}
              </span>
            )}
            {!output.stdout && !output.stderr && (
              <span className="text-white/20">Process exited with no output.</span>
            )}
          </pre>
        ) : !cmdHistory.length ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <pre className={cn("text-center text-[10px] leading-tight cursor-default", THEME_COLORS[theme])}>
              {HERO_ASCII[theme]}
            </pre>
            <span className="text-[10px] tracking-[0.2em] text-white/15 cursor-default">
              READY
            </span>
          </div>
        ) : null}

        {/* Command History */}
        {cmdHistory.length > 0 && (
          <div className="mt-4 whitespace-pre-wrap text-white/50">
            {cmdHistory.join("\n\n")}
          </div>
        )}

        {/* Interactive Prompt */}
        {!isRunningCode && (
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("font-bold", THEME_COLORS[theme])}>$</span>
            <input
              ref={inputRef}
              type="text"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              onKeyDown={handleCommand}
              className="flex-1 bg-transparent outline-none text-white/80 placeholder:text-transparent caret-white"
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
