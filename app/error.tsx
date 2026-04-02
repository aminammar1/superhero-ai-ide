"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="panel-surface max-w-xl space-y-4 p-8 text-center">
        <p className="font-display text-sm uppercase tracking-[0.32em] text-primary">
          System Fault
        </p>
        <h1 className="font-display text-3xl font-semibold">
          The hero control room hit an unexpected error.
        </h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => reset()}
        >
          Reload workspace
        </button>
      </div>
    </main>
  );
}
