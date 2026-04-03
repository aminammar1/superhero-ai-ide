"use client";

import Image from "next/image";
import { heroThemeMap } from "@/themes/superheroes";
import { useAppStore } from "@/store/app-store";
import { HeroMotif } from "@/components/ui/hero-motif";
import { cn } from "@/lib/utils";

interface AvatarStageProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export function AvatarStage({
  isSpeaking = false,
  isThinking = false,
}: AvatarStageProps) {
  const theme = useAppStore((s) => s.theme);
  const hero = heroThemeMap[theme];

  const active = isSpeaking || isThinking;
  const status = isSpeaking ? "Speaking" : isThinking ? "Thinking" : "Online";
  const dotColor = isSpeaking
    ? "bg-emerald-400"
    : isThinking
      ? "bg-amber-400"
      : "bg-emerald-400/60";

  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden border-b border-white/[0.04] py-5">
      {/* Hero motif background */}
      <HeroMotif
        theme={theme}
        className="right-[-30px] top-[-20px] h-[180px] w-[180px] text-primary"
      />
      <HeroMotif
        theme={theme}
        className="bottom-[-40px] left-[-20px] h-[120px] w-[120px] rotate-45 text-accent"
      />

      <div className="relative" style={{ perspective: "600px" }}>
        {/* Glow ring */}
        <div
          className={cn(
            "absolute -inset-3 rounded-full transition-all duration-700",
            active ? "animate-glow-breathe" : "opacity-10"
          )}
          style={{
            background: `radial-gradient(circle, transparent 50%, ${hero.palette[0]}30 70%, transparent 85%)`,
          }}
        />

        {/* 3D avatar container */}
        <div
          className={cn(
            "relative h-28 w-28 overflow-hidden rounded-full border-2 bg-black/40",
            active ? "border-primary/40" : "border-white/[0.08]"
          )}
          style={{
            animation: "avatar-float 4s ease-in-out infinite, avatar-tilt 6s ease-in-out infinite",
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src={hero.asset}
            alt={hero.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Gloss highlight */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* Shadow below avatar */}
        <div
          className="absolute -bottom-2 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-black/30 blur-md"
          style={{ animation: "shadow-pulse 4s ease-in-out infinite" }}
        />
      </div>

      {/* Name + status */}
      <div className="relative text-center">
        <p className="font-display text-base font-semibold text-white/85">
          {hero.name}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              dotColor,
              active && "animate-pulse"
            )}
          />
          <span className="text-[10px] tracking-widest text-white/35">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
