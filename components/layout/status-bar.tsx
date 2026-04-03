"use client";

import { useAppStore } from "@/store/app-store";
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
  const hero = heroThemeMap[theme];

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-white/[0.06] bg-black/50 px-4 text-[11px] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <span className="text-white/50">{languageLabels[language] || language}</span>
        <span className="text-white/25">UTF-8</span>
        <span className="text-white/25">LF</span>
        {isRunningCode && (
          <span className="text-amber-400/80">Running...</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: hero.palette[0] }}
          />
          <span className="text-white/40">{hero.name}</span>
        </div>
        <span className={voiceEnabled ? "text-emerald-400/70" : "text-white/25"}>
          Voice {voiceEnabled ? "ON" : "OFF"}
        </span>
      </div>
    </footer>
  );
}
