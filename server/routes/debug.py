"""
Debug API routes — batch testing, context comparison, health check.
"""

import asyncio
from fastapi import APIRouter

from server.config import settings
from server.models import (
    BatchTestRequest, BatchTestResult, ContextCompareRequest,
    TranslateRequest, TranslateResponse, TranslationContext,
    FlightContext, Touchpoint,
)
from server.translation.engine import translate
from server.translation.context import context_manager
from server.glossary.loader import glossary_store

router = APIRouter(prefix="/api/debug", tags=["debug"])


@router.post("/batch")
async def batch_test(request: BatchTestRequest):
    """
    Run a batch of translation tests.
    Returns results with pass/fail based on expected_contains/not_contains.
    """
    results: list[dict] = []

    for item in request.items:
        tr_request = TranslateRequest(
            text=item.text,
            source_lang=item.source_lang,
            target_lang=item.target_lang,
            context=item.context,
            model=request.model,
        )

        response = await translate(tr_request)

        # Check pass/fail
        passed = True
        failure_reasons = []

        if item.expected_contains:
            for expected in item.expected_contains:
                if expected.lower() not in response.translation.lower():
                    passed = False
                    failure_reasons.append(
                        f"Expected '{expected}' not found in translation"
                    )

        if item.expected_not_contains:
            for forbidden in item.expected_not_contains:
                if forbidden.lower() in response.translation.lower():
                    passed = False
                    failure_reasons.append(
                        f"Forbidden '{forbidden}' found in translation"
                    )

        results.append({
            "input": item.text,
            "translation": response.translation,
            "raw_translation": response.raw_translation,
            "passed": passed,
            "failure_reasons": failure_reasons,
            "guard_corrections": [c.model_dump() for c in response.guard_corrections],
            "latency_ms": response.latency_ms,
            "model_used": response.model_used,
            "glossary_terms_injected": response.glossary_terms_injected,
        })

    total = len(results)
    passed = sum(1 for r in results if r["passed"])

    return {
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": f"{(passed/total*100):.1f}%" if total > 0 else "N/A",
        "results": results,
    }


@router.post("/compare")
async def context_compare(request: ContextCompareRequest):
    """
    Translate the same phrase across different touchpoint contexts.
    Shows how context changes the translation.
    """
    results: list[dict] = []

    for touchpoint in request.touchpoints:
        tr_request = TranslateRequest(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            context=TranslationContext(touchpoint=touchpoint),
        )

        response = await translate(tr_request)

        results.append({
            "touchpoint": touchpoint.value,
            "translation": response.translation,
            "latency_ms": response.latency_ms,
            "guard_corrections": [c.model_dump() for c in response.guard_corrections],
        })

    return {
        "source_text": request.text,
        "source_lang": request.source_lang,
        "target_lang": request.target_lang,
        "comparisons": results,
    }


@router.get("/health")
async def health_check():
    """System health with configuration and glossary status."""
    return {
        "status": "ok",
        "glossary_loaded": glossary_store.loaded,
        "glossary_terms": glossary_store.term_count,
        "glossary_stats": glossary_store.stats(),
        "default_model": settings.DEFAULT_MODEL,
        "fallback_model": settings.FALLBACK_MODEL,
        "guard_enabled": settings.GUARD_ENABLED,
        "active_sessions": context_manager.active_sessions,
        "fal_key_configured": bool(settings.FAL_KEY),
    }
