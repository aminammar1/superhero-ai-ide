"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#030308]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400/80" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-white/80">
            System Error
          </h2>
          <p className="mt-2 max-w-sm text-sm text-white/30">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.06]"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
