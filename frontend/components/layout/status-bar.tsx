"use client";

import Image from "next/image";
import { useAppStore } from "@/store/app-store";
import { useFileStore } from "@/store/file-store";
import { heroThemeMap } from "@/themes/superheroes";

const languageLabels: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  go: "Go",
  java: "Java",
  c: "C",
  cpp: "C++",
};

export function StatusBar() {
  const language = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const isRunningCode = useAppStore((s) => s.isRunningCode);
  const activeFileId = useFileStore((s) => s.activeFileId);
  const getFileById = useFileStore((s) => s.getFileById);
  const hero = heroThemeMap[theme];

  const activeFile = activeFileId ? getFileById(activeFileId) : null;
  const displayLang = activeFile?.language || language;

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-white/[0.06] bg-black/50 px-4 text-[11px] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <span className="text-white/50">{languageLabels[displayLang] || displayLang}</span>
        <span className="text-white/25">UTF-8</span>
        <span className="text-white/25">LF</span>
        {activeFile && (
          <span className="text-white/30">{activeFile.name}</span>
        )}
        {isRunningCode && (
          <span className="text-amber-400/80">Running...</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="relative h-4 w-4 overflow-hidden rounded-full border border-white/10">
            <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
          </div>
          <span className="text-white/40">{hero.name}</span>
        </div>
        <span className={voiceEnabled ? "text-emerald-400/70" : "text-white/25"}>
          Voice {voiceEnabled ? "ON" : "OFF"}
        </span>
      </div>
    </footer>
  );
}
