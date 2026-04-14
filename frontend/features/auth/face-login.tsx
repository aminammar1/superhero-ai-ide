"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fingerprint, GitBranch, Loader2, Shield, Zap, Code2, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { loginWithFace } from "@/services/api";
import { useAppStore } from "@/store/app-store";

import { cn } from "@/lib/utils";

type ScanPhase = "idle" | "scanning" | "detected" | "verified" | "failed";

const PHASE_LABEL: Record<ScanPhase, string> = {
  idle: "READY FOR BIOMETRIC SCAN",
  scanning: "SCANNING BIOMETRIC DATA",
  detected: "FACE DETECTED - VERIFYING",
  verified: "IDENTITY VERIFIED",
  failed: "SCAN FAILED - TRY AGAIN",
};

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ────────────────────────────────────────────
   Particle effects
   ──────────────────────────────────────────── */
function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/[0.04]"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ bottom: -20, opacity: 0 }}
      animate={{
        bottom: ["0%", "100%"],
        opacity: [0, 0.6, 0],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{
        duration: 8 + Math.random() * 6,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}



/* ────────────────────────────────────────────
   Animated glitch text
   ──────────────────────────────────────────── */
function GlitchText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute inset-0 text-red-500/30"
        animate={{
          x: [-2, 2, -1, 0],
          opacity: [0, 0.5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-blue-500/30"
        animate={{
          x: [2, -2, 1, 0],
          opacity: [0, 0.5, 0],
        }}
        transition={{ duration: 3, delay: 0.1, repeat: Infinity, repeatDelay: 5 }}
      >
        {text}
      </motion.span>
    </div>
  );
}

/* ────────────────────────────────────────────
   Feature pill
   ──────────────────────────────────────────── */
function FeaturePill({
  icon: Icon,
  label,
  delay,
}: {
  icon: typeof Code2;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 backdrop-blur-sm"
    >
      <Icon className="h-3 w-3 text-primary/50" />
      <span className="text-[10px] text-white/30">{label}</span>
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   Main Login Component
   ──────────────────────────────────────────── */
export function FaceLogin() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [faceDetected, setFaceDetected] = useState(false);
  const detectorRef = useRef<unknown>(null);
  const animFrameRef = useRef<number>(0);
  const setSessionLoading = useAppStore((s) => s.setSessionLoading);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);

  const captureFrame = useMemo(
    () => () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !cameraReady) {
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgL4d7QAAAABJRU5ErkJggg==";
      }
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.9);
    },
    [cameraReady]
  );

  // Initialize face detector if browser supports it
  useEffect(() => {
    const initDetector = async () => {
      try {
        // @ts-expect-error FaceDetector is experimental browser API
        if (typeof window !== "undefined" && window.FaceDetector) {
          // @ts-expect-error FaceDetector is experimental browser API
          detectorRef.current = new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
        }
      } catch {
        // Face detection not supported
      }
    };
    void initDetector();
  }, []);

  // Draw face detection overlay
  const drawOverlay = useCallback(
    (faces: FaceBox[]) => {
      const overlay = overlayRef.current;
      const video = videoRef.current;
      if (!overlay || !video) return;

      const ctx = overlay.getContext("2d");
      if (!ctx) return;

      overlay.width = 256;
      overlay.height = 256;
      ctx.clearRect(0, 0, 256, 256);

      if (faces.length === 0) {
        setFaceDetected(false);
        return;
      }

      setFaceDetected(true);
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      for (const face of faces) {
        const scaleX = 256 / vw;
        const scaleY = 256 / vh;
        const x = face.x * scaleX;
        const y = face.y * scaleY;
        const w = face.width * scaleX;
        const h = face.height * scaleY;

        ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        const cornerSize = 10;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerSize, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerSize);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerSize);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerSize, y + h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerSize, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerSize);
        ctx.stroke();
      }
    },
    []
  );

  // Continuous face detection loop
  useEffect(() => {
    if (!cameraReady || !detectorRef.current) return;

    const detect = async () => {
      const video = videoRef.current;
      const detector = detectorRef.current as { detect: (v: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRect }>> } | null;
      if (!video || !detector) return;

      try {
        const faces = await detector.detect(video);
        const boxes: FaceBox[] = faces.map(
          (f: { boundingBox: DOMRect }) => ({
            x: f.boundingBox.x,
            y: f.boundingBox.y,
            width: f.boundingBox.width,
            height: f.boundingBox.height,
          })
        );
        drawOverlay(boxes);
      } catch {
        // Detection frame dropped
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraReady, drawOverlay]);

  // Camera setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    const enable = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        toast.error("Camera unavailable. Demo mode active.");
      }
    };
    void enable();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleScan = async () => {
    if (!cameraReady) {
      toast.error("Camera is not available. Please allow camera access.");
      return;
    }
    setLoading(true);
    setPhase("scanning");
    setSessionLoading();
    await delay(1200);
    setPhase("detected");
    await delay(800);

    try {
      const image = captureFrame();
      // Prevent the 1x1 transparent pixel bypass
      if (image.length < 200) {
        throw new Error("Could not capture a valid frame. Check your camera.");
      }
      const response = await loginWithFace(image);
      setPhase("verified");
      await delay(700);
      setAuthenticated(response.access_token, response.user);
      toast.success(
        `Identity verified. Welcome, ${response.user.username || "Hero"}.`
      );
    } catch (error) {
      setPhase("failed");
      toast.error(
        error instanceof Error ? error.message : "Authentication failed."
      );
      setTimeout(() => setPhase("idle"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const ringActive = phase === "scanning" || phase === "detected";

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#030308]">
      {/* JARVIS HUD ambient gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 30% 20%, rgba(245,158,11,0.04), transparent 50%)",
            "radial-gradient(circle at 70% 80%, rgba(59,130,246,0.04), transparent 50%)",
            "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.03), transparent 50%)",
            "radial-gradient(circle at 30% 20%, rgba(245,158,11,0.04), transparent 50%)",
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* JARVIS hex grid */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="auth-hex" width="40" height="34.6" patternUnits="userSpaceOnUse">
            <polygon points="20,0 40,11.5 40,23.1 20,34.6 0,23.1 0,11.5" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-hex)" />
      </svg>

      {/* Circuit trace lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" viewBox="0 0 1200 800" fill="none">
        <motion.path
          d="M0 400 L200 400 L240 350 L400 350 L440 400 L600 400 L640 350 L800 350 L840 400 L1200 400"
          stroke="#f59e0b" strokeWidth="0.8"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.path
          d="M0 200 L150 200 L180 170 L350 170 L380 200 L550 200 L580 170 L750 170 L1200 170"
          stroke="#3b82f6" strokeWidth="0.6"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 0.5, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.path
          d="M0 600 L300 600 L330 630 L500 630 L530 600 L900 600 L930 570 L1200 570"
          stroke="#ef4444" strokeWidth="0.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 5, delay: 1, repeat: Infinity, repeatType: "loop" }}
        />
      </svg>

      {/* Scan sweep line */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 h-[1px] z-10"
        style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fine grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.5}
          x={Math.random() * 100}
          size={2 + Math.random() * 4}
        />
      ))}

      {/* Corner decorations */}
      <div className="pointer-events-none absolute top-6 left-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-[2px] bg-gradient-to-b from-primary/30 to-transparent" />
          <div className="flex flex-col gap-0.5">
            <div className="h-[2px] w-8 bg-gradient-to-r from-primary/30 to-transparent" />
            <span className="text-[8px] tracking-[0.3em] text-white/15 font-mono">v0.1.0</span>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute top-6 right-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-[8px] tracking-[0.3em] text-white/15 font-mono">SECURE</span>
          <div className="h-[2px] w-8 bg-gradient-to-l from-emerald-500/30 to-transparent" />
        </motion.div>
      </div>

      {/* Title section */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-4 flex items-center justify-center gap-3"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
          <Shield className="h-5 w-5 text-primary/40" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
        </motion.div>

        <GlitchText
          text="SUPERHERO AI IDE"
          className="font-display text-2xl font-bold tracking-[0.4em] text-white/80"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 text-xs tracking-[0.15em] text-white/20"
        >
          Your AI-Powered Development Command Center
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      </motion.div>

      {/* Feature pills */}
      <motion.div
        className="mb-8 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <FeaturePill icon={Code2} label="AI Code Agent" delay={0.7} />
        <FeaturePill icon={Cpu} label="Voice Control" delay={0.85} />
        <FeaturePill icon={Zap} label="Multi-Hero Themes" delay={1.0} />
      </motion.div>

      {/* Scan viewport */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="relative flex items-center justify-center"
      >
        {/* Outermost rotating ring */}
        <motion.div
          className="absolute h-[340px] w-[340px] rounded-full border border-dashed"
          style={{ borderColor: "rgba(245,158,11,0.06)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Outer ring */}
        <motion.div
          className={cn(
            "absolute h-[312px] w-[312px] rounded-full border transition-all duration-700",
            ringActive
              ? "border-dashed border-amber-400/20"
              : "border-white/[0.04] border-dashed"
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle ring */}
        <div
          className={cn(
            "absolute h-[286px] w-[286px] rounded-full border transition-all duration-500",
            ringActive
              ? "border-primary/30 animate-glow-breathe"
              : faceDetected
                ? "border-emerald-500/30"
                : "border-white/[0.05]"
          )}
          style={
            faceDetected && !ringActive
              ? { animation: "face-scan-glow 2s ease-in-out infinite" }
              : undefined
          }
        />

        {/* Inner HUD ring with tick marks */}
        <motion.div
          className="absolute h-[270px] w-[270px] rounded-full"
          style={{ border: "1px solid rgba(245,158,11,0.05)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div key={deg} className="absolute top-0 left-1/2 h-2 w-[1px] -translate-x-1/2" style={{ transform: `rotate(${deg}deg) translateY(-135px)`, background: "rgba(245,158,11,0.12)" }} />
          ))}
        </motion.div>

        {/* Camera viewport */}
        <div className="relative h-[256px] w-[256px] overflow-hidden rounded-full border-2 border-white/[0.08] bg-black/60">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full scale-[1.15] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Face detection overlay */}
          <canvas
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />

          {/* Scan line */}
          {ringActive && (
            <motion.div
              animate={{ y: [-128, 128, -128] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
              style={{ top: "50%" }}
            />
          )}

          {/* Crosshairs */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-px bg-white/[0.07]" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-px w-12 bg-white/[0.07]" />
          </div>

          {/* Corner ticks */}
          <CornerTick position="top-left" />
          <CornerTick position="top-right" />
          <CornerTick position="bottom-left" />
          <CornerTick position="bottom-right" />

          {/* Verified overlay */}
          <AnimatePresence>
            {phase === "verified" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-emerald-500/15 backdrop-blur-[2px]"
              >
                <Fingerprint className="h-14 w-14 text-emerald-400/80" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Face detected indicator */}
          {faceDetected && !ringActive && phase === "idle" && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/20 px-3 py-0.5 text-[9px] tracking-[0.2em] text-emerald-400/80 backdrop-blur">
              FACE DETECTED
            </div>
          )}

          {/* Camera status */}
          {!faceDetected && !ringActive && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-0.5 text-[9px] tracking-[0.2em] text-white/30 backdrop-blur">
              {cameraReady ? "CAMERA ACTIVE" : "DEMO MODE"}
            </div>
          )}
        </div>
      </motion.div>

      {/* Phase status */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className={cn(
            "mt-10 font-mono text-[11px] tracking-[0.25em]",
            phase === "verified" && "text-emerald-400/80",
            phase === "failed" && "text-red-400/80",
            (phase === "scanning" || phase === "detected") &&
              "text-blue-400/70",
            phase === "idle" && (faceDetected ? "text-emerald-400/60" : "text-white/25")
          )}
        >
          {phase === "idle" && faceDetected ? "FACE RECOGNIZED - READY TO AUTHENTICATE" : PHASE_LABEL[phase]}
        </motion.p>
      </AnimatePresence>

      {/* Authenticate button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        type="button"
        onClick={() => void handleScan()}
        disabled={loading || !cameraReady}
        className={cn(
          "mt-8 flex items-center gap-2.5 rounded-full border px-8 py-3 text-sm font-medium backdrop-blur transition disabled:opacity-30",
          faceDetected
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400/90 hover:bg-emerald-500/15"
            : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-primary/25 hover:bg-white/[0.06]"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        Authenticate with Face ID
      </motion.button>

      {/* Social login - styled better with more spacing */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-[11px] font-medium text-white/40 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white/60 backdrop-blur-sm"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-[11px] font-medium text-white/40 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white/60 backdrop-blur-sm"
        >
          <GitBranch className="h-3.5 w-3.5" />
          Sign in with GitHub
        </button>
      </div>

      {/* Footer - well separated */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 flex items-center gap-2"
      >
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-[8px] tracking-[0.3em] text-white/15">SUPERHERO AI IDE</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
      </motion.div>
    </main>
  );
}

function CornerTick({ position }: { position: string }) {
  const base = "absolute h-4 w-4 pointer-events-none";
  const styles: Record<string, string> = {
    "top-left": `${base} top-8 left-8 border-t border-l border-white/15 rounded-tl-sm`,
    "top-right": `${base} top-8 right-8 border-t border-r border-white/15 rounded-tr-sm`,
    "bottom-left": `${base} bottom-8 left-8 border-b border-l border-white/15 rounded-bl-sm`,
    "bottom-right": `${base} bottom-8 right-8 border-b border-r border-white/15 rounded-br-sm`,
  };
  return <div className={styles[position]} />;
}

function GoogleIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
