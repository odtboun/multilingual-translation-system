"""
FastAPI Application — entry point for the translation system.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from server.config import settings
from server.glossary.loader import glossary_store
from server.translation.llm import llm_client
from server.routes import translate, glossary, debug, voice


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # --- Startup ---
    print("=" * 60)
    print("  Aviation Translation System — Starting")
    print("=" * 60)

    # Load glossary
    if settings.GLOSSARY_PATH.exists():
        glossary_store.load(settings.GLOSSARY_PATH)
        stats = glossary_store.stats()
        print(f"  Glossary loaded: {stats['total_terms']} terms")
        print(f"    CRITICAL: {stats['by_priority'].get('CRITICAL', 0)}")
        print(f"    HIGH:     {stats['by_priority'].get('HIGH', 0)}")
        print(f"    MEDIUM:   {stats['by_priority'].get('MEDIUM', 0)}")
        print(f"    Forbidden alternatives: {stats['total_forbidden_alternatives']}")
    else:
        print(f"  WARNING: Glossary not found at {settings.GLOSSARY_PATH}")

    print(f"  Default model: {settings.DEFAULT_MODEL}")
    print(f"  Fallback model: {settings.FALLBACK_MODEL}")
    print(f"  Guard enabled: {settings.GUARD_ENABLED}")
    print(f"  FAL key: {'configured' if settings.FAL_KEY else 'MISSING'}")
    print("=" * 60)
    print(f"  Debug UI: http://localhost:{settings.PORT}/debug")
    print(f"  API docs: http://localhost:{settings.PORT}/docs")
    print("=" * 60)

    yield

    # --- Shutdown ---
    await llm_client.close()
    print("  Translation system shut down.")


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Aviation Translation System",
    description="Real-time multilingual translation for aviation ground operations",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
app.include_router(translate.router)
app.include_router(glossary.router)
app.include_router(debug.router)
app.include_router(voice.router)

# --- Static files (Debug UI) ---
debug_ui_path = settings.DEBUG_UI_PATH
if debug_ui_path.exists():
    app.mount("/static", StaticFiles(directory=str(debug_ui_path)), name="static")


@app.get("/debug")
async def serve_debug_ui():
    """Serve the debug interface."""
    index_path = debug_ui_path / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"error": "Debug UI not found", "path": str(index_path)}


@app.get("/")
async def root():
    """Root endpoint — system info."""
    return {
        "name": "Aviation Translation System",
        "version": "0.1.0",
        "debug_ui": f"http://localhost:{settings.PORT}/debug",
        "api_docs": f"http://localhost:{settings.PORT}/docs",
        "status": "running",
    }
