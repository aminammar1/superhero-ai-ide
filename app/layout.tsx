import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Rajdhani, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/app/providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body"
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "SuperHero AI IDE",
  description: "A futuristic multi-hero AI workspace with voice, code generation, and sandbox execution."
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-hero-theme="spiderman">
      <body
        className={`${spaceGrotesk.variable} ${rajdhani.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
