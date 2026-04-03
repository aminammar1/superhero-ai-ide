"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#030308]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-0 animate-pulse rounded-full border border-primary/40" />
          <div className="absolute inset-2 rounded-full bg-primary/60" />
        </div>
        <p className="font-mono text-[11px] tracking-[0.3em] text-white/25">
          LOADING SYSTEMS
        </p>
      </motion.div>
    </div>
  );
}
