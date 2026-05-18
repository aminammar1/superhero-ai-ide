export interface ModelOption {
  id: string;
  label: string;
  provider: "agentrouter" | "openrouter" | "nvidia";
  description?: string;
  tag?: string;
  searchTags?: string[];
}

export const AGENTROUTER_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "agentrouter",
    description: "OpenAI's flagship model via AgentRouter",
    tag: "premium",
    searchTags: ["openai", "gpt", "gpt5", "best", "premium"],
  },
  {
    id: "claude-sonnet-4-20250514",
    label: "Claude 4 Sonnet",
    provider: "agentrouter",
    description: "Anthropic's latest Sonnet via AgentRouter",
    tag: "premium",
    searchTags: ["anthropic", "claude", "sonnet", "premium"],
  },
];

export const OPENROUTER_FREE_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super",
    provider: "openrouter",
    description: "Best default: strong agentic coding, 262K context",
    tag: "code",
    searchTags: ["nvidia", "nemotron", "super", "moe", "coding", "default", "agentic"],
  },
  {
    id: "openrouter/free",
    label: "OpenRouter Free Router",
    provider: "openrouter",
    description: "Auto-selects an available free model",
    tag: "chat",
    searchTags: ["openrouter", "free", "router", "auto", "fallback"],
  },
  {
    id: "inclusionai/ring-2.6-1t:free",
    label: "Ring 2.6 1T",
    provider: "openrouter",
    description: "Large thinking model for tool-heavy workflows",
    tag: "reason",
    searchTags: ["ring", "inclusionai", "reasoning", "agentic", "tools"],
  },
  {
    id: "poolside/laguna-m-1:free",
    label: "Laguna M.1",
    provider: "openrouter",
    description: "Coding-agent model with tool and reasoning support",
    tag: "code",
    searchTags: ["poolside", "laguna", "coding", "agent", "tools"],
  },
  {
    id: "baidu/cobuddy:free",
    label: "CoBuddy",
    provider: "openrouter",
    description: "Fast code generation and agent workflows",
    tag: "code",
    searchTags: ["baidu", "cobuddy", "code", "fast", "agent"],
  },
  {
    id: "minimax/minimax-m2.5:free",
    label: "MiniMax M2.5",
    provider: "openrouter",
    description: "Fast productivity and coding assistant",
    tag: "code",
    searchTags: ["minimax", "fast", "general", "coding"],
  },
  {
    id: "openai/gpt-oss-120b:free",
    label: "GPT-OSS 120B",
    provider: "openrouter",
    description: "OpenAI's open 120B model",
    tag: "code",
    searchTags: ["openai", "gpt", "oss", "large"],
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    label: "Nemotron 3 Nano",
    provider: "openrouter",
    description: "Fast NVIDIA agentic model",
    tag: "code",
    searchTags: ["nvidia", "nemotron", "nano", "agentic", "fast"],
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    provider: "openrouter",
    description: "Fast multimodal model, 262K context",
    tag: "code",
    searchTags: ["google", "gemma", "fast", "multimodal"],
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B",
    provider: "openrouter",
    description: "Lightweight and fast OpenAI open model",
    tag: "chat",
    searchTags: ["openai", "gpt", "light", "fast"],
  },
  {
    id: "deepseek/deepseek-r1:free",
    label: "DeepSeek R1",
    provider: "openrouter",
    description: "Reasoning fallback for logic-heavy tasks",
    tag: "reason",
    searchTags: ["deepseek", "reasoning", "logic", "math"],
  },
];

export const NVIDIA_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "meta/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B (NIM)",
    provider: "nvidia",
    description: "Meta's powerful 70B via NVIDIA NIM",
    tag: "code",
    searchTags: ["llama", "nim", "meta", "powerful"],
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B (NIM)",
    provider: "nvidia",
    description: "Fast Meta Llama via NVIDIA NIM",
    tag: "chat",
    searchTags: ["llama", "nim", "meta", "fast"],
  },
  {
    id: "nvidia/llama-3.1-nemotron-nano-8b-v1",
    label: "Nemotron Nano 8B (NIM)",
    provider: "nvidia",
    description: "NVIDIA's efficient reasoning model",
    tag: "reason",
    searchTags: ["nvidia", "nemotron", "nano", "nim"],
  },
  {
    id: "nvidia/nemotron-mini-4b-instruct",
    label: "Nemotron Mini 4B (NIM)",
    provider: "nvidia",
    description: "Ultra-fast lightweight model",
    tag: "chat",
    searchTags: ["nvidia", "nemotron", "mini", "fast"],
  },
];

export const CHAT_MODEL_OPTIONS: ModelOption[] = [
  ...AGENTROUTER_MODEL_OPTIONS,
  ...OPENROUTER_FREE_MODEL_OPTIONS,
  ...NVIDIA_MODEL_OPTIONS,
];

export const CODE_MODEL_OPTIONS: ModelOption[] = [
  ...AGENTROUTER_MODEL_OPTIONS,
  ...NVIDIA_MODEL_OPTIONS,
  ...OPENROUTER_FREE_MODEL_OPTIONS,
];

export const DEFAULT_CHAT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
export const DEFAULT_CODE_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
