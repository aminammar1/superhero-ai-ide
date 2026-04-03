"use client";

import { AppShell } from "@/components/layout/app-shell";
import { FaceLogin } from "@/features/auth/face-login";
import { OnboardingFlow } from "@/features/auth/onboarding";
import { useAppStore } from "@/store/app-store";

export default function HomePage() {
  const sessionStatus = useAppStore((s) => s.sessionStatus);
  const profile = useAppStore((s) => s.profile);

  if (sessionStatus !== "authenticated") {
    return <FaceLogin />;
  }

  if (!profile?.onboarded) {
    return <OnboardingFlow />;
  }

  return <AppShell />;
}
