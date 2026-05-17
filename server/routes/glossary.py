"""
Glossary API routes.
"""

from fastapi import APIRouter, Query

from server.glossary.loader import glossary_store

router = APIRouter(prefix="/api/glossary", tags=["glossary"])


@router.get("/search")
async def search_glossary(q: str = Query(..., description="Search query")):
    """Search the aviation glossary."""
    results = glossary_store.search_query(q)
    return {
        "query": q,
        "count": len(results),
        "terms": [t.model_dump() for t in results],
    }


@router.get("/stats")
async def glossary_stats():
    """Get glossary statistics."""
    return glossary_store.stats()


@router.get("/context/{context_tag}")
async def get_terms_by_context(context_tag: str):
    """Get all terms for a specific touchpoint context."""
    terms = glossary_store.get_terms_for_context(context_tag.upper())
    return {
        "context": context_tag.upper(),
        "count": len(terms),
        "terms": [t.model_dump() for t in terms],
    }


@router.get("/all")
async def get_all_terms():
    """Get all glossary terms."""
    return {
        "count": glossary_store.term_count,
        "terms": [t.model_dump() for t in glossary_store.all_terms],
    }
