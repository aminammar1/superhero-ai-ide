"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { heroThemeMap } from "@/themes/superheroes";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { HeroMotif } from "@/components/ui/hero-motif";

export function TopBar() {
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useAppStore((s) => s.setVoiceEnabled);
  const hero = heroThemeMap[theme];
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-black/50 px-4 backdrop-blur-xl overflow-hidden">
        {/* Subtle hero motif in top bar */}
        <HeroMotif
          theme={theme}
          className="right-[120px] top-[-30px] h-[100px] w-[100px] text-primary"
        />

        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-display text-sm font-semibold tracking-[0.15em] text-white/80">
            SUPERHERO AI IDE
          </span>
          <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] tracking-wide text-white/25">
            {hero.name}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70 transition"
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1">
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-white/10">
              <Image src={hero.asset} alt={hero.name} fill className="object-cover" />
            </div>
            <span className="text-xs text-white/60">{profile?.username || "Hero"}</span>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/60 transition"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
