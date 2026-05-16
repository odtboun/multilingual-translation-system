"""
Tests for the glossary loader and search.
"""

import pytest
from pathlib import Path

from server.glossary.loader import glossary_store
from server.glossary.search import retrieve_terms_for_input, format_terms_for_prompt
from server.config import settings


@pytest.fixture(autouse=True, scope="module")
def load_glossary():
    if not glossary_store.loaded:
        glossary_store.load(settings.GLOSSARY_PATH)


class TestGlossaryLoading:
    def test_glossary_is_loaded(self):
        assert glossary_store.loaded is True

    def test_has_terms(self):
        assert glossary_store.term_count > 50

    def test_stats(self):
        stats = glossary_store.stats()
        assert stats["total_terms"] > 0
        assert stats["by_priority"]["CRITICAL"] > 0
        assert stats["total_forbidden_alternatives"] > 0


class TestGlossarySearch:
    def test_search_turkish_exact(self):
        results = glossary_store.search_turkish("biniş kartı")
        term_ids = [t.id for t in results]
        assert "TRM-0001" in term_ids

    def test_search_turkish_in_sentence(self):
        results = glossary_store.search_turkish("Biniş kartınızı hazırlayın lütfen")
        term_trs = [t.term_tr for t in results]
        assert "biniş kartı" in term_trs

    def test_search_english(self):
        results = glossary_store.search_english("boarding pass")
        assert len(results) > 0
        assert results[0].term_en == "boarding pass"

    def test_forbidden_detection(self):
        found = glossary_store.find_forbidden_in_text("Please scan your boarding card")
        assert len(found) > 0
        forbidden_term, canonical = found[0]
        assert forbidden_term == "boarding card"
        assert canonical.term_en == "boarding pass"

    def test_get_terms_for_context(self):
        boarding_terms = glossary_store.get_terms_for_context("BOARDING")
        assert len(boarding_terms) > 5

    def test_get_critical_terms(self):
        critical = glossary_store.get_critical_terms()
        assert len(critical) > 10
        assert all(t.priority == "CRITICAL" for t in critical)

    def test_general_search(self):
        results = glossary_store.search_query("bagaj")
        assert len(results) > 0


class TestTermRetrieval:
    def test_retrieves_matching_terms(self):
        terms = retrieve_terms_for_input("Biniş kartınızı hazırlayın")
        term_trs = [t.term_tr for t in terms]
        assert "biniş kartı" in term_trs

    def test_context_boosting(self):
        terms_boarding = retrieve_terms_for_input("sıraya girin", context_tag="BOARDING")
        terms_checkin = retrieve_terms_for_input("sıraya girin", context_tag="CHECK_IN")
        # Both should return results but potentially different ordering
        assert len(terms_boarding) > 0 or len(terms_checkin) > 0

    def test_format_terms_for_prompt(self):
        terms = retrieve_terms_for_input("biniş kartı")
        formatted = format_terms_for_prompt(terms)
        assert "biniş kartı" in formatted
        assert "boarding pass" in formatted
        assert "NOT" in formatted  # Should have forbidden alternatives
