"use client";

import { TopBar } from "@/components/layout/top-bar";
import { StatusBar } from "@/components/layout/status-bar";
import { FileExplorer } from "@/components/ide/file-explorer";
import { EditorPanel } from "@/components/ide/editor-panel";
import { AgentPanel } from "@/components/agent/agent-panel";

export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#08080c]">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <div className="w-[220px] shrink-0">
          <FileExplorer />
        </div>
        <div className="min-w-0 flex-1">
          <EditorPanel />
        </div>
        <div className="w-[400px] shrink-0 2xl:w-[440px]">
          <AgentPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
