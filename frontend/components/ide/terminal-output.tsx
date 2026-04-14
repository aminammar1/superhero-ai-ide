"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Terminal as TerminalIcon, ChevronRight, Zap, Cpu, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shellCommand } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { HeroTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════
   JARVIS-STYLE TERMINAL — Futuristic HUD
   ═══════════════════════════════════════════ */

const HERO_TERMINAL: Record<HeroTheme, {
  name: string;
  prompt: string;
  bootTitle: string;
  systemLabel: string;
  color: string;
  colorRgb: string;
  dimColor: string;
  bgGradient: string;
  scanColor: string;
}> = {
  ironman: {
    name: "J.A.R.V.I.S.",
    prompt: "jarvis",
    bootTitle: "J.A.R.V.I.S. TERMINAL v3.2",
    systemLabel: "STARK INDUSTRIES",
    color: "#f59e0b",
    colorRgb: "245, 158, 11",
    dimColor: "rgba(245, 158, 11, 0.15)",
    bgGradient: "radial-gradient(ellipse at 20% 80%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)",
    scanColor: "rgba(245, 158, 11, 0.4)",
  },
  batman: {
    name: "BATCOMPUTER",
    prompt: "batshell",
    bootTitle: "BATCOMPUTER TERMINAL v2.1",
    systemLabel: "WAYNE ENTERPRISES",
    color: "#eab308",
    colorRgb: "234, 179, 8",
    dimColor: "rgba(234, 179, 8, 0.12)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(234, 179, 8, 0.02) 0%, transparent 50%)",
    scanColor: "rgba(234, 179, 8, 0.3)",
  },
  spiderman: {
    name: "WEB-TERMINAL",
    prompt: "spidey",
    bootTitle: "WEB-TERMINAL v1.5",
    systemLabel: "SPIDER-SENSE ONLINE",
    color: "#ef4444",
    colorRgb: "239, 68, 68",
    dimColor: "rgba(239, 68, 68, 0.12)",
    bgGradient: "radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)",
    scanColor: "rgba(239, 68, 68, 0.4)",
  },
  superman: {
    name: "FORTRESS-OS",
    prompt: "krypton",
    bootTitle: "FORTRESS-OS TERMINAL v1.0",
    systemLabel: "KRYPTONIAN INTERFACE",
    color: "#3b82f6",
    colorRgb: "59, 130, 246",
    dimColor: "rgba(59, 130, 246, 0.12)",
    bgGradient: "radial-gradient(ellipse at 30% 70%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)",
    scanColor: "rgba(59, 130, 246, 0.4)",
  },
};

/* ────────────────────────────────────────────
   HUD Scan Line Effect
   ──────────────────────────────────────────── */
function HudScanLine({ color }: { color: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 right-0 z-10 h-[1px]"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
        boxShadow: `0 0 8px ${color}, 0 0 20px ${color}`,
      }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ────────────────────────────────────────────
   Hex Grid Background
   ──────────────────────────────────────────── */
function HexGridBg({ color }: { color: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex-terminal" width="30" height="26" patternUnits="userSpaceOnUse">
          <polygon
            points="15,0 30,8.66 30,17.32 15,26 0,17.32 0,8.66"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-terminal)" />
    </svg>
  );
}

/* ────────────────────────────────────────────
   Animated Boot Sequence
   ──────────────────────────────────────────── */
function BootSequence({ config, onComplete }: { config: typeof HERO_TERMINAL.ironman; onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const bootLines = [
    `> Initializing ${config.name}...`,
    `> Loading neural interface.............. [OK]`,
    `> Connecting to AI backbone............. [OK]`,
    `> Sandbox environment ready............. [OK]`,
    `> Code execution engine online.......... [OK]`,
    `> ${config.systemLabel} — All systems nominal`,
    ``,
    `  ╔══════════════════════════════════════════╗`,
    `  ║   ${config.bootTitle.padEnd(39)}║`,
    `  ║   Status: OPERATIONAL                    ║`,
    `  ║   Type "help" for available commands      ║`,
    `  ╚══════════════════════════════════════════╝`,
    ``,
  ];

  const isOkLine = (line: string | undefined) => typeof line === "string" && line.includes("[OK]");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i] ?? ""]);
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete();
      }
    }, 80);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mb-2">
      {lines.map((line, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="leading-[1.6]"
          style={{ color: isOkLine(line) ? config.color : `rgba(${config.colorRgb}, 0.4)` }}
        >
          {line}
        </motion.div>
      ))}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-2 h-3 ml-1"
          style={{ backgroundColor: config.color }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   HUD Status Indicators
   ──────────────────────────────────────────── */
function HudStatusBar({ config }: { config: typeof HERO_TERMINAL.ironman }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="flex items-center justify-between px-3 py-1 border-b font-mono text-[9px] tracking-[0.15em]"
      style={{
        borderColor: `rgba(${config.colorRgb}, 0.1)`,
        color: `rgba(${config.colorRgb}, 0.5)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <motion.div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span>ONLINE</span>
        </div>
        <span>SEC: ACTIVE</span>
      </div>
      <div className="flex items-center gap-3">
        <span>MEM: 64MB</span>
        <span>CPU: IDLE</span>
        <span>{time.toLocaleTimeString("en-US", { hour12: false })}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Command Output Block
   ──────────────────────────────────────────── */
function OutputBlock({ text, isError, config }: {
  text: string;
  isError: boolean;
  config: typeof HERO_TERMINAL.ironman;
}) {
  return (
    <motion.pre
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="whitespace-pre-wrap text-[11px] leading-relaxed"
      style={{
        color: isError ? "rgba(248, 113, 113, 0.85)" : `rgba(${config.colorRgb}, 0.7)`,
        textShadow: isError ? "0 0 6px rgba(248, 113, 113, 0.3)" : `0 0 6px rgba(${config.colorRgb}, 0.15)`,
      }}
    >
      {text}
    </motion.pre>
  );
}

/* ════════════════════════════════════════════
   MAIN TERMINAL COMPONENT
   ════════════════════════════════════════════ */
export function TerminalOutput() {
  const output = useAppStore((s) => s.output);
  const setOutput = useAppStore((s) => s.setOutput);
  const isRunningCode = useAppStore((s) => s.isRunningCode);
  const theme = useAppStore((s) => s.theme);
  const config = HERO_TERMINAL[theme];

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cmdInput, setCmdInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<Array<{ cmd: string; output: string; isError: boolean }>>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cmdLog, setCmdLog] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, cmdHistory, bootComplete]);

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdLog.length > 0) {
        const newIdx = historyIdx < cmdLog.length - 1 ? historyIdx + 1 : historyIdx;
        setHistoryIdx(newIdx);
        setCmdInput(cmdLog[cmdLog.length - 1 - newIdx] || "");
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setCmdInput(cmdLog[cmdLog.length - 1 - newIdx] || "");
      } else {
        setHistoryIdx(-1);
        setCmdInput("");
      }
      return;
    }

    if (e.key === "Enter" && cmdInput.trim()) {
      const currentInput = cmdInput.trim();
      setCmdInput("");
      setCmdLog(prev => [...prev, currentInput]);
      setHistoryIdx(-1);

      const cmd = currentInput.split(" ")[0].toLowerCase();

      if (cmd === "clear") {
        setOutput(null);
        setCmdHistory([]);
        return;
      }

      if (cmd === "help") {
        setCmdHistory(prev => [...prev, {
          cmd: currentInput,
          output: [
            "╔═══════════════════════════════════════╗",
            "║         COMMAND REFERENCE              ║",
            "╠═══════════════════════════════════════╣",
            "║  clear      Reset terminal display     ║",
            "║  help       Show this reference         ║",
            "║  whoami     Display hero identity        ║",
            "║  status     System diagnostics           ║",
            "║  <code>     Execute in sandbox           ║",
            "╚═══════════════════════════════════════╝",
          ].join("\n"),
          isError: false,
        }]);
        return;
      }

      if (cmd === "whoami") {
        setCmdHistory(prev => [...prev, {
          cmd: currentInput,
          output: [
            `┌─── IDENTITY ───────────────────────┐`,
            `│ System:  ${config.name.padEnd(26)}│`,
            `│ Status:  OPERATIONAL${" ".repeat(15)}│`,
            `│ Mode:    AI-Assisted Development${" ".repeat(3)}│`,
            `│ Engine:  Neural Network v3${" ".repeat(9)}│`,
            `└────────────────────────────────────┘`,
          ].join("\n"),
          isError: false,
        }]);
        return;
      }

      if (cmd === "status") {
        setCmdHistory(prev => [...prev, {
          cmd: currentInput,
          output: [
            `┌─── SYSTEM DIAGNOSTICS ─────────────┐`,
            `│ ● AI Agent ............ CONNECTED   │`,
            `│ ● Sandbox ............. READY        │`,
            `│ ● Voice Engine ........ STANDBY      │`,
            `│ ● Code Executor ....... ONLINE       │`,
            `│ ● Memory Usage ........ 23.4 MB      │`,
            `└────────────────────────────────────┘`,
          ].join("\n"),
          isError: false,
        }]);
        return;
      }

      // Execute in workspace shell
      setCmdHistory(prev => [...prev, {
        cmd: currentInput,
        output: "⟳ Running...",
        isError: false,
      }]);

      try {
        const result = await shellCommand(currentInput);
        setCmdHistory(prev => {
          const updated = [...prev];
          let resultText = "";
          if (result.stdout) resultText += result.stdout;
          if (result.stderr) resultText += (resultText ? "\n" : "") + result.stderr;
          if (!resultText) resultText = `Process exited with code ${result.exit_code}`;
          updated[updated.length - 1] = {
            cmd: currentInput,
            output: resultText,
            isError: result.exit_code !== 0,
          };
          return updated;
        });
      } catch {
        setCmdHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            cmd: currentInput,
            output: "✘ Command failed — workspace unreachable",
            isError: true,
          };
          return updated;
        });
      }
    }
  };

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, #050508 0%, #08080c 100%)`,
        borderTop: `1px solid rgba(${config.colorRgb}, 0.12)`,
        boxShadow: `inset 0 1px 30px rgba(${config.colorRgb}, 0.02)`,
      }}
    >
      {/* HUD Background Effects */}
      <HexGridBg color={config.color} />
      <HudScanLine color={`rgba(${config.colorRgb}, 0.06)`} />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: config.bgGradient }}
      />

      {/* Corner HUD decorations */}
      <div className="pointer-events-none absolute top-0 left-0 w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, ${config.color}, transparent)`, opacity: 0.3 }} />
        <div className="absolute top-0 left-0 h-full w-[1px]" style={{ background: `linear-gradient(180deg, ${config.color}, transparent)`, opacity: 0.3 }} />
      </div>
      <div className="pointer-events-none absolute top-0 right-0 w-8 h-8">
        <div className="absolute top-0 right-0 w-full h-[1px]" style={{ background: `linear-gradient(270deg, ${config.color}, transparent)`, opacity: 0.3 }} />
        <div className="absolute top-0 right-0 h-full w-[1px]" style={{ background: `linear-gradient(180deg, ${config.color}, transparent)`, opacity: 0.3 }} />
      </div>

      {/* Header */}
      <div
        className="relative flex h-8 shrink-0 items-center gap-3 px-3"
        style={{
          borderBottom: `1px solid rgba(${config.colorRgb}, 0.08)`,
          background: `linear-gradient(90deg, rgba(${config.colorRgb}, 0.04), transparent)`,
        }}
      >
        {/* Terminal dots */}
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500/50 hover:bg-red-500/80 transition" />
          <div className="h-2 w-2 rounded-full bg-amber-500/50 hover:bg-amber-500/80 transition" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/50 hover:bg-emerald-500/80 transition" />
        </div>

        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3 w-3" style={{ color: config.color, opacity: 0.6 }} />
          <span
            className="text-[9px] font-mono font-bold tracking-[0.2em]"
            style={{ color: `rgba(${config.colorRgb}, 0.6)` }}
          >
            {config.name}
          </span>
        </div>

        {/* Right side indicators */}
        <div className="ml-auto flex items-center gap-2">
          {output && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider",
                output.exit_code !== 0
                  ? "bg-red-500/10 text-red-400/80"
                  : "bg-emerald-500/10 text-emerald-400/80"
              )}
            >
              {output.exit_code === 0 ? "✓ EXIT 0" : `✘ EXIT ${output.exit_code}`}
            </span>
          )}
          <motion.div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>

      {/* HUD Status Bar */}
      <HudStatusBar config={config} />

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="scrollbar-thin relative flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Boot sequence */}
        {!bootComplete && (
          <BootSequence config={config} onComplete={() => setBootComplete(true)} />
        )}

        {/* Running state */}
        {isRunningCode && (
          <div className="flex items-center gap-2 my-2" style={{ color: config.color }}>
            <motion.div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{ backgroundColor: config.color }}
                  animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                  transition={{ duration: 0.4 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </motion.div>
            <span className="text-[10px] tracking-wider" style={{ color: `rgba(${config.colorRgb}, 0.7)` }}>
              EXECUTING IN SANDBOX
            </span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ color: `rgba(${config.colorRgb}, 0.5)` }}
            >
              ▎
            </motion.span>
          </div>
        )}

        {/* Code execution output */}
        {!isRunningCode && output && (
          <div className="my-2">
            <div
              className="mb-1 text-[9px] tracking-[0.15em]"
              style={{ color: `rgba(${config.colorRgb}, 0.3)` }}
            >
              ──── OUTPUT ────────────────────────
            </div>
            {output.stdout && <OutputBlock text={output.stdout} isError={false} config={config} />}
            {output.stderr && <OutputBlock text={output.stderr} isError={true} config={config} />}
            {!output.stdout && !output.stderr && (
              <span style={{ color: `rgba(${config.colorRgb}, 0.2)` }}>
                Process exited with no output.
              </span>
            )}
            <div
              className="mt-1 text-[9px] tracking-[0.15em]"
              style={{ color: `rgba(${config.colorRgb}, 0.2)` }}
            >
              ────────────────── {output.duration_ms ? `${output.duration_ms}ms` : ""} ──
            </div>
          </div>
        )}

        {/* Command History */}
        {cmdHistory.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-2.5 w-2.5" style={{ color: config.color }} />
              <span
                className="text-[10px] font-bold"
                style={{ color: config.color, textShadow: `0 0 10px rgba(${config.colorRgb}, 0.3)` }}
              >
                {config.prompt}
              </span>
              <span style={{ color: `rgba(${config.colorRgb}, 0.3)` }}>›</span>
              <span style={{ color: `rgba(${config.colorRgb}, 0.7)` }}>{entry.cmd}</span>
            </div>
            <div className="ml-5 mt-0.5">
              <OutputBlock text={entry.output} isError={entry.isError} config={config} />
            </div>
          </div>
        ))}

        {/* Interactive Prompt */}
        {bootComplete && !isRunningCode && (
          <div className="mt-1 flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronRight className="h-2.5 w-2.5" style={{ color: config.color }} />
            </motion.div>
            <span
              className="text-[10px] font-bold"
              style={{ color: config.color, textShadow: `0 0 10px rgba(${config.colorRgb}, 0.3)` }}
            >
              {config.prompt}
            </span>
            <span style={{ color: `rgba(${config.colorRgb}, 0.3)` }}>›</span>
            <input
              ref={inputRef}
              type="text"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              onKeyDown={handleCommand}
              className="flex-1 bg-transparent outline-none placeholder:text-transparent text-[11px]"
              style={{
                color: `rgba(${config.colorRgb}, 0.85)`,
                caretColor: config.color,
                textShadow: `0 0 4px rgba(${config.colorRgb}, 0.2)`,
              }}
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
            <motion.span
              className="inline-block w-[6px] h-[14px] rounded-sm"
              style={{ backgroundColor: config.color }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        )}
      </div>

      {/* Bottom HUD line */}
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${config.colorRgb}, 0.2), transparent)`,
        }}
      />
    </div>
  );
}
