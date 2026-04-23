import type { HeroTheme } from "@/lib/types";

export interface HeroThemeDefinition {
  id: HeroTheme;
  name: string;
  title: string;
  description: string;
  asset: string;
  palette: string[];
  ambientClass: string;
  voiceLabel: string;
}

export const heroThemes: HeroThemeDefinition[] = [
  {
    id: "spiderman",
    name: "Spider-Man",
    title: "Friendly Neighborhood Pair-Programmer",
    description:
      "High-energy gradients, kinetic accents, and web-grid overlays for fast iteration.",
    asset: "/assets/spiderman-3D.jpg",
    palette: ["#ef4444", "#2563eb", "#f97316"],
    ambientClass: "theme-spiderman",
    voiceLabel: "Youthful / energetic"
  },
  {
    id: "batman",
    name: "Batman",
    title: "Stealth Architect",
    description:
      "A stealth UI with noir panels, disciplined spacing, and minimal high-contrast highlights.",
    asset: "/assets/batman-3D.png",
    palette: ["#0f172a", "#eab308", "#334155"],
    ambientClass: "theme-batman",
    voiceLabel: "Deep / dark"
  },
  {
    id: "superman",
    name: "Superman",
    title: "Heroic System Designer",
    description:
      "Bold typography, optimistic gradients, and a clear visual hierarchy for decisive building.",
    asset: "/assets/superman-3D.png",
    palette: ["#2563eb", "#ef4444", "#f8fafc"],
    ambientClass: "theme-superman",
    voiceLabel: "Confident / heroic"
  },
  {
    id: "ironman",
    name: "Iron Man",
    title: "Futuristic HUD Operator",
    description:
      "A glowing command deck with premium metal tones, technical overlays, and HUD readouts.",
    asset: "/assets/ironmen-3D.jpg",
    palette: ["#f59e0b", "#ef4444", "#f97316"],
    ambientClass: "theme-ironman",
    voiceLabel: "Witty / tech-forward"
  }
];

export const heroThemeMap = Object.fromEntries(
  heroThemes.map((theme) => [theme.id, theme])
) as Record<HeroTheme, HeroThemeDefinition>;
