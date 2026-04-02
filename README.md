# SuperHero AI IDE

A production-ready prototype that combines a Next.js App Router frontend with a FastAPI microservice backend for:

- Face ID login
- Superhero-themed onboarding
- Monaco-based coding workspace
- Streaming chat and voice-to-code
- ElevenLabs text-to-speech integration
- Docker-backed code execution

## Frontend stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style Radix UI primitives
- Zustand
- Axios
- Framer Motion

## Backend services

- `gateway`: routes and aggregates downstream services
- `auth`: face login simulation plus onboarding profile persistence
- `ai`: chat and code generation with provider fallback logic
- `voice`: ElevenLabs TTS proxy
- `executor`: Docker sandbox execution with a mock mode fallback

## Run locally

```bash
make dev-local
```

Or launch the whole stack with Docker:

```bash
make dev
```

The Make targets are cross-platform:

- Windows uses `py` and the PowerShell launcher script.
- macOS and Linux use `python3` and the Bash launcher script.
