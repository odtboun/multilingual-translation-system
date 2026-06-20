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

    def test_short_turkish(self):
        assert detect_language("teşekkür ederim") == "tr"
        assert detect_language("evet lütfen") == "tr"
        assert detect_language("hayır") == "tr"

    def test_turkish_no_special_chars(self):
        # Turkish words without special characters but with Turkish stopwords
        assert detect_language("nerede bu otobus") == "tr"  # "nerede" + "bu" = 2 TR stopwords
        assert detect_language("simdi nerede biniş") == "tr"  # "simdi" has no special char but "şimdi" would; "nerede" + "biniş" = 2 TR


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

    def test_english_aviation(self):
        assert detect_language("my boarding pass is lost") == "en"
        assert detect_language("where do I check in") == "en"
        assert detect_language("is flight TK1234 on time") == "en"
        assert detect_language("can I have a window seat") == "en"


class TestEdgeCases:
    def test_empty_string(self):
        assert detect_language("") == "en"

    def test_numbers_only(self):
        assert detect_language("1234") == "en"

    def test_mixed_but_turkish_dominant(self):
        assert detect_language("my biniş kartı nerede") == "tr"

    def test_single_turkish_char_defaults_en(self):
        result = detect_language("my gate is A12")
        assert result == "en"

    def test_airline_codes(self):
        assert detect_language("TK1234 nerede") == "tr"
        assert detect_language("where is TK1234") == "en"

    def test_web_speech_transcription_artifacts(self):
        """Web Speech API sometimes produces slightly garbled output."""
        # Turkish that Web Speech API might fumble
        assert detect_language("biniş kartı nızı hazırlayın") == "tr"  # extra space
        assert detect_language("uçuşunuz rötar yaptı") == "tr"
        # English short phrases
        assert detect_language("where is gate B04") == "en"
        assert detect_language("thank you very much") == "en"

    def test_longer_ambiguous(self):
        """Phrases with no strong signal in either direction."""
        # No Turkish chars, no TR stopwords, no EN stopwords → defaults to EN
        assert detect_language("I am lost") == "en"
        # Even mix: "I" is EN, "nerede" is TR → TR wins (2x weight)
        assert detect_language("I nerede") == "tr"

    def test_single_word_detection(self):
        assert detect_language("lütfen") == "tr"
        assert detect_language("help") == "en"
        assert detect_language("baggage") == "en"  # EN aviation stopword
        assert detect_language("bagaj") == "tr"    # TR stopword
