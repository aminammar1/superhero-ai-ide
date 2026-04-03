"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { heroThemes, heroThemeMap } from "@/themes/superheroes";
import { cn } from "@/lib/utils";
import type { HeroTheme } from "@/lib/types";

export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const profile = useAppStore((s) => s.profile);
  const theme = useAppStore((s) => s.theme);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const setTheme = useAppStore((s) => s.setTheme);
  const setVoiceEnabled = useAppStore((s) => s.setVoiceEnabled);
  const logout = useAppStore((s) => s.logout);
  const [localName, setLocalName] = useState(profile?.username || "");

  const hero = heroThemeMap[theme];

  const handleLogout = () => {
    logout();
    onClose();
    toast.success("Logged out.");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-white/[0.06] bg-[#0a0a0e]/95 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-5">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/70">
                  Settings
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              {/* Profile */}
              <section className="space-y-4">
                <p className="text-[10px] tracking-[0.25em] text-white/25">
                  PROFILE
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/[0.08]">
                    <Image
                      src={hero.asset}
                      alt={hero.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {profile?.username || "Hero"}
                    </p>
                    <p className="text-[11px] text-white/30">
                      {hero.name} theme
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-[0.2em] text-white/25">
                    DISPLAY NAME
                  </label>
                  <input
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/15 focus:border-primary/25"
                  />
                </div>
              </section>

              {/* Theme */}
              <section className="mt-8 space-y-4">
                <p className="text-[10px] tracking-[0.25em] text-white/25">
                  HERO THEME
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {heroThemes.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setTheme(h.id as HeroTheme)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-3 transition",
                        h.id === theme
                          ? "border-primary/30 bg-primary/10"
                          : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/[0.08]">
                        <Image
                          src={h.asset}
                          alt={h.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          h.id === theme
                            ? "text-primary"
                            : "text-white/50"
                        )}
                      >
                        {h.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Voice */}
              <section className="mt-8 space-y-4">
                <p className="text-[10px] tracking-[0.25em] text-white/25">
                  VOICE
                </p>
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 transition",
                    voiceEnabled
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-white/[0.04] bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {voiceEnabled ? (
                      <Volume2 className="h-4 w-4 text-emerald-400/70" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-white/30" />
                    )}
                    <span className="text-xs text-white/60">
                      Voice responses
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-9 rounded-full p-0.5 transition",
                      voiceEnabled ? "bg-emerald-500/40" : "bg-white/10"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full bg-white transition-transform",
                        voiceEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </div>
                </button>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] p-5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/5 py-2.5 text-sm text-red-400/70 transition hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
