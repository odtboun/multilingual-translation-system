"""
Language Detection — heuristic Turkish vs English detection for two-speaker mode.

Strategy: Turkish has unique characters (çğıöşü) and common aviation stopwords
that make detection trivial and instant (<1ms). No LLM call needed.
"""
from __future__ import annotations

TURKISH_CHARS = set("çğıöşüÇĞİÖŞÜ")
TURKISH_STOPWORDS = {
    "ve", "bir", "bu", "için", "değil", "ama", "ile", "evet", "hayır",
    "lütfen", "teşekkür", "ederim", "yok", "var", "biniş", "uçuş",
    "kartı", "bagaj", "sıra", "nerede", "nasıl", "neden", "hangi",
    "kadar", "sonra", "önce", "şimdi", "burada", "şurada", "orada",
    "kalkış", "iniş", "gecikme", "rötar", "kapı", "pasaport",
    "bilet", "yolcu", "aktarma", "valiz", "bekleyin", "geçin",
    "gidin", "gelin", "oturun", "buyrun", "kontrol", "yardım",
    "acil", "çıkış", "giriş", "kayıp", "bulamıyorum",
}

ENGLISH_STOPWORDS = {
    "the", "is", "are", "am", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would",
    "can", "could", "should", "may", "might", "shall", "must",
    "a", "an", "and", "but", "or", "if", "because", "as", "until",
    "while", "of", "at", "by", "for", "with", "about", "to", "from",
    "in", "on", "my", "your", "his", "her", "its", "our", "their",
    "me", "you", "him", "us", "them", "what", "which", "who",
    "where", "when", "how", "why", "please", "thank", "sorry",
    "yes", "no", "not", "here", "there", "this", "that",
    "flight", "gate", "boarding", "passport", "baggage", "delay",
    "help", "where", "terminal", "check", "transfer", "visa",
}


def detect_language(text: str) -> str:
    """Detect whether text is Turkish ('tr') or English ('en').

    Uses a weighted heuristic:
    1. Turkish-specific characters (çğıöşü) → very strong signal
    2. Turkish stopwords → moderate signal
    3. English stopwords → moderate signal
    4. Default: English (airport context — most passenger queries are non-Turkish)
    """
    if not text or not text.strip():
        return "en"

    text_lower = text.lower()
    words = set(text_lower.split())

    # Layer 1: Turkish characters (very high precision)
    turkish_char_count = sum(1 for c in text if c in TURKISH_CHARS)
    if turkish_char_count >= 2:
        return "tr"

    # Layer 2: Count stopword matches
    turkish_hits = len(words & TURKISH_STOPWORDS)
    english_hits = len(words & ENGLISH_STOPWORDS)

    # Layer 3: Weighted comparison
    # Give Turkish a slight edge (the agent/employee speaks Turkish more often)
    score = turkish_hits * 2 - english_hits

    if score > 0:
        return "tr"

    # Layer 4: If Turkish chars present even once with no strong English signal
    if turkish_char_count >= 1 and english_hits == 0:
        return "tr"

    return "en"
