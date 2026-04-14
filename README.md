# SuperHero AI IDE

A futuristic AI-powered code editor with superhero-themed personas, voice interaction, and sandboxed code execution.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion |
| Editor | Monaco Editor |
| State | Zustand (persisted) |
| HTTP | Axios |
| Backend | FastAPI (microservices) |
| AI - Code | NVIDIA nvidia/tiiuae/falcon3-7b-instruct + OpenRouter fallback chain |
| AI - Chat | OpenRouter free model chain + NVIDIA fallback |
| Voice | ElevenLabs text-to-speech |
| Auth | Face ID (webcam biometric) |
| Execution | Docker sandbox (Go, Python, JS, TS, Java, C, C++) |

## Architecture

```
Frontend (Next.js)
    |
API Gateway (:8000)
    |
 +--+--+--+--+
 |  |  |  |  |
Auth AI Voice Executor
:8001 :8002 :8003 :8004
```

## Features

- **Face ID authentication** with webcam biometric scan
- **4 hero themes** - Spider-Man, Batman, Superman, Iron Man
- **AI agent panel** with 3D hero avatar and voice responses
- **Smart routing** - chat questions get voice replies, code requests generate and insert code
- **Monaco editor** with syntax highlighting for 7 languages
- **Docker sandbox** for secure code execution
- **Voice input** via browser speech recognition
- **Voice output** via ElevenLabs with hero-specific voices
- **Settings panel** with theme switching, voice toggle, profile management

## Quick Start

```bash
# Install dependencies
make install

# Run frontend only
make frontend

# Run backend microservices locally
make backend

# Run everything with Docker
make dev
```

## Environment

Copy `.env.example` to `.env` and fill in your API keys:

- `NVIDIA_AI_API_KEY` - NVIDIA AI endpoint key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENROUTER_CHAT_MODELS` - comma-separated chat fallback models
- `OPENROUTER_CODE_MODELS` - comma-separated code fallback models
- `NVIDIA_CHAT_MODELS` - comma-separated NVIDIA chat fallback models
- `NVIDIA_CODE_MODELS` - comma-separated NVIDIA code fallback models
- `ELVEN_LABS_API_KEY` - ElevenLabs API key

## Project Structure

```
backend/
  gateway/              API gateway (FastAPI)
  services/
    auth/               Face ID auth + JWT
    ai/                 Code generation + chat streaming
    voice/              ElevenLabs TTS proxy
    executor/           Docker sandbox runner
  common/               Shared config, security utils
frontend/
  app/                  Next.js app directory (pages, layout, globals)
  components/
    agent/              AI agent panel, avatar, chat bubbles
    ide/                Code editor, terminal output
    layout/             App shell, top bar, status bar, settings
    ui/                 Reusable primitives (button, input, card, etc.)
  features/
    agent/              Speech recognition hook
    auth/               Face login, onboarding flow
    editor/             Language templates
  services/             Axios HTTP client, API functions
  store/                Zustand store
  themes/               Hero theme definitions
```
