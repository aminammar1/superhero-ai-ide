"use client";

import type { HeroTheme } from "@/lib/types";

export function HeroMotif({ theme, className }: { theme: HeroTheme; className?: string }) {
  const base = `pointer-events-none absolute opacity-[0.04] ${className || ""}`;

  switch (theme) {
    case "spiderman":
      return (
        <svg className={base} viewBox="0 0 200 200" fill="none">
          {/* Web pattern */}
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="18" stroke="currentColor" strokeWidth="0.4" />
          {[0, 30, 60, 90, 120, 150].map((angle) => (
            <line
              key={angle}
              x1="100"
              y1="100"
              x2={100 + 90 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 90 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="0.5"
            />
          ))}
          {[0, 30, 60, 90, 120, 150].map((angle) => (
            <line
              key={`r-${angle}`}
              x1="100"
              y1="100"
              x2={100 + 90 * Math.cos(((angle + 180) * Math.PI) / 180)}
              y2={100 + 90 * Math.sin(((angle + 180) * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      );

    case "batman":
      return (
        <svg className={base} viewBox="0 0 200 120" fill="currentColor">
          {/* Bat silhouette */}
          <path d="M100 20 C100 20 85 40 60 50 C40 57 15 50 10 60 C20 65 35 80 50 75 C60 72 70 60 80 55 C85 52 90 58 95 65 C97 70 99 80 100 85 C101 80 103 70 105 65 C110 58 115 52 120 55 C130 60 140 72 150 75 C165 80 180 65 190 60 C185 50 160 57 140 50 C115 40 100 20 100 20Z" />
        </svg>
      );

    case "superman":
      return (
        <svg className={base} viewBox="0 0 200 200" fill="none">
          {/* S-shield diamond */}
          <path
            d="M100 15 L175 100 L100 185 L25 100 Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M100 35 L160 100 L100 165 L40 100 Z"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* S letter */}
          <path
            d="M80 75 C80 65 120 60 120 80 C120 95 80 90 80 110 C80 130 120 125 120 115"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case "ironman":
      return (
        <svg className={base} viewBox="0 0 200 200" fill="none">
          {/* Arc reactor */}
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="35" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="15" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.3" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <line
              key={angle}
              x1={100 + 35 * Math.cos((angle * Math.PI) / 180)}
              y1={100 + 35 * Math.sin((angle * Math.PI) / 180)}
              x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="2"
            />
          ))}
          {[30, 90, 150, 210, 270, 330].map((angle) => (
            <line
              key={`o-${angle}`}
              x1={100 + 60 * Math.cos((angle * Math.PI) / 180)}
              y1={100 + 60 * Math.sin((angle * Math.PI) / 180)}
              x2={100 + 80 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 80 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </svg>
      );

    default:
      return null;
  }
}
