"""
Voice endpoints for STT and TTS using fal.ai.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
import httpx
import base64
from server.config import settings

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class TTSRequest(BaseModel):
    text: str
    target_lang: str = "en"

@router.post("/stt")
async def stt(audio: UploadFile = File(...)):
    """Transcribes audio using fal-ai/whisper."""
    if not settings.FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")

    content = await audio.read()
    # Convert audio to base64
    base64_audio = base64.b64encode(content).decode("utf-8")
    audio_url = f"data:{audio.content_type};base64,{base64_audio}"

    url = "https://queue.fal.run/fal-ai/whisper"
    headers = {
        "Authorization": f"Key {settings.FAL_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "audio_url": audio_url,
        "task": "transcribe"
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"FAL API error: {resp.text}")
        
        # Wait for the result
        result_url = resp.json().get("status_url")
        while True:
            status_resp = await client.get(result_url, headers=headers)
            status_data = status_resp.json()
            if status_data["status"] == "COMPLETED":
                # Assuming the result has a 'text' field
                return {"text": status_data["response"]["text"]}
            elif status_data["status"] == "FAILED":
                raise HTTPException(status_code=500, detail="STT failed")

@router.post("/tts")
async def tts(request: TTSRequest):
    """Generates speech using ElevenLabs on fal.ai."""
    if not settings.FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")

    url = "https://queue.fal.run/fal-ai/elevenlabs/tts/turbo-v2.5"
    headers = {
        "Authorization": f"Key {settings.FAL_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "text": request.text
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"FAL API error: {resp.text}")
        
        # Wait for the result
        result_url = resp.json().get("status_url")
        while True:
            status_resp = await client.get(result_url, headers=headers)
            status_data = status_resp.json()
            if status_data["status"] == "COMPLETED":
                # Assuming the result has an 'audio' field with a URL
                audio_file_url = status_data["response"]["audio"]["url"]
                return {"audio_url": audio_file_url}
            elif status_data["status"] == "FAILED":
                raise HTTPException(status_code=500, detail="TTS failed")
