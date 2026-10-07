package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EnglishAlphabetSpeechTest {
    @Test
    void readsLetterNamesWithoutCapitalOrExtraWords() {
        assertThat(EnglishAlphabetSpeech.forSynthesis("A", "en-GB")).isEqualTo("ay");
        assertThat(EnglishAlphabetSpeech.forSynthesis("E", "en-GB")).isEqualTo("ee");
        assertThat(EnglishAlphabetSpeech.forSynthesis("I", "en-GB")).isEqualTo("eye");
        assertThat(EnglishAlphabetSpeech.forSynthesis("P", "en-GB")).isEqualTo("pee");
        assertThat(EnglishAlphabetSpeech.forSynthesis("Z", "en-GB")).isEqualTo("zed");
        assertThat(EnglishAlphabetSpeech.forSynthesis("Z", "en-US")).isEqualTo("zee");
    }

    @Test
    void spellsNamesAndWordsFromTheImportedAlphabetLesson() {
        assertThat(EnglishAlphabetSpeech.forSynthesis("A-L-E-X.", "en-GB"))
                .isEqualTo("ay, ell, ee, ex");
        assertThat(EnglishAlphabetSpeech.forSynthesis("E-M-M-A", "en-GB"))
                .isEqualTo("ee, em, em, ay");
        assertThat(EnglishAlphabetSpeech.forSynthesis("B-O-O-K", "en-GB"))
                .isEqualTo("bee, oh, oh, kay");
        assertThat(EnglishAlphabetSpeech.forSynthesis("A L E X", "en-GB"))
                .isEqualTo("ay, ell, ee, ex");
        assertThat(EnglishAlphabetSpeech.forSynthesis("Is that A-L-E-X?", "en-GB"))
                .isEqualTo("Is that ay, ell, ee, ex?");
    }

    @Test
    void preservesOrdinaryWordsSentencesAndOtherLanguages() {
        for (String text : new String[]{"I am Alex.", "A cup of tea", "X-ray", "Emma", "BOOK"}) {
            assertThat(EnglishAlphabetSpeech.forSynthesis(text, "en-GB")).isEqualTo(text);
        }
        assertThat(EnglishAlphabetSpeech.forSynthesis("A", "pl-PL")).isEqualTo("A");
        assertThat(EnglishAlphabetSpeech.forSynthesis("A-L-E-X", "de-DE")).isEqualTo("A-L-E-X");
    }
}
