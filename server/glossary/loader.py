"""
Glossary Loader — loads aviation terminology from YAML and indexes it.
"""

from __future__ import annotations

import yaml
from pathlib import Path
from typing import Optional

from server.models import GlossaryTerm, GlossaryExample


class GlossaryStore:
    """
    In-memory glossary store. Loads from YAML, provides indexed access.
    """

    def __init__(self):
        self._terms: list[GlossaryTerm] = []
        self._by_id: dict[str, GlossaryTerm] = {}
        self._by_tr: dict[str, list[GlossaryTerm]] = {}  # Turkish term → matching entries
        self._by_en: dict[str, list[GlossaryTerm]] = {}  # English term → matching entries
        self._forbidden_map: dict[str, GlossaryTerm] = {}  # forbidden alt → canonical term
        self._loaded = False

    @property
    def loaded(self) -> bool:
        return self._loaded

    @property
    def term_count(self) -> int:
        return len(self._terms)

    @property
    def all_terms(self) -> list[GlossaryTerm]:
        return self._terms

    def load(self, path: Path) -> None:
        """Load glossary from a YAML file."""
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        raw_terms = data.get("terms", [])
        self._terms = []
        self._by_id = {}
        self._by_tr = {}
        self._by_en = {}
        self._forbidden_map = {}

        for entry in raw_terms:
            # Parse examples
            examples = []
            for ex in entry.get("examples", []):
                examples.append(GlossaryExample(
                    context=ex.get("context", ""),
                    usage_tr=ex.get("usage_tr", ""),
                    usage_en=ex.get("usage_en", ""),
                ))

            term = GlossaryTerm(
                id=entry["id"],
                term_tr=entry["term_tr"],
                term_en=entry["term_en"],
                canonical=entry.get("canonical", True),
                context_tags=entry.get("context_tags", []),
                forbidden_alternatives=entry.get("forbidden_alternatives", []),
                category=entry.get("category"),
                priority=entry.get("priority", "MEDIUM"),
                examples=examples,
            )

            self._terms.append(term)
            self._by_id[term.id] = term

            # Index by Turkish term (lowercased)
            tr_key = term.term_tr.lower()
            self._by_tr.setdefault(tr_key, []).append(term)

            # Index by English term (lowercased)
            en_key = term.term_en.lower()
            self._by_en.setdefault(en_key, []).append(term)

            # Index forbidden alternatives → canonical
            for forbidden in term.forbidden_alternatives:
                self._forbidden_map[forbidden.lower()] = term

        self._loaded = True

    def get_by_id(self, term_id: str) -> Optional[GlossaryTerm]:
        return self._by_id.get(term_id)

    def search_turkish(self, text: str) -> list[GlossaryTerm]:
        """Find glossary terms whose Turkish form appears in the input text."""
        text_lower = text.lower()
        matches = []
        seen_ids = set()

        # Sort by term length descending (match longer phrases first)
        sorted_terms = sorted(self._terms, key=lambda t: len(t.term_tr), reverse=True)

        for term in sorted_terms:
            if term.id in seen_ids:
                continue
            if term.term_tr.lower() in text_lower:
                matches.append(term)
                seen_ids.add(term.id)

        return matches

    def search_english(self, text: str) -> list[GlossaryTerm]:
        """Find glossary terms whose English form appears in the output text."""
        text_lower = text.lower()
        matches = []
        seen_ids = set()

        sorted_terms = sorted(self._terms, key=lambda t: len(t.term_en), reverse=True)

        for term in sorted_terms:
            if term.id in seen_ids:
                continue
            if term.term_en.lower() in text_lower:
                matches.append(term)
                seen_ids.add(term.id)

        return matches

    def find_forbidden_in_text(self, text: str) -> list[tuple[str, GlossaryTerm]]:
        """
        Scan text for forbidden alternative terms.
        Returns list of (forbidden_term_found, canonical_glossary_term).
        """
        text_lower = text.lower()
        found = []

        # Sort by length descending to match longer phrases first
        sorted_forbidden = sorted(self._forbidden_map.keys(), key=len, reverse=True)

        for forbidden in sorted_forbidden:
            if forbidden in text_lower:
                found.append((forbidden, self._forbidden_map[forbidden]))

        return found

    def get_terms_for_context(self, context_tag: str) -> list[GlossaryTerm]:
        """Get all terms relevant to a specific touchpoint context."""
        return [t for t in self._terms if context_tag in t.context_tags]

    def get_critical_terms(self) -> list[GlossaryTerm]:
        """Get all CRITICAL priority terms."""
        return [t for t in self._terms if t.priority == "CRITICAL"]

    def search_query(self, query: str) -> list[GlossaryTerm]:
        """General search across Turkish terms, English terms, and IDs."""
        query_lower = query.lower()
        results = []
        seen = set()

        for term in self._terms:
            if term.id in seen:
                continue
            if (query_lower in term.term_tr.lower() or
                query_lower in term.term_en.lower() or
                query_lower in term.id.lower() or
                query_lower in (term.category or "").lower()):
                results.append(term)
                seen.add(term.id)

        return results

    def stats(self) -> dict:
        """Return glossary statistics."""
        by_priority = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0}
        by_category: dict[str, int] = {}
        total_forbidden = 0

        for term in self._terms:
            by_priority[term.priority] = by_priority.get(term.priority, 0) + 1
            cat = term.category or "UNCATEGORIZED"
            by_category[cat] = by_category.get(cat, 0) + 1
            total_forbidden += len(term.forbidden_alternatives)

        return {
            "total_terms": len(self._terms),
            "by_priority": by_priority,
            "by_category": by_category,
            "total_forbidden_alternatives": total_forbidden,
        }


# Singleton instance
glossary_store = GlossaryStore()
