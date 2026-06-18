"""Tests for language detection."""
import pytest
from server.translation.detect import detect_language


class TestTurkishDetection:
    def test_turkish_characters(self):
        assert detect_language("sıraya giriniz lütfen") == "tr"
        assert detect_language("uçuş kartım kayıp") == "tr"
        assert detect_language("bağajımı nerede bulabilirim") == "tr"

    def test_turkish_stopwords(self):
        assert detect_language("bu kapı değişti mi") == "tr"
        assert detect_language("nerede biniş yapacağım") == "tr"

    def test_turkish_aviation_phrases(self):
        assert detect_language("biniş kartınızı hazırlayın") == "tr"
        assert detect_language("15 ile 25 sıralar arası yolcular biniş yapabilir") == "tr"
        assert detect_language("valizimi kaybettim yardım edin lütfen") == "tr"


class TestEnglishDetection:
    def test_english_common_phrases(self):
        assert detect_language("where is the boarding gate") == "en"
        assert detect_language("please help me find my baggage") == "en"
        assert detect_language("my flight is delayed what should I do") == "en"

    def test_english_short(self):
        assert detect_language("thank you") == "en"
        assert detect_language("yes please") == "en"
        assert detect_language("gate A12") == "en"

    def test_english_questions(self):
        assert detect_language("which gate for London") == "en"
        assert detect_language("is this the right terminal") == "en"
        assert detect_language("where can I find a taxi") == "en"


class TestEdgeCases:
    def test_empty_string(self):
        assert detect_language("") == "en"

    def test_numbers_only(self):
        assert detect_language("1234") == "en"

    def test_mixed_but_turkish_dominant(self):
        # Has Turkish characters → Turkish
        assert detect_language("my biniş kartı nerede") == "tr"

    def test_single_turkish_char_defaults_en(self):
        # One Turkish char but no stopwords, English stopwords present
        result = detect_language("my gate is A12")
        assert result == "en"

    def test_airline_codes(self):
        assert detect_language("TK1234 nerede") == "tr"
        assert detect_language("where is TK1234") == "en"
