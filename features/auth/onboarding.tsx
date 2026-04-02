"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { heroThemes } from "@/themes/superheroes";
import { saveOnboarding } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { HeroTheme } from "@/lib/types";

export function OnboardingFlow() {
  const profile = useAppStore((state) => state.profile);
  const setTheme = useAppStore((state) => state.setTheme);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [username, setUsername] = useState(profile?.username ?? "CaptainDev");
  const [heroTheme, setHeroTheme] = useState<HeroTheme>(profile?.heroTheme ?? "spiderman");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const updatedProfile = await saveOnboarding({
        username,
        heroTheme,
        avatar: heroTheme
      });
      setTheme(heroTheme);
      completeOnboarding(updatedProfile);
      toast.success(`${updatedProfile.username} is ready for hero mode.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hero-pattern min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Badge variant="accent">Onboarding</Badge>
          <h1 className="font-display text-5xl leading-tight">Choose your superhero command skin.</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Pick the visual identity, avatar, and operator name that should follow you through the IDE.
          </p>
        </motion.div>

        <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <Card>
            <CardHeader>
              <CardTitle>Operator profile</CardTitle>
              <CardDescription>
                Your selection is saved in Zustand and synced to the backend profile service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="metric-label">Username</label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} />
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <p className="metric-label">Selected identity</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/10">
                    <Image
                      src={heroThemes.find((theme) => theme.id === heroTheme)?.asset ?? heroThemes[0].asset}
                      alt={heroTheme}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold">
                      {heroThemes.find((theme) => theme.id === heroTheme)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {heroThemes.find((theme) => theme.id === heroTheme)?.voiceLabel}
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleContinue} disabled={loading || !username.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enter the IDE
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            {heroThemes.map((theme, index) => {
              const active = heroTheme === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  type="button"
                  onClick={() => setHeroTheme(theme.id)}
                  className={cn(
                    "panel-surface text-left transition duration-300",
                    active
                      ? "border-primary/40 shadow-accent"
                      : "border-white/10 hover:-translate-y-1 hover:bg-white/10"
                  )}
                >
                  <div className="relative h-56 overflow-hidden rounded-t-[24px]">
                    <Image src={theme.asset} alt={theme.name} fill className="object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${theme.palette[0]}33)`
                      }}
                    />
                  </div>
                  <div className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-2xl font-semibold">{theme.name}</p>
                      <Badge variant={active ? "accent" : "default"}>{theme.voiceLabel}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{theme.title}</p>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
