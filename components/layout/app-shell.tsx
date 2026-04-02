"use client";

import { Cpu, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { EditorPanel } from "@/components/ide/editor-panel";
import { AgentPanel } from "@/components/agent/agent-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { heroThemes } from "@/themes/superheroes";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const metrics: Array<{ icon: LucideIcon; label: string; value: string }> = [
  { icon: ShieldCheck, label: "Face Auth", value: "JWT session active" },
  { icon: Cpu, label: "Sandbox", value: "Docker execution service" },
  { icon: Sparkles, label: "AI routing", value: "Falcon + Qwen fallback" }
];

export function AppShell() {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return (
    <main className="hero-pattern min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px] space-y-6">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-surface flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent">SuperHero AI IDE</Badge>
              <Badge>{profile?.username}</Badge>
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">
                Build software with a cinematic AI control room.
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                The editor, agent panel, Face ID profile, voice system, and execution runtime are all routed through the FastAPI gateway.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 metric-label">{label}</p>
                <p className="mt-1 text-sm text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </motion.header>

        <section className="flex flex-wrap gap-3">
          {heroThemes.map((hero) => (
            <Button
              key={hero.id}
              variant={hero.id === theme ? "default" : "secondary"}
              onClick={() => setTheme(hero.id)}
              className={cn(
                "rounded-full",
                hero.id !== theme && "border border-white/10 bg-white/5"
              )}
            >
              {hero.name}
            </Button>
          ))}
        </section>

        <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.9fr]">
          <EditorPanel />
          <AgentPanel />
        </div>
      </div>
    </main>
  );
}
