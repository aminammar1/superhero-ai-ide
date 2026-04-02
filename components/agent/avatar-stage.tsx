"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { heroThemeMap } from "@/themes/superheroes";
import { useAppStore } from "@/store/app-store";

export function AvatarStage() {
  const theme = useAppStore((state) => state.theme);
  const profile = useAppStore((state) => state.profile);
  const hero = heroThemeMap[theme];

  return (
    <div className="panel-surface hero-pattern relative overflow-hidden p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="accent">{hero.name}</Badge>
          <p className="metric-label">voice {hero.voiceLabel}</p>
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-auto aspect-[4/4.7] max-w-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-black/30"
        >
          <Image src={hero.asset} alt={hero.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.04)]" />
        </motion.div>

        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
          <p className="font-display text-2xl font-semibold">
            {profile?.username || "Hero Operator"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{hero.title}</p>
        </div>
      </div>
    </div>
  );
}
