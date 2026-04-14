"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBar } from "@/components/layout/status-bar";
import { FileExplorer } from "@/components/ide/file-explorer";
import { EditorPanel } from "@/components/ide/editor-panel";
import { AgentPanel } from "@/components/agent/agent-panel";
import { useAppStore } from "@/store/app-store";

/* ──────────────────────────────────────────────
   Custom resize handle hook
   ────────────────────────────────────────────── */
function useResizeHandle(
  direction: "left" | "right",
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
) {
  const [width, setWidth] = useState(initialWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = direction === "left"
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setWidth(next);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [direction, minWidth, maxWidth]);

  return { width, onMouseDown };
}

/* ──────────────────────────────────────────────
   Resize handle bar
   ────────────────────────────────────────────── */
function ResizeBar({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="group relative z-10 flex shrink-0 cursor-col-resize items-center justify-center"
      style={{ width: 6 }}
      onMouseDown={onMouseDown}
    >
      {/* Visible line */}
      <div
        className="h-full transition-all duration-150"
        style={{
          width: 1,
          background: "linear-gradient(180deg, transparent, rgba(var(--theme-primary-raw), 0.12), transparent)",
        }}
      />
      {/* Hover indicator */}
      <div
        className="absolute rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          width: 3,
          height: 32,
          background: "rgba(var(--theme-primary-raw), 0.35)",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   App Shell
   ────────────────────────────────────────────── */
export function AppShell() {
  const theme = useAppStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const explorer = useResizeHandle("left", containerRef, 240, 160, 360);
  const agent = useResizeHandle("right", containerRef, 400, 280, 640);

  return (
    <div ref={containerRef} className="flex h-screen flex-col overflow-hidden bg-[#08080c]">
      {/* Top glow accent line */}
      <div
        className="h-[1px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, transparent 5%, rgba(var(--theme-primary-raw), 0.4) 30%, rgba(var(--theme-primary-raw), 0.5) 50%, rgba(var(--theme-primary-raw), 0.4) 70%, transparent 95%)`,
        }}
      />
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {/* File Explorer */}
        <div className="shrink-0 overflow-hidden" style={{ width: explorer.width }}>
          <FileExplorer />
        </div>

        <ResizeBar onMouseDown={explorer.onMouseDown} />

        {/* Code Editor - takes remaining space */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <EditorPanel />
        </div>

        <ResizeBar onMouseDown={agent.onMouseDown} />

        {/* Agent Panel */}
        <div className="shrink-0 overflow-hidden" style={{ width: agent.width }}>
          <AgentPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
