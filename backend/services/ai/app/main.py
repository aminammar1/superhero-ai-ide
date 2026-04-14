import asyncio
import logging
import time
from collections.abc import AsyncIterator

import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from common.config import get_settings

settings = get_settings()
app = FastAPI(title="SuperHero AI Service", version="0.1.0")
logger = logging.getLogger(__name__)

OPENROUTER_MAX_ATTEMPTS = 3
OPENROUTER_DEFAULT_COOLDOWN_SECONDS = 8.0
OPENROUTER_RETRY_DELAY_SECONDS = 1.5
OPENROUTER_ERROR_LOG_BODY_LIMIT = 280
_openrouter_cooldown_until = 0.0


class OpenRouterRateLimited(RuntimeError):
    def __init__(self, retry_after_seconds: float):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(f"OpenRouter rate-limited (retry after {retry_after_seconds:.1f}s)")


class OpenRouterNonFreeModel(RuntimeError):
    def __init__(self, model_name: str):
        self.model_name = model_name
        super().__init__(f"OpenRouter model must end with :free, got: {model_name}")


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    prompt: str
    heroTheme: str
    model: str | None = None
    history: list[HistoryMessage] = []


class CodeRequest(BaseModel):
    prompt: str
    language: str
    heroTheme: str
    model: str | None = None


THEME_PERSONAS = {
    "spiderman": "quick, direct, sharp wit, no fluff",
    "batman": "terse, tactical, no nonsense",
    "superman": "clear, decisive, straight to the point",
    "ironman": "sharp, technical, zero filler",
}

TOOL_SYSTEM_PROMPT = """You are the AI co-pilot inside SuperHero AI IDE.
Tone: {persona}.

COMMUNICATION RULES:
1. MAX 1 to 2 sentences. Never more.
2. No hyphens in responses. No bullet lists in chat. No markdown formatting.
3. No filler words like "Sure!", "Absolutely!", "Great question!", "I'd be happy to".
4. Go straight to action or answer. Zero preamble.
5. Never repeat back what the user said.
6. Never explain what you are about to do. Just do it.
7. Do NOT output raw code blocks in chat. Use TOOL calls instead.

{context_block}

TOOLS:
[TOOL:create_file(path="src/index.ts", content="// content")]
[TOOL:create_folder(path="src/components")]
[TOOL:delete_file(path="old-file.ts")]
[TOOL:modify_file(path="src/app.ts", content="// new content")]
[TOOL:read_file(path="src/index.ts")]
[TOOL:list_files()]

TOOL RULES:
- Use TOOL format for any file/folder operation. Always.
- Multiple tool calls in one message is fine.
- For create_file, always include real, working content. Never placeholder.
- After tool tags, one short confirmation. Nothing else.

PROJECT SCAFFOLDING:
When user asks to create a project (React, Next.js, Express, Flask, etc), create ALL necessary files:
- React: package.json, public/index.html, src/index.tsx, src/App.tsx, src/App.css, tsconfig.json
- Next.js: package.json, app/page.tsx, app/layout.tsx, app/globals.css, next.config.js, tsconfig.json
- Express: package.json, src/index.ts, src/routes/index.ts, tsconfig.json
- Flask: requirements.txt, app.py, templates/index.html
- Python: main.py, requirements.txt
Always include working dependency versions in package.json. Always include a start/dev script.

Example:
User: create a button component
Response:
[TOOL:create_file(path="src/components/Button.tsx", content="import React from 'react';\\n\\nexport function Button({{ children }}: {{ children: React.ReactNode }}) {{\\n  return <button className='btn'>{{children}}</button>;\\n}}")]
Button component ready.
"""


def split_models(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def unique_models(models: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for model in models:
        model_name = model.strip()
        if not model_name or model_name in seen:
            continue
        seen.add(model_name)
        ordered.append(model_name)
    return ordered


def parse_retry_after_seconds(retry_after_header: str | None) -> float:
    try:
        retry_after_seconds = float(retry_after_header) if retry_after_header else OPENROUTER_DEFAULT_COOLDOWN_SECONDS
    except ValueError:
        retry_after_seconds = OPENROUTER_DEFAULT_COOLDOWN_SECONDS
    return max(1.0, retry_after_seconds)


def openrouter_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        text = (response.text or "").strip()
        return text[:OPENROUTER_ERROR_LOG_BODY_LIMIT] if text else f"HTTP {response.status_code}"

    if isinstance(payload, dict):
        error_payload = payload.get("error")
        if isinstance(error_payload, dict):
            message = str(error_payload.get("message") or "").strip()
            metadata = error_payload.get("metadata")
            raw_message = ""
            provider_name = ""
            if isinstance(metadata, dict):
                raw_message = str(metadata.get("raw") or "").strip()
                provider_name = str(metadata.get("provider_name") or "").strip()

            parts = []
            if message:
                parts.append(message)
            if raw_message:
                parts.append(raw_message)
            if provider_name:
                parts.append(f"provider={provider_name}")

            if parts:
                return " | ".join(parts)[:OPENROUTER_ERROR_LOG_BODY_LIMIT]

        compact = str(payload).strip()
        if compact:
            return compact[:OPENROUTER_ERROR_LOG_BODY_LIMIT]

    return f"HTTP {response.status_code}"


def _is_nvidia_nim_model(model: str) -> bool:
    """NVIDIA NIM models (via integrate.api.nvidia.com) never end with :free.
    Models like nvidia/nemotron-3-super:free are OpenRouter-hosted."""
    return model.startswith("nvidia/") and not model.endswith(":free")


def openrouter_model_chain(selected_model: str | None, mode: str) -> list[str]:
    configured = split_models(settings.openrouter_chat_models if mode == "chat" else settings.openrouter_code_models)
    legacy = (settings.openrouter_model or "").strip()
    preferred = (selected_model or "").strip()

    models = []
    if preferred and not _is_nvidia_nim_model(preferred):
        models.append(preferred)
    models.extend(configured)
    if legacy:
        models.append(legacy)

    free_models = [model for model in unique_models(models) if model.endswith(":free")]
    if free_models:
        return free_models

    if preferred and not _is_nvidia_nim_model(preferred):
        raise OpenRouterNonFreeModel(preferred)
    if models:
        raise OpenRouterNonFreeModel(models[0])
    return []


def nvidia_model_chain(selected_model: str | None, mode: str) -> list[str]:
    configured = split_models(settings.nvidia_chat_models if mode == "chat" else settings.nvidia_code_models)
    legacy = (settings.nvidia_model or "").strip()
    preferred = (selected_model or "").strip()

    models = []
    if _is_nvidia_nim_model(preferred):
        models.append(preferred)
    models.extend(configured)
    if legacy:
        models.append(legacy)
    # Filter out OpenRouter-hosted nvidia models (they end with :free)
    return [m for m in unique_models(models) if not m.endswith(":free")]


async def openrouter_chat(messages: list[dict], models: list[str]) -> str:
    global _openrouter_cooldown_until

    openrouter_api_key = (settings.openrouter_api_key or "").strip()
    if not models:
        raise RuntimeError("No OpenRouter models configured.")

    candidate_models = [model.strip() for model in models if model.strip()]

    if not openrouter_api_key:
        raise RuntimeError("OpenRouter is not configured.")

    now = time.monotonic()
    if now < _openrouter_cooldown_until:
        raise OpenRouterRateLimited(_openrouter_cooldown_until - now)

    if not candidate_models:
        raise RuntimeError("No OpenRouter models configured.")

    best_retry_after_seconds = OPENROUTER_DEFAULT_COOLDOWN_SECONDS
    last_error: Exception | None = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for openrouter_model in candidate_models:
            if not openrouter_model.endswith(":free"):
                raise OpenRouterNonFreeModel(openrouter_model)

            for attempt in range(1, OPENROUTER_MAX_ATTEMPTS + 1):
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": openrouter_model,
                        "messages": messages,
                    },
                )

                if response.status_code == 429:
                    retry_after_seconds = parse_retry_after_seconds(response.headers.get("Retry-After"))
                    best_retry_after_seconds = max(best_retry_after_seconds, retry_after_seconds)
                    detail = openrouter_error_detail(response)
                    logger.warning(
                        "OpenRouter rate-limited model=%s attempt=%d/%d retry_after=%.1fs detail=%s",
                        openrouter_model,
                        attempt,
                        OPENROUTER_MAX_ATTEMPTS,
                        retry_after_seconds,
                        detail,
                    )
                    last_error = OpenRouterRateLimited(retry_after_seconds)

                    if attempt < OPENROUTER_MAX_ATTEMPTS and retry_after_seconds <= OPENROUTER_RETRY_DELAY_SECONDS:
                        await asyncio.sleep(OPENROUTER_RETRY_DELAY_SECONDS)
                        continue

                    break

                if response.is_error:
                    detail = openrouter_error_detail(response)
                    logger.warning(
                        "OpenRouter HTTP failure model=%s status=%d detail=%s",
                        openrouter_model,
                        response.status_code,
                        detail,
                    )
                    if response.status_code in (401, 403):
                        raise RuntimeError("OpenRouter authentication failed.")
                    last_error = RuntimeError(f"OpenRouter model failed ({openrouter_model}): HTTP {response.status_code}")
                    break

                payload = response.json()
                return payload["choices"][0]["message"]["content"]

    if isinstance(last_error, OpenRouterRateLimited):
        _openrouter_cooldown_until = time.monotonic() + best_retry_after_seconds
        raise OpenRouterRateLimited(best_retry_after_seconds)

    if last_error is not None:
        raise last_error

    raise RuntimeError("OpenRouter request failed for all configured models")


async def nvidia_chat(messages: list[dict], models: list[str]) -> str:
    nvidia_api_key = (settings.nvidia_api_key or "").strip()

    if not nvidia_api_key:
        raise RuntimeError("NVIDIA AI is not configured.")

    if not models:
        raise RuntimeError("No NVIDIA models configured.")

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=90.0) as client:
        for model_name in models:
            try:
                response = await client.post(
                    "https://integrate.api.nvidia.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {nvidia_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_name,
                        "messages": messages,
                        "temperature": 0.45,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                return payload["choices"][0]["message"]["content"]
            except Exception as exc:
                last_error = exc

    if last_error:
        raise last_error
    raise RuntimeError("NVIDIA request failed")


def encode_tool_arg(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\t", "\\t")
    )


def fallback_file_content(file_name: str, hero_theme: str) -> str:
    lower_name = file_name.lower()

    if lower_name.endswith(".go"):
        return f"""package main

import "fmt"

func main() {
    fmt.Println("Hello from {file_name}!")
}
"""

    if lower_name.endswith(".py"):
        return f"""# Created by {hero_theme} agent
# File: {file_name}

def main() -> None:
    print("Hello from {file_name}!")


if __name__ == "__main__":
    main()
"""

    if lower_name.endswith(".ts") or lower_name.endswith(".tsx"):
        return (
            f"// Created by {hero_theme} agent\n"
            f"// File: {file_name}\n\n"
            "export function main() {\n"
            f"  console.log(\"Hello from {file_name}!\");\n"
            "}\n"
        )

    if lower_name.endswith(".js") or lower_name.endswith(".jsx"):
        return (
            f"// Created by {hero_theme} agent\n"
            f"// File: {file_name}\n\n"
            "function main() {\n"
            f"  console.log(\"Hello from {file_name}!\");\n"
            "}\n\n"
            "main();\n"
        )

    return (
        f"// Created by {hero_theme} agent\n"
        f"// File: {file_name}\n\n"
        f"Hello from {file_name}!\n"
    )


async def nvidia_code(prompt: str, models: list[str]) -> str:
    nvidia_api_key = (settings.nvidia_api_key or "").strip()

    if not nvidia_api_key:
        raise RuntimeError("NVIDIA AI is not configured.")

    if not models:
        raise RuntimeError("No NVIDIA models configured.")

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=90.0) as client:
        for model_name in models:
            try:
                response = await client.post(
                    "https://integrate.api.nvidia.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {nvidia_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.25,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                return payload["choices"][0]["message"]["content"]
            except Exception as exc:
                last_error = exc

    if last_error:
        raise last_error
    raise RuntimeError("NVIDIA request failed")


def local_chat_fallback(request: ChatRequest) -> str:
    prompt = request.prompt.lower()

    # Handle file/folder creation requests with proper tool format
    if any(word in prompt for word in ["create", "make", "new", "add"]):
        if any(word in prompt for word in ["folder", "directory", "dir"]):
            folder_name = "src"
            for word in request.prompt.split():
                if word not in ["create", "make", "new", "add", "a", "folder", "directory", "called", "named", "the"]:
                    folder_name = word
                    break
            return f'[TOOL:create_folder(path="{folder_name}")]\nDone.'

        if any(word in prompt for word in ["file", "component", "module", "page"]):
            file_name = "index.ts"
            for word in request.prompt.split():
                if "." in word:
                    file_name = word
                    break
            content = fallback_file_content(file_name, request.heroTheme)
            safe_file_name = encode_tool_arg(file_name)
            safe_content = encode_tool_arg(content)
            return (
                f'[TOOL:create_file(path="{safe_file_name}", content="{safe_content}")]\n'
                f"{file_name} created."
            )

    if any(word in prompt for word in ["delete", "remove", "rm"]):
        file_name = "unknown"
        for word in request.prompt.split():
            if "." in word or word not in ["delete", "remove", "rm", "the", "file", "a"]:
                file_name = word
                break
        return f'[TOOL:delete_file(path="{file_name}")]\nQueued for approval.'

    if any(word in prompt for word in ["list", "show", "ls", "what files"]):
        return '[TOOL:list_files()]\nScanning workspace.'

    # Direct fallback per hero
    if request.heroTheme == "spiderman":
        return "Running on local mode. Tell me what to build."

    if request.heroTheme == "batman":
        return "Network compromised. Local systems active. What do you need."

    if request.heroTheme == "superman":
        return "Main servers offline. Local mode engaged. Ready for your command."

    if request.heroTheme == "ironman":
        return "Running on backup arc reactor. Local AI active. What are we building."

    return "Local mode active. Tell me what to create."


def local_code_fallback(request: CodeRequest) -> str:
    prompt = request.prompt.lower()
    if request.language == "go" and "rest" in prompt:
        return """package main

import (
    "encoding/json"
    "log"
    "net/http"
)

func healthHandler(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
        "service": "hero-api",
    })
}

func main() {
    http.HandleFunc("/health", healthHandler)
    log.Println("Server listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
"""
    return (
        f"// Generated by the {request.heroTheme} prototype agent\n"
        f"// Language: {request.language}\n"
        f"// Prompt: {request.prompt}\n\n"
        "export function buildFeature() {\n"
        "  return { status: 'prototype', next: 'refine generated implementation' };\n"
        "}\n"
    )


def provider_sequence(selected_model: str | None, default_first: str) -> list[str]:
    preferred = (selected_model or "").strip()
    if preferred.startswith("nvidia/"):
        return ["nvidia", "openrouter"]
    if preferred:
        return ["openrouter", "nvidia"]
    if default_first == "nvidia":
        return ["nvidia", "openrouter"]
    return ["openrouter", "nvidia"]


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}


@app.post("/code")
async def code(request: CodeRequest):
    selected_model = (request.model or "").strip() or None
    prompt = (
        f"You are an elite coding assistant with a {THEME_PERSONAS.get(request.heroTheme, 'helpful')} tone. "
        f"Generate production-ready {request.language} code for this request. Return code only.\n{request.prompt}"
    )

    nvidia_models = nvidia_model_chain(selected_model, "code")
    try:
        openrouter_models = openrouter_model_chain(selected_model, "code")
    except OpenRouterNonFreeModel as exc:
        logger.warning("OpenRouter non-free model blocked for code (%s)", exc.model_name)
        openrouter_models = []

    code_block: str | None = None
    providers = provider_sequence(selected_model, "nvidia")

    for provider in providers:
        if provider == "nvidia":
            try:
                code_block = await nvidia_code(prompt, nvidia_models)
                break
            except Exception as exc:
                logger.warning("NVIDIA code generation failed; trying fallback provider: %s", exc)
                continue

        if not openrouter_models:
            continue
        try:
            code_block = await openrouter_chat(
                [{"role": "user", "content": prompt}],
                openrouter_models,
            )
            break
        except OpenRouterRateLimited as exc:
            logger.warning("OpenRouter code request rate-limited for %.1fs", exc.retry_after_seconds)
        except Exception as exc:
            logger.warning("OpenRouter code generation failed; trying fallback provider: %s", exc)

    if code_block is None:
        code_block = local_code_fallback(request)

    return JSONResponse(
        {
            "language": request.language,
            "code": code_block,
            "explanation": "Generated through the AI service with fallback logic enabled.",
        }
    )


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    selected_model = (request.model or "").strip() or None
    persona = THEME_PERSONAS.get(request.heroTheme, "helpful")

    # Extract context from history (frontend sends context as system messages)
    context_lines = []
    filtered_history = []
    for msg in request.history:
        if msg.role == "system" and msg.content.startswith("Previous task context:"):
            context_lines.append(msg.content)
        else:
            filtered_history.append(msg)

    context_block = ""
    if context_lines:
        context_block = "CONTEXT FROM PREVIOUS TASKS (use this to maintain continuity):\n" + "\n".join(context_lines)

    system_prompt = TOOL_SYSTEM_PROMPT.format(persona=persona, context_block=context_block)

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        }
    ]
    messages.extend([message.model_dump() for message in filtered_history])
    messages.append({"role": "user", "content": request.prompt})


    nvidia_models = nvidia_model_chain(selected_model, "chat")
    try:
        openrouter_models = openrouter_model_chain(selected_model, "chat")
    except OpenRouterNonFreeModel as exc:
        logger.warning("OpenRouter non-free model blocked for chat (%s)", exc.model_name)
        openrouter_models = []

    final_text: str | None = None
    providers = provider_sequence(selected_model, "openrouter")

    for provider in providers:
        if provider == "openrouter":
            if not openrouter_models:
                continue
            try:
                final_text = await openrouter_chat(messages, openrouter_models)
                break
            except OpenRouterRateLimited as exc:
                logger.warning("OpenRouter rate-limited for chat %.1fs; trying NVIDIA", exc.retry_after_seconds)
            except Exception as exc:
                logger.warning("OpenRouter chat failed; trying NVIDIA: %s", exc)
            continue

        try:
            final_text = await nvidia_chat(messages, nvidia_models)
            break
        except Exception as exc:
            logger.warning("NVIDIA chat failed; trying local fallback: %s", exc)

    if final_text is None:
        final_text = local_chat_fallback(request)

    async def streamer() -> AsyncIterator[str]:
        for chunk in final_text.split():
            yield f"{chunk} "
            await asyncio.sleep(0.008)

    return StreamingResponse(streamer(), media_type="text/plain")
