import type {
  CodeGenerationResult,
  ExecutionResult,
  FaceAuthResponse,
  HeroTheme,
  Language,
  UserProfile,
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
  model?: string;
}) {
  const response = await http.post<CodeGenerationResult>("/api/code/generate", payload);
  return response.data;
}

export async function requestTextToSpeech(payload: {
  text: string;
  heroTheme: HeroTheme;
}) {
  const token = useAppStore.getState().token;
  const response = await fetch(`${baseURL}/api/voice/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `TTS failed with status ${response.status}`);
  }

  return await response.blob();
}

export async function streamChat(
  payload: {
    prompt: string;
    heroTheme: HeroTheme;
    model?: string;
    history: Array<{ role: string; content: string }>;
  },
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
) {
  const token = useAppStore.getState().token;
  const response = await fetch(`${baseURL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("The AI service did not return a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      reader.cancel();
      return; // Graceful abort — not an error
    }
    throw err;
  }
}

/* ═══════════════════════════════════════════════
   WORKSPACE FILESYSTEM API
   ═══════════════════════════════════════════════ */

/**
 * Write a file to the backend workspace.
 * Called after the agent creates/modifies files so the terminal can see them.
 */
export async function writeWorkspaceFile(path: string, content: string) {
  try {
    await http.post("/api/workspace/write", { path, content });
  } catch {
    // Silent fail — workspace sync is best-effort
  }
}

/**
 * Run a shell command in the workspace directory.
 * Returns { stdout, stderr, exit_code, duration_ms }
 */
export async function shellCommand(command: string): Promise<{
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
}> {
  const response = await http.post<{
    stdout: string;
    stderr: string;
    exit_code: number;
    duration_ms: number;
  }>("/api/workspace/shell", { command }, { timeout: 150_000 });
  return response.data;
}

/**
 * Delete a file/folder from the backend workspace.
 */
export async function deleteWorkspaceFile(path: string) {
  try {
    await http.delete("/api/workspace/delete", { params: { path } });
  } catch {
    // Silent fail
  }
}
