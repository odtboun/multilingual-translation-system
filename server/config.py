"""
Configuration — loads environment variables and provides typed settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    """Application settings loaded from environment."""

    # fal.ai / OpenRouter
    FAL_KEY: str = os.getenv("FAL_KEY", "")
    FAL_BASE_URL: str = "https://fal.run/openrouter/router/openai/v1"
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "google/gemini-2.5-flash")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "anthropic/claude-sonnet-4")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Paths
    GLOSSARY_PATH: Path = PROJECT_ROOT / "corpus" / "aviation_glossary.yaml"
    DEBUG_UI_PATH: Path = PROJECT_ROOT / "debug-ui"

    # Translation defaults
    MAX_CONTEXT_TURNS: int = 10
    DEFAULT_SOURCE_LANG: str = "tr"
    DEFAULT_TARGET_LANG: str = "en"

    # Guard settings
    GUARD_ENABLED: bool = True

    @property
    def fal_headers(self) -> dict:
        return {
            "Authorization": f"Key {self.FAL_KEY}",
            "Content-Type": "application/json",
        }


settings = Settings()
