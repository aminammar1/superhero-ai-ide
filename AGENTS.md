# Repository Guidelines

## Project Structure & Module Organization
This repository is split into a Next.js frontend and FastAPI backend services.

- `frontend/app/` contains Next.js routes, providers, loading, and error pages.
- `frontend/components/` contains UI by domain: `agent/`, `ide/`, `layout/`, and `ui/`.
- `frontend/features/`, `frontend/services/`, `frontend/store/`, `frontend/lib/`, and `frontend/themes/` hold feature logic, API clients, Zustand stores, shared types/utilities, and hero theme assets.
- `backend/gateway/` proxies API traffic to services.
- `backend/services/{auth,ai,voice,executor}/` contains independent FastAPI services.
- `backend/common/` holds shared config and security helpers.
- `backend/tests/` contains backend tests. `scripts/` contains local dev launchers.

## Build, Test, and Development Commands
- `make install` installs frontend npm packages and backend Python dependencies into `backend/.venv`.
- `make frontend` runs the Next.js dev server from `frontend/`.
- `make backend` runs all backend microservices locally through `backend/dev.py`.
- `make dev` runs the full stack with Docker Compose.
- `make typecheck` runs `npm run build` for frontend type/build validation.
- `make lint` runs the configured frontend lint command.
- `backend/.venv/bin/python -m pytest backend/tests` runs backend tests when `pytest` is installed.

## Coding Style & Naming Conventions
Frontend code uses TypeScript, React function components, Tailwind CSS v4, and Zustand. Use 2-space indentation for TS/TSX/CSS/JSON. Component files use kebab-case names such as `agent-panel.tsx`; exported React components use PascalCase.

Backend code uses Python 3.12 and FastAPI. Use snake_case for functions, modules, and variables. Keep service-specific logic inside its service package and shared settings in `backend/common/config.py`.

## Testing Guidelines
Backend tests use `pytest` and FastAPI `TestClient`. Name tests `test_*.py` and test functions `test_<behavior>`. Prefer service-level tests in `backend/tests/` for gateway, AI, executor, auth, and voice behavior. For frontend changes, run `make typecheck`; add component-level tests only if a frontend test runner is introduced.

## Commit & Pull Request Guidelines
Recent commits use concise Conventional Commit prefixes such as `feat:`, `refactor:`, and plain imperative messages. Prefer `type: short summary`, for example `feat: improve terminal command handling`.

Pull requests should include a short description, linked issue if applicable, verification commands run, screenshots or screen recordings for UI changes, and notes for new environment variables or migrations.

## Security & Configuration Tips
Never commit `.env` or API keys. Configure AI providers, OAuth, voice, and executor settings through environment variables documented in `README.md`. Keep workspace filesystem operations constrained to the executor workspace and avoid broad shell access in new endpoints.
