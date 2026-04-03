from typing import Annotated, AsyncIterator

import httpx
from fastapi import FastAPI, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

from common.config import get_settings

settings = get_settings()
app = FastAPI(title="SuperHero API Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def request_json(
    method: str,
    url: str,
    payload: dict | None = None,
    authorization: str | None = None,
):
    headers = {"Authorization": authorization} if authorization else {}
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.request(method, url, json=payload, headers=headers)
    if response.is_error:
        raise HTTPException(response.status_code, response.text)
    return JSONResponse(status_code=response.status_code, content=response.json())


@app.get("/")
async def root():
    return {
        "name": "SuperHero API Gateway",
        "services": {
            "auth": settings.auth_service_url,
            "ai": settings.ai_service_url,
            "voice": settings.voice_service_url,
            "executor": settings.executor_service_url,
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway"}


@app.post("/api/auth/face-login")
async def face_login(payload: dict):
    return await request_json(
        "POST", f"{settings.auth_service_url}/face/login", payload=payload
    )


@app.get("/api/profile/me")
async def profile_me(authorization: Annotated[str | None, Header()] = None):
    return await request_json(
        "GET",
        f"{settings.auth_service_url}/profile/me",
        authorization=authorization,
    )


@app.post("/api/profile/onboarding")
async def profile_onboarding(
    payload: dict, authorization: Annotated[str | None, Header()] = None
):
    return await request_json(
        "POST",
        f"{settings.auth_service_url}/profile/onboarding",
        payload=payload,
        authorization=authorization,
    )


@app.post("/api/code/generate")
async def code_generate(
    payload: dict, authorization: Annotated[str | None, Header()] = None
):
    return await request_json(
        "POST",
        f"{settings.ai_service_url}/code",
        payload=payload,
        authorization=authorization,
    )


@app.post("/api/execute/run")
async def execute_run(
    payload: dict, authorization: Annotated[str | None, Header()] = None
):
    return await request_json(
        "POST",
        f"{settings.executor_service_url}/execute",
        payload=payload,
        authorization=authorization,
    )


@app.post("/api/chat/stream")
async def chat_stream(
    payload: dict, authorization: Annotated[str | None, Header()] = None
):
    async def streamer() -> AsyncIterator[bytes]:
        headers = {"Authorization": authorization} if authorization else {}
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{settings.ai_service_url}/chat/stream",
                json=payload,
                headers=headers,
            ) as response:
                if response.is_error:
                    detail = await response.aread()
                    raise HTTPException(response.status_code, detail.decode())
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(streamer(), media_type="text/plain")


@app.post("/api/voice/tts")
async def voice_tts(
    payload: dict, authorization: Annotated[str | None, Header()] = None
):
    """Proxy TTS to voice service with streaming."""
    headers = {"Authorization": authorization} if authorization else {}

    async def streamer() -> AsyncIterator[bytes]:
        async with httpx.AsyncClient(timeout=180.0) as client:
            async with client.stream(
                "POST",
                f"{settings.voice_service_url}/tts",
                json=payload,
                headers=headers,
            ) as response:
                if response.is_error:
                    detail = await response.aread()
                    raise HTTPException(response.status_code, detail.decode())
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(streamer(), media_type="audio/mpeg")


@app.post("/api/voice/stt")
async def proxy_voice_stt(request: Request):
    """Proxy STT to voice service."""
    form = await request.form()
    file = form.get("file")
    if not file:
        raise HTTPException(status_code=400, detail="Missing audio file")

    file_content = await file.read()
    async with httpx.AsyncClient(timeout=120.0) as client:
        files = {"file": (file.filename, file_content, file.content_type)}
        response = await client.post(
            f"{settings.voice_service_url}/stt",
            files=files,
        )
        if response.is_error:
            raise HTTPException(response.status_code, response.text)

        return response.json()
