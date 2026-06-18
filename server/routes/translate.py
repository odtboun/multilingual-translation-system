"""Translation API routes."""
from fastapi import APIRouter
from server.models import TranslateRequest, TranslateResponse
from server.translation.engine import translate
from server.translation.detect import detect_language

router = APIRouter(prefix="/api", tags=["translation"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """Directed translation: source_lang → target_lang, optional context."""
    return await translate(request)


@router.post("/translate/conversation", response_model=TranslateResponse)
async def translate_conversation(request: TranslateRequest):
    """Two-speaker mode: auto-detect source language, translate to the opposite.

    Detects whether the input is Turkish or English, sets the target to the
    other language. Stores turns in the session for multi-turn context.
    """
    detected = detect_language(request.text)
    request.source_lang = detected
    request.target_lang = "en" if detected == "tr" else "tr"

    result = await translate(request)
    # Override source_lang in response to reflect auto-detection
    result.source_lang = detected
    return result
