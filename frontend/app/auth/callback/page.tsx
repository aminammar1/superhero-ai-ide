"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { loginWithGitHub, loginWithGoogle } from "@/services/api";
import { useAppStore } from "@/store/app-store";

type CallbackState = "loading" | "success" | "error";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const setSessionLoading = useAppStore((s) => s.setSessionLoading);

  useEffect(() => {
    const code = searchParams.get("code");
    const provider = searchParams.get("state"); // We use state param to identify provider
    const error = searchParams.get("error");

    if (error) {
      setErrorMsg(error);
      setState("error");
      return;
    }

    if (!code) {
      setErrorMsg("No authorization code received.");
      setState("error");
      return;
    }

    const handleCallback = async () => {
      setSessionLoading();

      try {
        let response;
        const redirectUri = `${window.location.origin}/auth/callback`;

        if (provider === "google") {
          response = await loginWithGoogle(code, redirectUri);
        } else {
          // Default to GitHub
          response = await loginWithGitHub(code);
        }

        // Check for error in response
        if ((response as unknown as { error?: string }).error) {
          throw new Error((response as unknown as { error: string }).error);
        }

        setState("success");
        setAuthenticated(response.access_token, response.user);

        // Redirect to home after brief success animation
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
        setState("error");
      }
    };

    void handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-[#030308]">
      {/* Background ambience */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 backdrop-blur-sm"
      >
        {state === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            <p className="text-sm tracking-[0.15em] text-white/40">
              AUTHENTICATING...
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <ShieldCheck className="h-10 w-10 text-emerald-400/80" />
            </motion.div>
            <p className="text-sm tracking-[0.15em] text-emerald-400/80">
              IDENTITY VERIFIED
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <AlertCircle className="h-10 w-10 text-red-400/80" />
            <p className="text-sm tracking-[0.15em] text-red-400/80">
              AUTHENTICATION FAILED
            </p>
            <p className="max-w-xs text-center text-xs text-white/30">
              {errorMsg}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="mt-4 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-2 text-xs text-white/50 transition hover:border-white/15 hover:bg-white/[0.06]"
            >
              Return to login
            </button>
          </>
        )}
      </motion.div>
    </main>
  );
}
