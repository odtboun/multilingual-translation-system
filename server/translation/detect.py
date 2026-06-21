"""
Language Detection — heuristic multi-language detection for two-speaker mode.

Strategy (layered, <1ms):
  1. Unicode script ranges → instant detection for non-Latin scripts
  2. Unique Latin characters → instant per-language match
  3. Shared Latin characters → scored comparison
  4. Stopword matching → tiebreaker for Latin-script languages
  5. Default: English
"""
from __future__ import annotations

# ── Layer 2: Latin character profiles ─────────────────────────
LATIN_PROFILES: list[tuple[str, set[str], set[str]]] = [
    ("de", set("ßẞ"), set("äöüßÄÖÜẞ")),
    ("fr", set("âæœûùÿÀÂÆŒÙ"), set("àâæçéèêëîïôœùûüÿÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ")),
    ("es", set("ñÑ¿¡"), set("áéíóúüñÁÉÍÓÚÜÑ¿¡")),
    ("pt", set("ãõÃÕ"), set("áâãàçéêíóôõúüÁÂÃÀÇÉÊÍÓÔÕÚÜ")),
    ("it", set("ìòÌÒ"), set("àèéìòùÀÈÉÌÒÙ")),
    ("tr", set("çğışÇĞİŞ"), set("çğıöşüÇĞİÖŞÜ")),
]

# ── Layer 3: Stopword sets ────────────────────────────────────
STOPWORDS: dict[str, set[str]] = {
    "en": {"the","is","are","was","were","be","been","being","have","has","had",
           "do","does","did","will","would","can","could","should","may","might",
           "a","an","and","but","or","if","because","as","until","while","of",
           "at","by","for","with","about","to","from","in","on","my","your",
           "his","her","our","their","me","you","him","us","them","what","which",
           "who","where","when","how","why","please","thank","sorry","yes","no",
           "not","here","there","this","that","flight","gate","boarding","passport",
           "baggage","delay","help","terminal","check","transfer","visa","seat"},
    "tr": {"ve","bir","bu","için","değil","ama","ile","evet","hayır","lütfen",
           "teşekkür","ederim","yok","var","biniş","uçuş","kartı","bagaj","sıra",
           "nerede","nasıl","neden","hangi","kadar","sonra","önce","şimdi","burada",
           "orada","kalkış","iniş","gecikme","rötar","kapı","pasaport","bilet",
           "yolcu","aktarma","valiz","bekleyin","geçin","gidin","gelin","oturun",
           "buyrun","kontrol","yardım","acil","çıkış","giriş","kayıp"},
    "de": {"der","die","das","ist","sind","war","waren","haben","hat","hatte",
           "ein","eine","einen","einem","und","oder","aber","wenn","weil","als",
           "bis","für","mit","auf","aus","bei","von","zu","in","an","ich","du",
           "er","sie","es","wir","ihr","mein","dein","sein","ihr","unser","bitte",
           "danke","ja","nein","nicht","hier","dort","flug","gate","pass","gepäck"},
    "fr": {"le","la","les","est","sont","était","étaient","avoir","a","avait",
           "un","une","des","et","ou","mais","si","parce","que","comme","jusqu",
           "pour","avec","sur","dans","par","de","du","je","tu","il","elle",
           "nous","vous","ils","mon","ton","son","notre","votre","leur","s'il",
           "merci","oui","non","pas","ici","là","vol","porte","passeport","bagage"},
    "es": {"el","la","los","las","es","son","era","eran","tener","tiene","tenía",
           "un","una","unos","y","o","pero","si","porque","como","hasta","para",
           "con","en","por","de","del","yo","tú","él","ella","nosotros","ellos",
           "mi","tu","su","nuestro","por favor","gracias","sí","no","aquí","allí",
           "vuelo","puerta","pasaporte","equipaje","asiento","retraso","ayuda"},
    "it": {"il","la","i","le","è","sono","era","erano","avere","ha","aveva",
           "un","una","un'","e","o","ma","se","perché","come","fino","per","con",
           "su","in","da","di","del","io","tu","lui","lei","noi","voi","loro",
           "mio","tuo","suo","nostro","grazie","sì","no","qui","lì","volo",
           "gate","passaporto","bagaglio","posto","ritardo","aiuto"},
    "pt": {"o","a","os","as","é","são","era","eram","ter","tem","tinha","um",
           "uma","uns","e","ou","mas","se","porque","como","até","para","com",
           "em","por","de","do","da","eu","tu","ele","ela","nós","eles","meu",
           "teu","seu","nosso","obrigado","sim","não","aqui","ali","voo","portão",
           "passaporte","bagagem","assento","atraso","ajuda"},
    "nl": {"de","het","een","is","zijn","was","waren","hebben","heeft","had",
           "en","of","maar","als","omdat","tot","voor","met","op","in","door",
           "van","ik","jij","hij","zij","wij","jullie","mijn","jouw","zijn",
           "onze","dank","ja","nee","niet","hier","daar","vlucht","gate",
           "paspoort","bagage","stoel","vertraging","hulp"},
}

# ── BCP-47 mapping ────────────────────────────────────────────
LANG_TO_BCP47: dict[str, str] = {
    "en": "en-US", "tr": "tr-TR", "ar": "ar-SA", "ru": "ru-RU",
    "de": "de-DE", "fr": "fr-FR", "zh": "zh-CN", "es": "es-ES",
    "it": "it-IT", "fa": "fa-IR", "ja": "ja-JP", "ko": "ko-KR",
    "pt": "pt-PT", "nl": "nl-NL", "hi": "hi-IN",
}


def detect_language(text: str) -> str:
    """Detect language from text. Returns ISO 639-1 code. Default: 'en'."""
    if not text or not text.strip():
        return "en"

    # Layer 1: Unicode script — scan all chars, decide holistically
    has_cjk = False
    has_kana = False
    for ch in text:
        cp = ord(ch)
        if 0x0600 <= cp <= 0x06FF:
            if any(ord(c) in (0x067E, 0x0686, 0x0698, 0x06AF) for c in text):
                return "fa"
            return "ar"
        if 0x3040 <= cp <= 0x30FF:
            has_kana = True
        if 0xAC00 <= cp <= 0xD7AF:
            return "ko"
        if 0x0900 <= cp <= 0x097F:
            return "hi"
        if 0x0400 <= cp <= 0x04FF:
            return "ru"
        if 0x4E00 <= cp <= 0x9FFF:
            has_cjk = True
    if has_kana:
        return "ja"
    if has_cjk:
        return "zh"

    # Layer 2: Latin characters — unique wins instantly, shared = scoring
    text_chars = set(text)
    for lang, unique, _all in LATIN_PROFILES:
        if text_chars & unique:
            return lang

    best_lang = "en"
    best_score = 0
    for lang, _unique, all_chars in LATIN_PROFILES:
        score = len(text_chars & all_chars)
        if score > best_score:
            best_score = score
            best_lang = lang
    if best_score >= 2:
        return best_lang

    # Layer 3: Stopwords
    text_lower = text.lower()
    words = set(text_lower.split())
    for lang, stopwords in STOPWORDS.items():
        if lang in ("ar", "fa", "zh", "ja", "ko", "hi", "ru"):
            continue
        score = len(words & stopwords)
        if score > best_score:
            best_score = score
            best_lang = lang

    return best_lang if best_score > 0 else "en"
