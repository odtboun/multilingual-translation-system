"""
Glossary Search — context-aware term retrieval for the translation pipeline.

DESIGN PRINCIPLE:
Only inject terms that are ACTUALLY RELEVANT to the input text.
Injecting too many terms distracts the LLM from faithful translation.
"""

from __future__ import annotations
from typing import Optional

from server.glossary.loader import glossary_store
from server.models import GlossaryTerm


def retrieve_terms_for_input(
    text: str,
    context_tag: Optional[str] = None,
    max_terms: int = 10,
) -> list[GlossaryTerm]:
    """
    Retrieve glossary terms that are ACTUALLY PRESENT in the input text.

    Strategy:
    1. Find terms whose Turkish form appears in the input text
    2. Score by priority and context relevance
    3. Return ONLY matching terms — never dump unrelated context terms

    If no terms match, return an empty list. The LLM can translate
    perfectly fine without glossary hints for everyday speech.
    """
    # Find terms present in the input
    matched = glossary_store.search_turkish(text)

    if not matched:
        # No matches = no glossary injection.
        # The LLM should just translate faithfully.
        return []

    # Score and sort
    def score(term: GlossaryTerm) -> int:
        s = 0
        if term.priority == "CRITICAL":
            s += 100
        elif term.priority == "HIGH":
            s += 50
        elif term.priority == "MEDIUM":
            s += 10

        # Boost if term matches the active context
        if context_tag and context_tag in term.context_tags:
            s += 30

        # Boost longer terms (more specific matches)
        s += len(term.term_tr)

        return s

    matched.sort(key=score, reverse=True)
    return matched[:max_terms]


def format_terms_for_prompt(terms: list[GlossaryTerm]) -> str:
    """
    Format glossary terms into a compact string for the LLM prompt.
    Only includes the essential mapping — not overwhelming detail.
    """
    if not terms:
        return ""

    lines = []
    for term in terms:
        line = f'- "{term.term_tr}" → "{term.term_en}"'
        if term.forbidden_alternatives:
            forbidden = ", ".join(f'"{f}"' for f in term.forbidden_alternatives[:3])
            line += f" (NOT {forbidden})"
        lines.append(line)

    return "\n".join(lines)
