export interface ModelOption {
  id: string;
  label: string;
  provider: "agentrouter" | "openrouter" | "nvidia";
  description?: string;
  tag?: string;
  /** Extra keywords for in-chat search */
  searchTags?: string[];
}

/* ──────────────────────────────────────────────────────────────────
   AgentRouter — Premium models via unified OpenAI-compatible gateway
   ($100 credit balance available)
   ────────────────────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────────────────────────
   OpenRouter Free Models — diversified across providers to
   reduce 429 rate-limit hits (20 RPM / ~200 RPD per model).
   ────────────────────────────────────────────────────────────── */
export const OPENROUTER_FREE_MODEL_OPTIONS: ModelOption[] = [
  // ── Fastest (prioritized as fallbacks) ──
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    provider: "openrouter",
    description: "Fast dense multimodal, 262K context",
    tag: "code",
    searchTags: ["google", "gemma", "fast", "multimodal", "function"],
  },
  {
    id: "minimax/minimax-m2.5:free",
    label: "MiniMax M2.5",
    provider: "openrouter",
    description: "Very fast general-purpose",
    tag: "chat",
    searchTags: ["minimax", "fast", "general"],
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B",
    provider: "openrouter",
    description: "Lightweight & fast OpenAI",
    tag: "chat",
    searchTags: ["openai", "gpt", "light", "fast"],
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B",
    provider: "openrouter",
    description: "Meta's flagship instruct model",
    tag: "chat",
    searchTags: ["meta", "llama", "instruct"],
  },
  {
    id: "openai/gpt-oss-120b:free",
    label: "GPT-OSS 120B",
    provider: "openrouter",
    description: "OpenAI's open 120B model",
    tag: "code",
    searchTags: ["openai", "gpt", "oss"],
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    label: "Nemotron 3 Nano 30B",
    provider: "openrouter",
    description: "Efficient NVIDIA agentic model",
    tag: "code",
    searchTags: ["nvidia", "nemotron", "nano", "agentic"],
  },

  // ── Coding-first (slower but powerful) ──
  {
    id: "zai-org/glm-5:free",
    label: "GLM-5 744B",
    provider: "openrouter",
    description: "Zhipu AI 744B MoE — agentic coding flagship",
    tag: "code",
    searchTags: ["glm", "zhipu", "glm5", "moe", "agentic", "coding"],
  },
  {
    id: "qwen/qwen3-coder:free",
    label: "Qwen3 Coder 480B",
    provider: "openrouter",
    description: "480B MoE — powerful but slow",
    tag: "code",
    searchTags: ["qwen", "coder", "moe", "agentic"],
  },

  // ── Reasoning ──
  {
    id: "deepseek/deepseek-r1:free",
    label: "DeepSeek R1",
    provider: "openrouter",
    description: "Frontier-level reasoning & logic",
    tag: "reason",
    searchTags: ["deepseek", "reasoning", "logic", "math"],
  },

  // ── Other Google models ──
  {
    id: "google/gemma-4-26b-a4b:free",
    label: "Gemma 4 26B MoE",
    provider: "openrouter",
    description: "Efficient MoE instruction-tuned",
    tag: "chat",
    searchTags: ["google", "gemma", "moe"],
  },
  {
    id: "google/gemma-3-27b-it:free",
    label: "Gemma 3 27B",
    provider: "openrouter",
    description: "Multimodal with multilingual support",
    tag: "chat",
    searchTags: ["google", "gemma", "multilingual"],
  },

  // ── Other NVIDIA on OpenRouter ──
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    label: "Nemotron Nano 9B v2",
    provider: "openrouter",
    description: "Ultra-fast reasoning",
    tag: "reason",
    searchTags: ["nvidia", "nemotron", "fast", "reasoning"],
  },
  {
    id: "nvidia/nemotron-nano-12b-2-vl:free",
    label: "Nemotron Nano 12B VL",
    provider: "openrouter",
    description: "Multimodal vision + language",
    tag: "chat",
    searchTags: ["nvidia", "nemotron", "vision", "multimodal"],
  },

  // ── Others ──
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    label: "Qwen3 Next 80B",
    provider: "openrouter",
    description: "Fast instruct model — RAG & agents",
    tag: "chat",
    searchTags: ["qwen", "instruct", "rag"],
  },
  {
    id: "z-ai/glm-4.5-air:free",
    label: "GLM 4.5 Air",
    provider: "openrouter",
    description: "Zhipu general-purpose model",
    tag: "chat",
    searchTags: ["glm", "zai", "zhipu", "general"],
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    label: "Llama 3.2 3B",
    provider: "openrouter",
    description: "Ultra-lightweight instruct",
    tag: "chat",
    searchTags: ["meta", "llama", "tiny", "fast"],
  },
];

/* ──────────────────────────────────────────────────────────────────
   NVIDIA NIM API — direct access via integrate.api.nvidia.com
   (updated: removed EOL'd models like falcon3)
   ────────────────────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────────────────────────
   Combined lists — used by the model selector
   AgentRouter premium models first → OpenRouter free → NVIDIA NIM
   ────────────────────────────────────────────────────────────── */
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

export const DEFAULT_CHAT_MODEL = "gpt-5";
export const DEFAULT_CODE_MODEL = "gpt-5";
