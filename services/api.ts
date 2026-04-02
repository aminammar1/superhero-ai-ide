import type {
  CodeGenerationResult,
  ExecutionResult,
  FaceAuthResponse,
  HeroTheme,
  Language,
  UserProfile
} from "@/lib/types";
import { baseURL, http } from "@/services/http";
import { useAppStore } from "@/store/app-store";

export async function loginWithFace(imageBase64: string) {
  const response = await http.post<FaceAuthResponse>("/api/auth/face-login", {
    image_base64: imageBase64
  });
  return response.data;
}

export async function saveOnboarding(payload: {
  username: string;
  heroTheme: HeroTheme;
  avatar: HeroTheme;
}) {
  const response = await http.post<UserProfile>("/api/profile/onboarding", payload);
  return response.data;
}

export async function runCode(payload: { language: Language; code: string }) {
  const response = await http.post<ExecutionResult>("/api/execute/run", payload);
  return response.data;
}

export async function generateCode(payload: {
  prompt: string;
  language: Language;
  heroTheme: HeroTheme;
}) {
  const response = await http.post<CodeGenerationResult>("/api/code/generate", payload);
  return response.data;
}

export async function requestTextToSpeech(payload: {
  text: string;
  heroTheme: HeroTheme;
}) {
  const response = await http.post("/api/voice/tts", payload, {
    responseType: "blob"
  });
  return response.data as Blob;
}

export async function streamChat(
  payload: {
    prompt: string;
    heroTheme: HeroTheme;
    history: Array<{ role: string; content: string }>;
  },
  onChunk: (chunk: string) => void
) {
  const token = useAppStore.getState().token;
  const response = await fetch(`${baseURL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok || !response.body) {
    throw new Error("The AI service did not return a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    onChunk(decoder.decode(value, { stream: true }));
  }
}
