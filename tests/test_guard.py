"""
Tests for the terminology guard.
"""

import pytest
from pathlib import Path

# Load glossary before tests
from server.glossary.loader import glossary_store
from server.config import settings


@pytest.fixture(autouse=True, scope="module")
def load_glossary():
    """Ensure glossary is loaded for all guard tests."""
    if not glossary_store.loaded:
        glossary_store.load(settings.GLOSSARY_PATH)


class TestForbiddenTermReplacement:
    """Guard should replace forbidden alternatives with canonical terms."""

    def test_boarding_card_to_boarding_pass(self):
        from server.translation.guard import guard_translation
        text = "Please have your boarding cards ready"
        guarded, corrections = guard_translation(text, "Biniş kartınızı hazırlayın", target_lang="en")
        assert "boarding pass" in guarded.lower()
        assert "boarding card" not in guarded.lower()
        assert len(corrections) > 0

    def test_luggage_to_baggage(self):
        from server.translation.guard import guard_translation
        text = "Your luggage has been lost"
        guarded, corrections = guard_translation(text, "Bagajınız kayboldu", target_lang="en")
        assert "baggage" in guarded.lower()
        assert len(corrections) > 0

    def test_last_call_to_final_call(self):
        from server.translation.guard import guard_translation
        text = "Last call for flight TK1234"
        guarded, corrections = guard_translation(text, "Son çağrı TK1234", target_lang="en")
        assert "final call" in guarded.lower()
        assert "last call" not in guarded.lower()

    def test_no_corrections_for_canonical_text(self):
        from server.translation.guard import guard_translation
        text = "Please have your boarding pass ready"
        guarded, corrections = guard_translation(text, "Biniş kartınızı hazırlayın", target_lang="en")
        # Should find no forbidden terms
        forbidden_corrections = [c for c in corrections if "Forbidden" in c.reason]
        assert len(forbidden_corrections) == 0
        assert guarded == text

    def test_hand_luggage_to_carry_on_baggage(self):
        from server.translation.guard import guard_translation
        text = "Place your hand luggage in the overhead bin"
        guarded, corrections = guard_translation(text, "El bagajınızı üst dolaba koyun", target_lang="en")
        assert "carry-on baggage" in guarded.lower()

    def test_plane_to_aircraft(self):
        from server.translation.guard import guard_translation
        text = "The plane is delayed"
        guarded, corrections = guard_translation(text, "Uçak rötar yaptı", target_lang="en")
        assert "aircraft" in guarded.lower()
        assert "plane" not in guarded.lower()


class TestNumericPreservation:
    """Guard should verify numbers from source appear in translation."""

    def test_flight_code_preserved(self):
        from server.translation.guard import guard_translation
        source = "TK1234 seferi rötar yaptı"
        translation = "Flight TK1234 has been delayed"
        guarded, corrections = guard_translation(translation, source, target_lang="en")
        assert "TK1234" in guarded

    def test_gate_code_preserved(self):
        from server.translation.guard import guard_translation
        source = "Kapınız A12'den B04'e değiştirilmiştir"
        translation = "Your gate has changed from A12 to B04"
        guarded, corrections = guard_translation(translation, source, target_lang="en")
        assert "A12" in guarded
        assert "B04" in guarded

    def test_missing_gate_flagged(self):
        from server.translation.guard import guard_translation
        source = "Kapınız A12'den B04'e değiştirilmiştir"
        translation = "Your gate has been changed"  # Missing gate codes
        _, corrections = guard_translation(translation, source, target_lang="en")
        gate_corrections = [c for c in corrections if "Gate code" in c.reason]
        assert len(gate_corrections) > 0


class TestRowRangeFormatting:
    """Guard should normalize row ranges in boarding context."""

    def test_dash_to_through(self):
        from server.translation.guard import guard_translation
        text = "Passengers in rows 15-25 may now board"
        guarded, corrections = guard_translation(
            text, "15-25 sıralar", target_lang="en", context_tag="BOARDING"
        )
        assert "rows 15 through 25" in guarded

    def test_already_canonical_format(self):
        from server.translation.guard import guard_translation
        text = "Passengers in rows 15 through 25 may now board"
        guarded, corrections = guard_translation(
            text, "15-25 sıralar", target_lang="en", context_tag="BOARDING"
        )
        assert guarded == text
        row_corrections = [c for c in corrections if "Row range" in c.reason]
        assert len(row_corrections) == 0
