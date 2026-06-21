"""
Voice endpoints for STT, TTS, and language detection using fal.ai.
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import httpx
import base64
from server.config import settings

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class TTSRequest(BaseModel):
    text: str
    target_lang: str = "en"


def _fal_headers():
    return {
        "Authorization": f"Key {settings.FAL_KEY}",
        "Content-Type": "application/json",
    }


async def _poll_fal(url: str, timeout: float = 30.0):
    """Submit to fal.ai queue and poll until complete."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
        resp = await client.post(url, json={}, headers=_fal_headers())
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"FAL error: {resp.text}")
        result_url = resp.json().get("status_url")
        while True:
            sr = await client.get(result_url, headers=_fal_headers())
            sd = sr.json()
            if sd["status"] == "COMPLETED":
                return sd["response"]
            if sd["status"] == "FAILED":
                raise HTTPException(status_code=500, detail="FAL job failed")


@router.post("/stt")
async def stt(audio: UploadFile = File(...)):
    """Transcribe audio using fal-ai/whisper."""
    if not settings.FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")
    content = await audio.read()
    audio_url = f"data:{audio.content_type};base64,{base64.b64encode(content).decode()}"
    payload = {"audio_url": audio_url, "task": "transcribe"}
    result = await _poll_fal("https://queue.fal.run/fal-ai/whisper")
    return {"text": result.get("text", "")}


@router.post("/tts")
async def tts(request: TTSRequest):
    """Generate speech using ElevenLabs on fal.ai."""
    if not settings.FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")
    result = await _poll_fal("https://queue.fal.run/fal-ai/elevenlabs/tts/turbo-v2.5")
    return {"audio_url": result["audio"]["url"]}


@router.post("/detect-language")
async def detect_language_endpoint(audio: UploadFile = File(...)):
    """Detect language from ~1.5s audio chunk using fal.ai wizper.

    Returns detected language code and initial transcription.
    """
    if not settings.FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")

    content = await audio.read()
    audio_url = f"data:{audio.content_type};base64,{base64.b64encode(content).decode()}"
    payload = {"audio_url": audio_url, "task": "transcribe", "language": None}

    result = await _poll_fal("https://queue.fal.run/fal-ai/wizper")
    return {
        "language": (result.get("language") or "en").lower().strip(),
        "text": (result.get("text") or "").strip(),
    }
