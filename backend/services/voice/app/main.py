from collections.abc import AsyncIterator

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from common.config import get_settings

settings = get_settings()
app = FastAPI(title="SuperHero Voice Service", version="0.1.0")


class TTSRequest(BaseModel):
    text: str
    heroTheme: str


VOICE_MAP = {
    "spiderman": settings.voice_spiderman_id,
    "batman": settings.voice_batman_id,
    "superman": settings.voice_superman_id,
    "ironman": settings.voice_ironman_id,
}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "voice"}


@app.post("/tts")
async def tts(request: TTSRequest):
    if not settings.elevenlabs_api_key:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs is not configured. Set ELEVENLABS_API_KEY to enable audio output.",
        )

    voice_id = VOICE_MAP.get(request.heroTheme) or settings.voice_spiderman_id

    async def streamer() -> AsyncIterator[bytes]:
        async with httpx.AsyncClient(timeout=180.0) as client:
            async with client.stream(
                "POST",
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": request.text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.45,
                        "similarity_boost": 0.8,
                    },
                },
            ) as response:
                if response.is_error:
                    detail = await response.aread()
                    raise HTTPException(response.status_code, detail.decode())
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(streamer(), media_type="audio/mpeg")
