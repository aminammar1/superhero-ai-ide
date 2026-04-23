<p align="center">
  <img src="docs/logo.png" alt="SuperHero AI IDE" width="120" />
</p>

<h1 align="center">SuperHero AI IDE</h1>

<p align="center">
  <strong>A futuristic AI-powered code editor with superhero-themed personas, voice interaction, and sandboxed code execution.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Monaco-Editor-1E1E1E?style=flat-square&logo=visualstudiocode" alt="Monaco" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Docker-Sandbox-2496ED?style=flat-square&logo=docker" alt="Docker" />
</p>

---

## ⚡ Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TypeScript 6, Tailwind CSS v4, Framer Motion |
| **Editor** | Monaco Editor (syntax highlighting, formatting, bracket pairs) |
| **State** | Zustand (persisted) |
| **HTTP** | Axios |
| **Backend** | FastAPI microservices (5 services) |
| **AI — Primary** | AgentRouter (GPT-5, Claude 4 Sonnet) |
| **AI — Fallback** | OpenRouter free models + NVIDIA NIM |
| **Voice — TTS** | ElevenLabs (hero-specific voices) |
| **Voice — STT** | AssemblyAI |
| **Auth** | Face ID (webcam biometric) + GitHub OAuth + Google OAuth |
| **Execution** | Docker sandbox with direct fallback (Python, JS, TS, Go, Java, C, C++, Rust, Ruby, PHP) |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│               Frontend (Next.js 16)             │
│   Monaco Editor │ Agent Panel │ Voice Control    │
└───────────────────────┬─────────────────────────┘
                        │
                ┌───────▼───────┐
                │  API Gateway  │
                │    :8000      │
                └───┬───┬───┬───┘
          ┌─────────┼───┼───┼─────────┐
          ▼         ▼   ▼   ▼         ▼
       ┌──────┐ ┌────┐ ┌─────┐ ┌──────────┐
       │ Auth │ │ AI │ │Voice│ │ Executor │
       │:8001 │ │:8002│ │:8003│ │  :8004   │
       └──────┘ └────┘ └─────┘ └──────────┘
```

### AI Fallback Chain

```
AgentRouter (GPT-5 / Claude 4 Sonnet)
    │ ✗
    ▼
OpenRouter (free models — Gemma 4, MiniMax, Qwen3, DeepSeek R1)
    │ ✗ / 429
    ▼
NVIDIA NIM (Llama 3.3 70B, Nemotron Nano 8B)
    │ ✗
    ▼
Local fallback (template-based responses)
```

## ✨ Features

- **🔐 Multi-auth** — Face ID biometric scan, GitHub OAuth, Google OAuth
- **🦸 4 Hero Themes** — Spider-Man, Batman, Superman, Iron Man (full color + voice)
- **🤖 AI Agent Panel** — 3D hero avatar with streaming chat, tool calls, code generation
- **🎯 Smart Routing** — chat → voice reply, code → generate & insert into editor
- **📝 Monaco Editor** — Syntax highlighting for 15 languages, auto-formatting, bracket pairs
- **🐳 Docker Sandbox** — Secure code execution with automatic fallback to direct/simulated
- **🎙️ Voice Input** — AssemblyAI speech-to-text with real-time transcription
- **🔊 Voice Output** — ElevenLabs TTS with hero-specific voices (4 unique voices)
- **⚙️ Settings Panel** — Theme switching, voice toggle, profile management
- **📁 File Explorer** — Virtual filesystem with create/rename/delete, drag & drop
- **🖥️ Terminal** — Integrated terminal output with execution results
- **🔄 Model Selector** — 20+ AI models across 3 providers (AgentRouter, OpenRouter, NVIDIA)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker (optional, for sandboxed execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/super-hero-ide.git
cd super-hero-ide

# Install all dependencies
make install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys (see Environment section below)
```

### Running

```bash
# Run frontend only (Next.js dev server)
make frontend

# Run backend microservices locally
make backend

# Run everything with Docker Compose
make dev
```

## 🔧 Environment

Copy `.env.example` to `.env` and configure:

### AI Providers

| Variable | Description |
|----------|-------------|
| `AGENT_ROUTER_API_KEY` | AgentRouter API key (primary — GPT-5, Claude) |
| `AGENT_ROUTER_CHAT_MODELS` | Comma-separated AgentRouter chat models |
| `AGENT_ROUTER_CODE_MODELS` | Comma-separated AgentRouter code models |
| `NVIDIA_AI_API_KEY` | NVIDIA NIM API key |
| `NVIDIA_CHAT_MODELS` | Comma-separated NVIDIA chat fallback models |
| `NVIDIA_CODE_MODELS` | Comma-separated NVIDIA code fallback models |
| `OPENROUTER_API_KEY` | OpenRouter API key (free models) |
| `OPENROUTER_CHAT_MODELS` | Comma-separated OpenRouter chat fallback models |
| `OPENROUTER_CODE_MODELS` | Comma-separated OpenRouter code fallback models |

### Voice

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | ElevenLabs text-to-speech API key |
| `ASSEMBLYAI_API_KEY` | AssemblyAI speech-to-text API key |

### Auth

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub client ID (frontend) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google client ID (frontend) |

### Execution

| Variable | Description |
|----------|-------------|
| `ENABLE_DOCKER_SANDBOX` | Enable Docker sandboxed execution (`true`/`false`) |
| `DOCKER_TIMEOUT_SECONDS` | Max execution time in seconds |

## 📁 Project Structure

```
backend/
  gateway/              API gateway (FastAPI) — routes, CORS, proxy
  services/
    auth/               Face ID + OAuth SSO (GitHub, Google) + JWT
    ai/                 Code generation + chat streaming (3-tier fallback)
    voice/              ElevenLabs TTS + AssemblyAI STT proxy
    executor/           Docker sandbox + direct execution runner
  common/               Shared config, security utils
  tests/                Backend test suite

frontend/
  app/                  Next.js app directory
    auth/callback/      OAuth redirect handler
  components/
    agent/              AI agent panel, avatar, chat bubbles, model selector
    ide/                Code editor, file explorer, terminal output
    layout/             App shell, top bar, status bar, settings
    ui/                 Reusable primitives (button, input, card)
  features/
    auth/               Face login, onboarding flow
    editor/             Language templates
  services/             Axios HTTP client, API functions
  store/                Zustand stores (app, files, agent)
  lib/                  Types, AI model definitions, utilities
  themes/               Hero theme definitions + assets
```

## 🔒 OAuth Setup

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:3000/auth/callback`
4. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `.env`
5. Also add `NEXT_PUBLIC_GITHUB_CLIENT_ID` for the frontend

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client credentials
3. Set authorized redirect URI to `http://localhost:3000/auth/callback`
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
5. Also add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for the frontend

---

<p align="center">
  Built with ⚡ by the SuperHero AI IDE team
</p>
