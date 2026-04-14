"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { heroThemes } from "@/themes/superheroes";
import { saveOnboarding } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { HeroTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OnboardingFlow() {
  const profile = useAppStore((s) => s.profile);
  const setTheme = useAppStore((s) => s.setTheme);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [index, setIndex] = useState(0);
  const [username, setUsername] = useState(profile?.username || "");
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);

  const hero = heroThemes[index];
  const heroId = hero.id as HeroTheme;

  const navigate = (dir: -1 | 1) => {
    setDirection(dir);
    setIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return heroThemes.length - 1;
      if (next >= heroThemes.length) return 0;
      return next;
    });
  };

  const handleLaunch = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Enter your operator name.");
      return;
    }

    setLoading(true);
    try {
      const updated = await saveOnboarding({
        username: trimmed,
        heroTheme: heroId,
        avatar: heroId,
      });
      setTheme(heroId);
      completeOnboarding(updated);
      toast.success(`${updated.username}, ready to go.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden transition-all duration-700"
      style={{
        background: `radial-gradient(circle at 50% 55%, ${hero.palette[0]}12, transparent 50%), linear-gradient(180deg, #030308, #0a0a14)`,
      }}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-10 text-center"
      >
        <p className="text-[10px] tracking-[0.35em] text-white/20">
          SELECT YOUR
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white/85">
          Hero Companion
        </h1>
      </motion.div>

      {/* Carousel */}
      <div className="relative flex items-center gap-10">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Hero spotlight */}
        <div className="relative flex w-64 flex-col items-center">
          {/* Glow behind hero */}
          <div
            className="absolute top-6 h-48 w-48 rounded-full opacity-15 blur-3xl transition-colors duration-700"
            style={{ background: hero.palette[0] }}
          />

          {/* Hero image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.id}
              initial={{ opacity: 0, x: direction * 60, scale: 0.88 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.88 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="animate-float relative h-56 w-56 overflow-hidden rounded-3xl border-2 border-white/[0.08] bg-black/40">
                <Image
                  src={hero.asset}
                  alt={hero.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Hero info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 text-center"
            >
              <h2 className="font-display text-xl font-bold text-white/85">
                {hero.name}
              </h2>
              <p className="mt-1 text-xs text-white/35">{hero.title}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => navigate(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="mt-6 flex items-center gap-2">
        {heroThemes.map((h, i) => (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index
                ? "w-5 bg-primary/60"
                : "w-1.5 bg-white/15 hover:bg-white/25"
            )}
          />
        ))}
      </div>

      {/* Name input */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <label className="text-[10px] tracking-[0.25em] text-white/25">
          OPERATOR NAME
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          className="w-64 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-center text-sm text-white/80 outline-none placeholder:text-white/15 focus:border-primary/25"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleLaunch();
            }
          }}
        />
      </div>

      {/* Launch button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        type="button"
        onClick={() => void handleLaunch()}
        disabled={loading || !username.trim()}
        className="mt-8 flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/10 px-8 py-3 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-30"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        Launch IDE
      </motion.button>
    </main>
  );
}
