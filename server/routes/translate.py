"""
Translation API routes.
"""

from fastapi import APIRouter

from server.models import TranslateRequest, TranslateResponse
from server.translation.engine import translate

router = APIRouter(prefix="/api", tags=["translation"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Translate text with aviation terminology compliance.

    Accepts source text, language pair, and optional operational context.
    Returns the guarded translation with full pipeline metadata.
    """
    return await translate(request)
