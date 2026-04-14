export type HeroTheme = "spiderman" | "batman" | "superman" | "ironman";
export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "java"
  | "c"
  | "cpp"
  | "bash"
  | "html"
  | "css"
  | "json"
  | "rust"
  | "ruby"
  | "php"
  | "swift";

export type ChatRole = "user" | "assistant" | "system" | "action";

/** Describes an in-chat action indicator (file read, write, search...) */
export interface ActionIndicator {
  type: "search_files" | "read_file" | "write_file" | "create_file" | "delete_file" | "create_folder" | "modify_file" | "thinking";
  label: string;
  fileName?: string;
  status: "running" | "done" | "error";
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** Optional action indicators shown inline before assistant response */
  actions?: ActionIndicator[];
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
