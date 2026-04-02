"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Fingerprint, GitPullRequest, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loginWithFace } from "@/services/api";
import { useAppStore } from "@/store/app-store";

const transparentPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgL4d7QAAAABJRU5ErkJggg==";

export function FaceLogin() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const setSessionLoading = useAppStore((state) => state.setSessionLoading);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);

  const captureFrame = useMemo(
    () => () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !cameraReady) {
        return transparentPixel;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const context = canvas.getContext("2d");
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.9);
    },
    [cameraReady]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;

    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 960, height: 540 },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        toast.error("Camera access is unavailable. Demo face auth fallback will be used.");
      }
    };

    void enableCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleFaceLogin = async () => {
    setLoading(true);
    setSessionLoading();
    try {
      const imageBase64 = captureFrame();
      const response = await loginWithFace(imageBase64);
      setAuthenticated(response.access_token, response.user);
      toast.success(`Welcome back, ${response.user.username || "Hero"}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Face ID authentication failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hero-pattern min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-surface flex flex-col justify-between p-8 sm:p-10"
        >
          <div className="space-y-6">
            <Badge variant="accent">SuperHero AI IDE</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
                An AI command deck where every workflow has a hero persona.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Secure the workspace with Face ID, switch between iconic hero modes,
                and build software with code, voice, and sandbox execution in one place.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["AI routing", "Falcon code generation with Qwen chat fallback"],
              ["Voice pipeline", "Speech input plus ElevenLabs hero voices"],
              ["Sandboxed runs", "Docker-backed execution for seven languages"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="metric-label">{label}</p>
                <p className="mt-2 text-sm text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="hero-pattern h-full">
            <CardHeader>
              <Badge>Face ID Access</Badge>
              <CardTitle className="mt-4 text-3xl">Authenticate to the hero bay</CardTitle>
              <CardDescription>
                Scan your face to unlock the IDE. Social buttons are included as UI fallbacks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full object-cover opacity-90"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-primary/40" />
                <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-primary/60" />
                <div className="pointer-events-none absolute inset-y-10 left-1/2 w-px -translate-x-1/2 bg-accent/50" />
                <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {cameraReady ? "Camera ready" : "Demo mode"}
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleFaceLogin} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                Authenticate with Face ID
              </Button>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" className="w-full">
                  <Camera className="h-4 w-4" />
                  Login with Google
                </Button>
                <Button variant="secondary" className="w-full">
                  <GitPullRequest className="h-4 w-4" />
                  Login with GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}
