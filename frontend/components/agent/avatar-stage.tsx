"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { heroThemeMap } from "@/themes/superheroes";
import { useAppStore } from "@/store/app-store";
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
  const color = hero.palette[0];

  const active = isSpeaking || isThinking;
  const status = isSpeaking ? "Speaking" : isThinking ? "Processing" : "Online";
  const dotColor = isSpeaking
    ? "#34d399"
    : isThinking
      ? "#fbbf24"
      : "#34d39990";

  return (
    <div className="relative flex items-center gap-3 overflow-hidden border-b border-white/[0.04] px-4 py-3">
      {/* Ambient glow behind avatar */}
      <motion.div
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full blur-xl pointer-events-none"
        style={{
          width: 60,
          height: 60,
          background: `radial-gradient(circle, ${color}15, transparent)`,
        }}
        animate={active ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] } : { scale: 1, opacity: 0.2 }}
        transition={{ duration: 2, repeat: active ? Infinity : 0 }}
      />

      {/* Avatar container - modern rounded 3D */}
      <div className="relative shrink-0">
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-1 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${color}25, transparent, ${color}15)`,
            opacity: active ? 1 : 0.3,
          }}
          animate={active ? { opacity: [0.3, 0.7, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Avatar image */}
        <div
          className={cn(
            "relative h-12 w-12 overflow-hidden rounded-2xl border-2 bg-black/40",
            "shadow-lg transition-all duration-500",
          )}
          style={{
            borderColor: active ? `${color}50` : "rgba(255,255,255,0.08)",
            boxShadow: active
              ? `0 4px 20px ${color}20, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <Image
            src={hero.asset}
            alt={hero.name}
            fill
            className="object-cover"
            priority
          />
          {/* Glass reflection */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
            }}
          />
          {/* Bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      {/* Name + status - inline */}
      <div className="relative flex flex-col min-w-0">
        <p className="text-sm font-semibold text-white/80 truncate">
          {hero.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <motion.div
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
            animate={active ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: active ? Infinity : 0 }}
          />
          <span className="text-[9px] tracking-wider text-white/30 uppercase">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
