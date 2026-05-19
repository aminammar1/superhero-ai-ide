<p align="center">
  <img src="docs/logo.png" alt="SuperHero AI IDE" width="140" />
</p>

<h1 align="center">🦸 SuperHero AI IDE</h1>

<p align="center">
  <strong>An AI-powered cloud IDE with superhero-themed personas, real-time voice interaction, and sandboxed code execution — built for developers who want superpowers.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Docker-Sandbox-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Monaco-Editor-1E1E1E?style=flat-square&logo=visualstudiocode" alt="Monaco" />
  <img src="https://img.shields.io/badge/Zustand-State-764ABC?style=flat-square" alt="Zustand" />
  <img src="https://img.shields.io/badge/Framer%20Motion-Animations-FF0050?style=flat-square&logo=framer" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/ElevenLabs-TTS-5D3FD3?style=flat-square" alt="ElevenLabs" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## 🎬 What is SuperHero AI IDE?

SuperHero AI IDE is a **full-stack, browser-based development environment** where an AI agent — embodied as one of four superhero personas (Spider-Man, Batman, Superman, Iron Man) — helps you write, explain, debug, and execute code in real time.

Think of it as **VS Code meets JARVIS**: a Monaco code editor, an AI co-pilot with voice I/O, file management, a terminal, and Docker-sandboxed execution — all wrapped in a cinematic superhero UI with 3D avatars, Framer Motion animations, and theme-aware color systems.

### ✨ Key Highlights

- **🤖 AI Agent with Tool Calls** — The agent doesn't just chat; it creates files, modifies code, scaffolds entire projects, and explains your codebase via structured tool calls
- **🦸 4 Hero Personas** — Spider-Man, Batman, Superman, Iron Man — each with unique color palettes, voice tones, and 3D avatars
- **🎙️ Voice-to-Voice Mode** — Speak to the agent and hear it respond with ElevenLabs-powered hero-specific voices
- **📝 Monaco Editor** — Full VS Code-quality editing: syntax highlighting for 20+ languages, auto-formatting, bracket matching
- **🐳 Sandboxed Execution** — Run Python, JavaScript, TypeScript, Go, Java, C/C++, Rust, Ruby, and PHP safely in Docker containers
- **🧠 Code Explanation** — Ask the agent to explain any file (`@file.ts`) or the whole project — it reads your code and gives real AI-powered summaries
- **🔐 Multi-Auth** — Face ID (webcam biometric), GitHub OAuth, Google OAuth
- **🔄 Smart Model Routing** — 20+ AI models across 3 providers (AgentRouter, OpenRouter, NVIDIA NIM) with automatic fallback

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                Frontend (Next.js 16)                 │
│   Monaco Editor │ Agent Panel │ Voice │ File Explorer │
└─────────────────────────┬────────────────────────────┘
                          │ HTTP / Streaming
                  ┌───────▼───────┐
                  │  API Gateway  │
                  │    :8000      │
                  └──┬──┬──┬──┬──┘
          ┌──────────┼──┼──┼──┼──────────┐
          ▼          ▼  ▼  ▼  ▼          ▼
       ┌──────┐  ┌────┐ ┌─────┐  ┌──────────┐
       │ Auth │  │ AI │ │Voice│  │ Executor │
       │:8001 │  │:8002│ │:8003│  │  :8004   │
       └──────┘  └────┘ └─────┘  └──────────┘
```

### AI Model Fallback Chain

```
AgentRouter (GPT-5 / Claude 4 Sonnet)
    │ ✗ / timeout
    ▼
OpenRouter (free: Gemma 4, MiniMax, Qwen3, DeepSeek R1)
    │ ✗ / 429 rate-limited
    ▼
NVIDIA NIM (Llama 3.3 70B, Nemotron Nano 8B)
    │ ✗
    ▼
Local fallback (template-based responses)
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TypeScript 6, Tailwind CSS v4, Framer Motion |
| **Editor** | Monaco Editor (syntax highlighting, formatting, bracket pairs) |
| **State** | Zustand (persisted via localStorage + IndexedDB for files) |
| **HTTP** | Axios + native Fetch (streaming) |
| **Backend** | FastAPI microservices (5 independent services) |
| **AI — Primary** | AgentRouter (GPT-5, Claude 4 Sonnet) |
| **AI — Fallback** | OpenRouter free models + NVIDIA NIM |
| **Voice — TTS** | ElevenLabs (hero-specific voices) |
| **Voice — STT** | AssemblyAI real-time transcription |
| **Auth** | Face ID (webcam biometric) + GitHub OAuth + Google OAuth |
| **Execution** | Docker sandbox with direct fallback (10 languages) |

---

## ✨ Features

### AI & Intelligence
| Feature | Description |
|---------|-------------|
| 🤖 **AI Agent Panel** | 3D hero avatar with streaming chat, structured tool calls, code generation |
| 🧠 **Code Explanation** | `@file.ts` mentions or "explain the project" — reads files and gives AI summaries |
| 🎯 **Smart Model Routing** | Auto-selects between chat and code models based on prompt analysis |
| 🔄 **Model Selector** | Choose from 20+ models across AgentRouter, OpenRouter, NVIDIA |
| 📋 **Task Context Memory** | Agent remembers recent actions for multi-step workflows |

### Editor & Workspace
| Feature | Description |
|---------|-------------|
| 📝 **Monaco Editor** | Full syntax highlighting for 20+ languages, auto-formatting, bracket pairs |
| 📁 **File Explorer** | Virtual filesystem with create/rename/delete, type-aware icons, sorted view |
| 🖼️ **File Preview** | View images (jpg, png, gif, webp, svg), PDFs, and binary files in-editor |
| 🐳 **Code Execution** | Docker sandbox + direct fallback for Python, JS, TS, Go, Java, C/C++, Rust, Ruby, PHP |
| 🖥️ **Integrated Terminal** | Shell access with workspace-aware command execution |
| 📦 **GitHub Import** | Import any public repo directly into the workspace |

### Voice & UX
| Feature | Description |
|---------|-------------|
| 🎙️ **Voice Input** | AssemblyAI speech-to-text with real-time transcription |
| 🔊 **Voice Output** | ElevenLabs TTS with 4 hero-specific voice profiles |
| 🗣️ **Voice-to-Voice Mode** | Full hands-free: speak and hear responses |
| 🦸 **4 Hero Themes** | Spider-Man, Batman, Superman, Iron Man (colors, avatars, voices) |
| 🎨 **Cinematic UI** | JARVIS-style HUD, glassmorphism, micro-animations, dark mode |

### Auth & Security
| Feature | Description |
|---------|-------------|
| 🔐 **Face ID Login** | Webcam biometric scan with MongoDB-backed enrollment |
| 🔗 **GitHub OAuth** | One-click sign in with GitHub |
| 🔗 **Google OAuth** | One-click sign in with Google |
| 🎫 **JWT Sessions** | Secure token-based authentication |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and npm
- **Python 3.12+**
- **Docker** (optional — for sandboxed code execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/aminammar1/super-hero-ide.git
cd super-hero-ide

# Install all dependencies (frontend npm + backend Python venv)
make install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys (see Environment section below)
```

### Running Locally

```bash
# Option 1: Run frontend and backend separately
make frontend    # Next.js dev server on :3000
make backend     # All backend services via scripts/dev-local.sh

# Option 2: Run full stack with Docker Compose
make dev
```

### Validation

```bash
make typecheck   # TypeScript build validation
make lint        # Frontend lint
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in the required keys:

### AI Providers

| Variable | Description | Required |
|----------|-------------|----------|
| `AGENT_ROUTER_API_KEY` | AgentRouter API key (GPT-5, Claude) | Recommended |
| `AGENT_ROUTER_CHAT_MODELS` | Comma-separated AgentRouter chat models | Optional |
| `AGENT_ROUTER_CODE_MODELS` | Comma-separated AgentRouter code models | Optional |
| `OPENROUTER_API_KEY` | OpenRouter API key (free models) | Recommended |
| `OPENROUTER_CHAT_MODELS` | Comma-separated chat fallback models | Optional |
| `OPENROUTER_CODE_MODELS` | Comma-separated code fallback models | Optional |
| `NVIDIA_AI_API_KEY` | NVIDIA NIM API key | Optional |
| `NVIDIA_CHAT_MODELS` | Comma-separated NVIDIA chat models | Optional |
| `NVIDIA_CODE_MODELS` | Comma-separated NVIDIA code models | Optional |

### Voice

| Variable | Description | Required |
|----------|-------------|----------|
| `ELEVENLABS_API_KEY` | ElevenLabs text-to-speech | Optional |
| `ASSEMBLYAI_API_KEY` | AssemblyAI speech-to-text | Optional |

### Auth

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | JWT signing secret | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | Optional |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | Optional |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub client ID (frontend) | Optional |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google client ID (frontend) | Optional |

### Execution

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_DOCKER_SANDBOX` | Enable Docker sandboxed execution | `false` |
| `DOCKER_TIMEOUT_SECONDS` | Max execution time per run | `30` |

---

## 📁 Project Structure

```
super-hero-ide/
├── backend/
│   ├── gateway/              # API gateway — routes, CORS, reverse proxy
│   ├── services/
│   │   ├── auth/             # Face ID + GitHub/Google OAuth + JWT
│   │   ├── ai/               # Chat streaming, code gen, 3-tier model fallback
│   │   ├── voice/            # ElevenLabs TTS + AssemblyAI STT
│   │   └── executor/         # Docker sandbox + direct exec + workspace API
│   ├── common/               # Shared config, security utils
│   └── tests/                # pytest test suite
│
├── frontend/
│   ├── app/                  # Next.js app directory (routes, providers)
│   │   └── auth/callback/    # OAuth redirect handler
│   ├── components/
│   │   ├── agent/            # AI panel, 3D avatar, chat bubbles, model selector
│   │   ├── ide/              # Monaco editor, file explorer, terminal, preview
│   │   ├── layout/           # App shell, top bar, status bar, settings
│   │   └── ui/               # Reusable primitives (button, card, dialog)
│   ├── features/
│   │   ├── agent/            # Tool executor, voice hooks, speech recognition
│   │   ├── auth/             # Face login, onboarding flow
│   │   └── editor/           # Language templates
│   ├── services/             # Axios HTTP client, API functions
│   ├── store/                # Zustand stores (app, files, agent)
│   ├── lib/                  # Types, AI model definitions, utilities
│   └── themes/               # Hero theme definitions + assets
│
├── scripts/                  # Dev launcher scripts
├── docs/                     # Documentation assets
├── docker-compose.yml        # Full-stack Docker orchestration
├── Makefile                  # Build, run, and validation commands
└── AGENTS.md                 # AI agent coding guidelines
```

---

## 🔒 OAuth Setup

### GitHub OAuth

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set **Authorization callback URL** to `http://localhost:3000/auth/callback`
4. Copy the Client ID and Secret to your `.env`:
   ```
   GITHUB_CLIENT_ID=<your-id>
   GITHUB_CLIENT_SECRET=<your-secret>
   NEXT_PUBLIC_GITHUB_CLIENT_ID=<your-id>
   ```

### Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:3000/auth/callback` to **Authorized redirect URIs**
4. Copy the Client ID and Secret to your `.env`:
   ```
   GOOGLE_CLIENT_ID=<your-id>
   GOOGLE_CLIENT_SECRET=<your-secret>
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-id>
   ```

---

## 🧪 Testing

```bash
# Backend tests (pytest)
backend/.venv/bin/python -m pytest backend/tests

# Frontend type checking
make typecheck

# Frontend linting
make lint
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository and create a feature branch
2. Follow the coding style: TypeScript/React for frontend, Python/FastAPI for backend
3. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, etc.
4. Run `make typecheck` and `make lint` before submitting
5. Include screenshots for UI changes
6. Document any new environment variables

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/aminammar1">@aminammar1</a>
</p>
