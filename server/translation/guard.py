"""
Terminology Guard — post-processing layer that enforces canonical aviation terms.

DESIGN PRINCIPLE:
The guard corrects terminology ONLY when it's clearly a mistranslation of an
aviation term. It must NOT corrupt the meaning of the translation. A word
like "wait" in "You've made us wait" is NOT a forbidden term — it's normal English.
The guard only acts on multi-word phrases or clearly domain-specific terms.
"""

from __future__ import annotations

import re
from typing import Optional

from server.models import GuardCorrection
from server.glossary.loader import glossary_store


# Minimum length for a forbidden term to be auto-replaced.
# Single common words like "wait", "bags", "late" cause too many false positives.
MIN_FORBIDDEN_LENGTH = 5


def guard_translation(
    translation: str,
    source_text: str,
    source_lang: str = "tr",
    target_lang: str = "en",
    context_tag: Optional[str] = None,
) -> tuple[str, list[GuardCorrection]]:
    """
    Apply terminology guard to a translation.
    Returns (guarded_translation, list_of_corrections).
    """
    corrections: list[GuardCorrection] = []
    guarded = translation

    # --- LAYER 1: Forbidden term replacement ---
    forbidden_hits = glossary_store.find_forbidden_in_text(guarded)

    for forbidden_term, canonical in forbidden_hits:
        # Skip very short forbidden terms — they cause false positives.
        # "wait", "bags", "late", "bus" etc. are common English words.
        if len(forbidden_term) < MIN_FORBIDDEN_LENGTH:
            continue

        # Use word-boundary matching, allow optional plural 's' suffix
        pattern = re.compile(r'\b' + re.escape(forbidden_term) + r's?\b', re.IGNORECASE)
        match = pattern.search(guarded)

        if match:
            found_text = match.group()
            replacement = canonical.term_en if target_lang == "en" else canonical.term_tr

            # Preserve capitalization of the first character
            if found_text[0].isupper():
                replacement = replacement[0].upper() + replacement[1:]

            guarded = pattern.sub(replacement, guarded, count=1)
            corrections.append(GuardCorrection(
                original=found_text,
                corrected=replacement,
                term_id=canonical.id,
                reason="Forbidden alternative replaced with canonical term",
            ))

    # --- LAYER 2: Numeric preservation ---
    source_flights = set(re.findall(r'[A-Z]{2}\s?\d{3,4}', source_text, re.IGNORECASE))
    translation_flights = set(re.findall(r'[A-Z]{2}\s?\d{3,4}', guarded, re.IGNORECASE))

    for flight in source_flights:
        normalized = flight.replace(" ", "").upper()
        found = any(tf.replace(" ", "").upper() == normalized for tf in translation_flights)
        if not found and normalized not in guarded.upper().replace(" ", ""):
            corrections.append(GuardCorrection(
                original="(missing)",
                corrected=normalized,
                reason=f"Flight code {normalized} from source not found in translation",
            ))

    source_gates = set(re.findall(r'[A-Z]\d{1,3}', source_text))
    for gate in source_gates:
        if gate not in guarded:
            corrections.append(GuardCorrection(
                original="(missing)",
                corrected=gate,
                reason=f"Gate code {gate} from source not found in translation",
            ))

    # --- LAYER 3: Row range formatting (boarding context) ---
    if context_tag in ("BOARDING", "GATE"):
        row_pattern = re.compile(r'rows?\s+(\d+)\s*[-\u2013]\s*(\d+)', re.IGNORECASE)
        match = row_pattern.search(guarded)
        if match:
            old = match.group()
            row_start, row_end = match.group(1), match.group(2)
            prefix = "rows" if old.lower().startswith("rows") else "row"
            new = f"{prefix} {row_start} through {row_end}"
            if old != new:
                guarded = guarded[:match.start()] + new + guarded[match.end():]
                corrections.append(GuardCorrection(
                    original=old,
                    corrected=new,
                    reason="Row range normalized to canonical format",
                ))

    return guarded, corrections
