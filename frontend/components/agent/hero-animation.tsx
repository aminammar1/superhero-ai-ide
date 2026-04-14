"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { useAgentStore, type HeroAnimationType } from "@/store/agent-store";
import { HeroMotif } from "@/components/ui/hero-motif";
import type { HeroTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

const HERO_EFFECTS: Record<HeroTheme, {
  label: string;
  gradient: string;
  glowColor: string;
}> = {
  spiderman: {
    label: "WEB-SLINGING...",
    gradient: "from-red-600/30 via-blue-600/20 to-red-600/10",
    glowColor: "rgba(239, 68, 68, 0.4)",
  },
  batman: {
    label: "DEPLOYING BATCOMPUTER...",
    gradient: "from-amber-900/20 via-slate-900/40 to-black/60",
    glowColor: "rgba(234, 179, 8, 0.3)",
  },
  superman: {
    label: "ACTIVATING FORTRESS...",
    gradient: "from-blue-600/30 via-red-500/15 to-blue-700/20",
    glowColor: "rgba(59, 130, 246, 0.4)",
  },
  ironman: {
    label: "J.A.R.V.I.S. PROCESSING...",
    gradient: "from-amber-500/20 via-orange-600/15 to-red-600/10",
    glowColor: "rgba(245, 158, 11, 0.4)",
  },
};

function FloatingDot({ delay, x, y, color }: { delay: number; x: number; y: number; color: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
      style={{ background: color }}
      initial={{ opacity: 0, x: `${x}%`, y: `${y}%` }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0.5],
        x: `${x + (Math.random() - 0.5) * 40}%`,
        y: `${y - 30 - Math.random() * 20}%`,
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
        ease: "easeOut",
      }}
    />
  );
}

function HexGrid({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex" width="50" height="43.3" patternUnits="userSpaceOnUse">
          <polygon
            points="25,0 50,14.4 50,28.9 25,43.3 0,28.9 0,14.4"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

function ScanLine({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px]"
      style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` }}
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function CircuitLines({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.08]" viewBox="0 0 400 300" fill="none">
      <motion.path
        d="M0 150 L80 150 L100 120 L160 120 L180 150 L260 150 L280 180 L360 180 L400 180"
        stroke={color}
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
      />
      <motion.path
        d="M0 80 L60 80 L80 60 L140 60 L160 80 L240 80 L260 60 L340 60 L400 60"
        stroke={color}
        strokeWidth="0.8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, delay: 0.3, repeat: Infinity, repeatType: "loop" }}
      />
      <motion.path
        d="M0 220 L100 220 L120 240 L200 240 L220 220 L320 220 L340 200 L400 200"
        stroke={color}
        strokeWidth="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 0.6, repeat: Infinity, repeatType: "loop" }}
      />
    </svg>
  );
}

function ProgressDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.15,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}

export function HeroProcessingAnimation() {
  const theme = useAppStore((s) => s.theme);
  const heroAnimation = useAgentStore((s) => s.heroAnimation);
  const [progressText, setProgressText] = useState("Initializing...");

  const isActive = heroAnimation === "processing";
  const effect = HERO_EFFECTS[theme];

  useEffect(() => {
    if (!isActive) return;
    const steps = [
      "Analyzing request...",
      "Preparing workspace...",
      "Executing tools...",
      "Validating changes...",
      "Finalizing...",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setProgressText(steps[idx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div className={cn("absolute inset-0 bg-gradient-to-br", effect.gradient)} />
          <HexGrid color={effect.glowColor} />
          <CircuitLines color={effect.glowColor} />
          <ScanLine color={effect.glowColor} />

          {/* Floating dots instead of emoji particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <FloatingDot
              key={i}
              delay={i * 0.4}
              x={15 + Math.random() * 70}
              y={20 + Math.random() * 60}
              color={effect.glowColor}
            />
          ))}

          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Hero motif as the center icon */}
            <div className="relative">
              <motion.div
                className="absolute -inset-8 rounded-full opacity-30 blur-2xl"
                style={{ background: effect.glowColor }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: effect.glowColor,
                  boxShadow: `0 0 30px ${effect.glowColor}, 0 0 60px ${effect.glowColor}`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <HeroMotif theme={theme} className="relative h-14 w-14 text-primary !opacity-60" />
              </motion.div>
            </div>

            <motion.p
              className="font-display text-lg font-bold tracking-[0.3em]"
              style={{ color: effect.glowColor, textShadow: `0 0 20px ${effect.glowColor}` }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {effect.label}
            </motion.p>

            <ProgressDots color={effect.glowColor} />

            <AnimatePresence mode="wait">
              <motion.p
                key={progressText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs tracking-wide text-white/40"
              >
                {progressText}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HeroSuccessFlash() {
  const theme = useAppStore((s) => s.theme);
  const heroAnimation = useAgentStore((s) => s.heroAnimation);
  const setHeroAnimation = useAgentStore((s) => s.setHeroAnimation);
  const effect = HERO_EFFECTS[theme];

  useEffect(() => {
    if (heroAnimation === "success") {
      const timer = setTimeout(() => setHeroAnimation("idle"), 1500);
      return () => clearTimeout(timer);
    }
  }, [heroAnimation, setHeroAnimation]);

  return (
    <AnimatePresence>
      {heroAnimation === "success" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle at center, ${effect.glowColor}, transparent 70%)` }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.5, 2] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5 }}
          >
            <HeroMotif theme={theme} className="relative h-20 w-20 text-primary !opacity-60" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
