"""
Translation Engine — orchestrates the full translation pipeline.
"""

from __future__ import annotations

import time
from typing import Optional

from server.config import settings
from server.models import (
    TranslateRequest, TranslateResponse, TranslationContext, Touchpoint,
)
from server.translation.llm import llm_client
from server.translation.prompts import build_system_prompt
from server.translation.guard import guard_translation
from server.translation.context import context_manager
from server.glossary.search import retrieve_terms_for_input, format_terms_for_prompt


async def translate(request: TranslateRequest) -> TranslateResponse:
    """
    Full translation pipeline:
    1. Glossary retrieval
    2. Prompt construction
    3. LLM call
    4. Terminology guard
    5. Session update
    """
    start = time.perf_counter()

    # Resolve context
    context = request.context or TranslationContext()
    touchpoint = context.touchpoint.value

    # Step 1: Retrieve relevant glossary terms
    terms = retrieve_terms_for_input(
        text=request.text,
        context_tag=touchpoint,
    )
    glossary_text = format_terms_for_prompt(terms)

    # Step 2: Build system prompt
    system_prompt = build_system_prompt(
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        glossary_text=glossary_text,
        context=context,
    )

    # Step 3: Add conversation history if session exists
    user_message = request.text
    if context.session_id:
        session = context_manager.get_or_create(context.session_id)
        history = session.get_history_text()
        if history:
            user_message = f"{history}\n\nNow translate: {request.text}"

    import json
    
    # Step 4: Call LLM
    model = request.model or settings.DEFAULT_MODEL
    llm_result = await llm_client.chat(
        system_prompt=system_prompt,
        user_message=user_message,
        model=model,
    )

    raw_response = llm_result["content"]
    
    # Clean markdown if present
    cleaned_response = raw_response.strip()
    if cleaned_response.startswith("```json"):
        cleaned_response = cleaned_response[7:]
    elif cleaned_response.startswith("```"):
        cleaned_response = cleaned_response[3:]
    if cleaned_response.endswith("```"):
        cleaned_response = cleaned_response[:-3]
        
    try:
        parsed = json.loads(cleaned_response.strip())
        raw_translation = parsed.get("translation", raw_response)
        notes = parsed.get("notes", [])
    except json.JSONDecodeError:
        # Fallback if LLM failed to output JSON
        raw_translation = raw_response
        notes = []

    # Step 5: Apply terminology guard
    if settings.GUARD_ENABLED:
        guarded_translation, corrections = guard_translation(
            translation=raw_translation,
            source_text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            context_tag=touchpoint,
        )
    else:
        guarded_translation = raw_translation
        corrections = []

    # Step 6: Update session context
    if context.session_id:
        session = context_manager.update_session(context.session_id, context)
        session.add_turn(request.text, guarded_translation)

    elapsed_ms = (time.perf_counter() - start) * 1000

    return TranslateResponse(
        translation=guarded_translation,
        raw_translation=raw_translation,
        source_text=request.text,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        touchpoint=touchpoint,
        model_used=llm_result.get("model", model),
        latency_ms=round(elapsed_ms, 1),
        glossary_terms_injected=len(terms),
        guard_corrections=corrections,
        guard_active=settings.GUARD_ENABLED,
        context_used=context,
        notes=notes,
    )
