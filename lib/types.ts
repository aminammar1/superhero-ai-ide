export type HeroTheme = "spiderman" | "batman" | "superman" | "ironman";
export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "java"
  | "c"
  | "cpp"
  | "bash";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  heroTheme: HeroTheme;
  avatar: HeroTheme;
  onboarded: boolean;
}

export interface FaceAuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
  confidence: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  language: Language;
  duration_ms: number;
}

export interface CodeGenerationResult {
  code: string;
  language: Language;
  explanation?: string;
}
