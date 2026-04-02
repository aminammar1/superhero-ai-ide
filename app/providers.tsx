"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/app-store";

export function Providers({ children }: { children: ReactNode }) {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.heroTheme = theme;
  }, [theme]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border border-white/10 bg-slate-950/90 text-slate-50 backdrop-blur-xl"
        }}
      />
    </>
  );
}
