export interface ModelOption {
  id: string;
  label: string;
  provider: "openrouter" | "nvidia";
  description?: string;
  tag?: string;
  /** Extra keywords for in-chat search */
  searchTags?: string[];
}

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
    description: "Z.ai general-purpose model",
    tag: "chat",
    searchTags: ["glm", "zai", "general"],
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
   ────────────────────────────────────────────────────────────── */
export const NVIDIA_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "nvidia/tiiuae/falcon3-7b-instruct",
    label: "Falcon3 7B",
    provider: "nvidia",
    description: "Fast lightweight instruct model",
    tag: "chat",
    searchTags: ["falcon", "fast", "instruct"],
  },
  {
    id: "nvidia/meta/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B (NIM)",
    provider: "nvidia",
    description: "Meta Llama via NVIDIA NIM",
    tag: "chat",
    searchTags: ["llama", "nim", "meta"],
  },
  {
    id: "nvidia/mistralai/mistral-7b-instruct-v0.3",
    label: "Mistral 7B v0.3 (NIM)",
    provider: "nvidia",
    description: "Mistral instruct via NIM",
    tag: "chat",
    searchTags: ["mistral", "nim", "instruct"],
  },
];

/* ──────────────────────────────────────────────────────────────────
   Combined lists — used by the model selector
   ────────────────────────────────────────────────────────────── */
export const CHAT_MODEL_OPTIONS: ModelOption[] = [
  ...OPENROUTER_FREE_MODEL_OPTIONS,
  ...NVIDIA_MODEL_OPTIONS,
];

export const CODE_MODEL_OPTIONS: ModelOption[] = [
  ...NVIDIA_MODEL_OPTIONS,
  ...OPENROUTER_FREE_MODEL_OPTIONS,
];

export const DEFAULT_CHAT_MODEL = "google/gemma-4-31b-it:free";
export const DEFAULT_CODE_MODEL = NVIDIA_MODEL_OPTIONS[0].id;
