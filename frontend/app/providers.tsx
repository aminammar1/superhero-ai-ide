"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/app-store";
import { HeroProcessingAnimation, HeroSuccessFlash } from "@/components/agent/hero-animation";
import { ApprovalModal } from "@/components/agent/approval-modal";

export function Providers({ children }: { children: ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.heroTheme = theme;
  }, [theme]);

  return (
    <>
      {children}
      <HeroProcessingAnimation />
      <HeroSuccessFlash />
      <ApprovalModal />
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border border-white/[0.06] bg-[#0c0c14]/95 text-white/80 backdrop-blur-xl text-sm",
        }}
      />
    </>
  );
}
