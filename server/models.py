"""
Pydantic data models for the translation system.
"""

from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Touchpoint(str, Enum):
    """Operational context — where in the airport the agent is."""
    CHECK_IN = "CHECK_IN"
    SECURITY = "SECURITY"
    PASSPORT = "PASSPORT"
    BOARDING = "BOARDING"
    GATE = "GATE"
    TRANSFER = "TRANSFER"
    BAGGAGE = "BAGGAGE"
    DELAY = "DELAY"
    IRREGULAR = "IRREGULAR"
    DIRECTIONS = "DIRECTIONS"
    EMERGENCY = "EMERGENCY"
    GENERAL = "GENERAL"


class TermPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"


class Language(str, Enum):
    TR = "tr"
    EN = "en"
    AR = "ar"
    RU = "ru"
    DE = "de"
    FR = "fr"
    ZH = "zh"
    ES = "es"
    IT = "it"
    FA = "fa"
    JA = "ja"
    KO = "ko"
    PT = "pt"
    NL = "nl"


LANGUAGE_NAMES = {
    "tr": "Turkish",
    "en": "English",
    "ar": "Arabic",
    "ru": "Russian",
    "de": "German",
    "fr": "French",
    "zh": "Chinese",
    "es": "Spanish",
    "it": "Italian",
    "fa": "Persian",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "nl": "Dutch",
}


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class FlightContext(BaseModel):
    """Optional flight-level context."""
    flight: Optional[str] = Field(None, description="Flight number, e.g. TK1234")
    gate: Optional[str] = Field(None, description="Gate assignment, e.g. A12")
    destination: Optional[str] = Field(None, description="Destination city or code")
    destination_code: Optional[str] = Field(None, description="IATA destination code, e.g. LHR")
    status: Optional[str] = Field(None, description="Flight status: BOARDING, DELAYED, etc.")
    boarding_rows: Optional[str] = Field(None, description="Currently boarding rows, e.g. 15-25")


class TranslationContext(BaseModel):
    """Full operational context for a translation."""
    touchpoint: Touchpoint = Field(Touchpoint.GENERAL, description="Airport touchpoint")
    flight: Optional[FlightContext] = None
    session_id: Optional[str] = Field(None, description="Session ID for multi-turn context")


class TranslateRequest(BaseModel):
    """Incoming translation request."""
    text: str = Field(..., description="Source text to translate")
    source_lang: str = Field("tr", description="Source language code")
    target_lang: str = Field("en", description="Target language code")
    context: Optional[TranslationContext] = None
    model: Optional[str] = Field(None, description="Override the default LLM model")


class GuardCorrection(BaseModel):
    """A single terminology correction made by the guard."""
    original: str
    corrected: str
    term_id: Optional[str] = None
    reason: str


class TranslateResponse(BaseModel):
    """Translation result with full pipeline metadata."""
    model_config = {"protected_namespaces": ()}

    translation: str
    raw_translation: str = Field(..., description="LLM output before guard processing")
    source_text: str
    source_lang: str
    target_lang: str
    touchpoint: str
    model_used: str
    latency_ms: float
    glossary_terms_injected: int
    guard_corrections: list[GuardCorrection] = []
    guard_active: bool = True
    context_used: Optional[TranslationContext] = None
    notes: list[str] = Field(default_factory=list, description="Ambiguity notes or recommendations")


# ---------------------------------------------------------------------------
# Glossary Models
# ---------------------------------------------------------------------------

class GlossaryExample(BaseModel):
    context: str
    usage_tr: str
    usage_en: str


class GlossaryTerm(BaseModel):
    """A single term in the aviation glossary."""
    id: str
    term_tr: str
    term_en: str
    canonical: bool = True
    context_tags: list[str] = []
    forbidden_alternatives: list[str] = []
    category: Optional[str] = None
    priority: TermPriority = TermPriority.MEDIUM
    examples: list[GlossaryExample] = []


# ---------------------------------------------------------------------------
# Debug Models
# ---------------------------------------------------------------------------

class BatchTestItem(BaseModel):
    text: str
    source_lang: str = "tr"
    target_lang: str = "en"
    context: Optional[TranslationContext] = None
    expected_contains: Optional[list[str]] = None
    expected_not_contains: Optional[list[str]] = None


class BatchTestRequest(BaseModel):
    items: list[BatchTestItem]
    model: Optional[str] = None


class BatchTestResult(BaseModel):
    item: BatchTestItem
    response: TranslateResponse
    passed: bool
    failure_reasons: list[str] = []


class ContextCompareRequest(BaseModel):
    text: str
    source_lang: str = "tr"
    target_lang: str = "en"
    touchpoints: list[Touchpoint] = [
        Touchpoint.CHECK_IN,
        Touchpoint.BOARDING,
        Touchpoint.SECURITY,
        Touchpoint.TRANSFER,
    ]
