"""Tests for multi-language detection."""
import pytest
from server.translation.detect import detect_language, LANG_TO_BCP47


class TestScriptDetection:
    def test_arabic(self):
        assert detect_language("أين بوابة الطائرة") == "ar"
        assert detect_language("أين يمكنني إيجاد جواز سفري") == "ar"

    def test_persian(self):
        assert detect_language("گیت پرواز کجاست") == "fa"
        assert detect_language("گذرنامه من گم شده چمدان کجاست") == "fa"

    def test_russian(self):
        assert detect_language("Где выход на посадку") == "ru"
        assert detect_language("Мой рейс задерживается") == "ru"

    def test_chinese(self):
        assert detect_language("登机口在哪里") == "zh"
        assert detect_language("我的航班延误了") == "zh"

    def test_japanese(self):
        assert detect_language("搭乗口はどこですか") == "ja"
        assert detect_language("フライトが遅れています") == "ja"

    def test_korean(self):
        assert detect_language("탑승구가 어디예요") == "ko"
        assert detect_language("제 비행편이 지연되었습니다") == "ko"

    def test_hindi(self):
        assert detect_language("गेट कहाँ है") == "hi"
        assert detect_language("मेरी उड़ान में देरी हो गई है") == "hi"


class TestLatinScriptDetection:
    def test_turkish(self):
        assert detect_language("biniş kartınızı hazırlayın") == "tr"
        assert detect_language("uçuş kartım kayıp") == "tr"

    def test_german(self):
        assert detect_language("Wo ist das Gate") == "de"
        assert detect_language("Mein Flug ist verspätet können Sie helfen") == "de"
        assert detect_language("Entschuldigung wo ist der Ausgang") == "de"

    def test_french(self):
        assert detect_language("Où est la porte d'embarquement") == "fr"
        assert detect_language("Mon vol est retardé merci de m'aider") == "fr"
        assert detect_language("Je cherche ma valise elle est perdue") == "fr"

    def test_spanish(self):
        assert detect_language("Dónde está la puerta de embarque") == "es"
        assert detect_language("Mi vuelo está retrasado gracias") == "es"

    def test_italian(self):
        assert detect_language("Dov'è il gate per il volo") == "it"
        assert detect_language("Il mio volo è in ritardo grazie") == "it"

    def test_portuguese(self):
        assert detect_language("Onde fica o portão de embarque") == "pt"
        assert detect_language("Meu voo está atrasado obrigado") == "pt"

    def test_dutch(self):
        assert detect_language("Waar is de gate voor deze vlucht") == "nl"
        assert detect_language("Mijn vlucht is vertraagd dank u") == "nl"

    def test_english(self):
        assert detect_language("where is the boarding gate") == "en"
        assert detect_language("my flight is delayed please help") == "en"


class TestSpecialCharacters:
    def test_german_umlauts(self):
        assert detect_language("Flüge nach München") == "de"
        assert detect_language("Wo ist der Ausgang") == "de"  # "der" + "ist" stopwords

    def test_french_accents(self):
        assert detect_language("vol à destination de Paris") == "fr"
        assert detect_language("départ prévu à 14h") == "fr"

    def test_spanish_accents(self):
        assert detect_language("información sobre el equipaje") == "es"
        assert detect_language("Número de asiento") == "es"

    def test_portuguese_accents(self):
        assert detect_language("informação sobre bagagem") == "pt"
        assert detect_language("não há atraso") == "pt"


class TestEdgeCases:
    def test_empty(self):
        assert detect_language("") == "en"

    def test_numbers_only(self):
        assert detect_language("1234") == "en"

    def test_mixed_script(self):
        # Arabic script with Persian char → Persian wins
        assert detect_language("پرواز من به تهران چمدان") == "fa"
        # Turkish chars → Turkish
        assert detect_language("my flight is delayed uçuş iptal") == "tr"
        # German phrase with umlaut
        assert detect_language("mein Flug ist verspätet") == "de"


class TestBCP47Mapping:
    def test_all_langs_have_bcp47(self):
        langs = ["en","tr","ar","ru","de","fr","zh","es","it","fa","ja","ko","pt","nl","hi"]
        for lang in langs:
            assert lang in LANG_TO_BCP47, f"{lang} missing BCP-47 mapping"

    def test_bcp47_format(self):
        for code in LANG_TO_BCP47.values():
            assert "-" in code, f"{code} not valid BCP-47"
