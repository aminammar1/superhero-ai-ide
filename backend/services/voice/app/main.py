import asyncio
from collections.abc import AsyncIterator

import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File
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

    client = httpx.AsyncClient(timeout=180.0)
    req = client.build_request(
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
    )
    
    response = await client.send(req, stream=True)
    
    if response.is_error:
        detail = await response.aread()
        await client.aclose()
        raise HTTPException(response.status_code, detail.decode())

    async def streamer() -> AsyncIterator[bytes]:
        try:
            async for chunk in response.aiter_bytes():
                yield chunk
        finally:
            await response.aclose()
            await client.aclose()

    return StreamingResponse(streamer(), media_type="audio/mpeg")


@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    if not settings.assemblyai_api_key:
        raise HTTPException(
            status_code=503,
            detail="AssemblyAI is not configured. Set ASSEMBLYAI_API_KEY.",
        )

    audio_bytes = await file.read()
    if len(audio_bytes) < 500:
        raise HTTPException(400, "Audio file too small – recording may have failed.")

    headers = {"authorization": settings.assemblyai_api_key}

    async with httpx.AsyncClient(timeout=120.0) as client:
        # 1. Upload audio
        upload_res = await client.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            content=audio_bytes,
        )
        if upload_res.is_error:
            raise HTTPException(
                502,
                f"AssemblyAI upload failed ({upload_res.status_code}): {upload_res.text}",
            )
        upload_url = upload_res.json().get("upload_url")
        if not upload_url:
            raise HTTPException(502, "AssemblyAI upload did not return an upload_url.")

        # 2. Request transcript
        transcript_req = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={**headers, "content-type": "application/json"},
            json={
                "audio_url": upload_url,
                "speech_models": ["universal-3-pro"],
            },
        )
        if transcript_req.is_error:
            raise HTTPException(
                502,
                f"AssemblyAI transcript request failed ({transcript_req.status_code}): {transcript_req.text}",
            )
        transcript_id = transcript_req.json().get("id")
        if not transcript_id:
            raise HTTPException(502, "AssemblyAI did not return a transcript ID.")

        # 3. Poll for result (typical voice snippets complete in < 5 seconds)
        for attempt in range(30):
            await asyncio.sleep(1.0)
            poll_res = await client.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers=headers,
            )
            if poll_res.is_error:
                continue  # Retry on transient network errors

            data = poll_res.json()
            status = data.get("status")

            if status == "completed":
                text = data.get("text", "").strip()
                if not text:
                    return {"transcript": ""}
                return {"transcript": text}
            elif status == "error":
                raise HTTPException(
                    500,
                    f"AssemblyAI Error: {data.get('error', 'Unknown error')}",
                )

        raise HTTPException(504, "Transcript timed out after 30 seconds.")
