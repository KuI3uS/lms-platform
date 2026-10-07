package com.twojlogin.lms.service;

import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Converts explicit English spelling to letter names before speech synthesis. */
public final class EnglishAlphabetSpeech {
    private static final String[] NAMES = {
            "ay", "bee", "see", "dee", "ee", "eff", "gee", "aitch", "eye", "jay",
            "kay", "ell", "em", "en", "oh", "pee", "cue", "are", "ess", "tee",
            "you", "vee", "double you", "ex", "why", "zed"
    };
    private static final Pattern EMBEDDED_SPELLING = Pattern.compile(
            "(?<![\\p{L}\\p{N}_])([a-z](?:\\s*[-–—]\\s*[a-z])+)(?![\\p{L}\\p{N}_])",
            Pattern.CASE_INSENSITIVE
    );

    private EnglishAlphabetSpeech() {}

    public static String forSynthesis(String text, String language) {
        String locale = language == null || language.isBlank() ? "en-GB"
                : language.toLowerCase(Locale.ROOT).replace('_', '-');
        if (text == null || !(locale.equals("en") || locale.startsWith("en-"))) return text;

        String spelling = text.trim().replaceFirst("[.!?]+$", "").trim();
        if (spelling.matches("(?i)[a-z](?:\\s*[-–—]\\s*[a-z])*")
                || spelling.matches("[A-Z](?:\\s+[A-Z])+")) {
            return names(spelling, locale);
        }
        // Preserve ordinary sentences, while reading A-L-E-X as four letter names.
        return EMBEDDED_SPELLING.matcher(text).replaceAll(match -> names(match.group(), locale));
    }

    private static String names(String spelling, String locale) {
        return spelling.toUpperCase(Locale.ROOT).chars()
                .filter(letter -> letter >= 'A' && letter <= 'Z')
                .mapToObj(letter -> letter == 'Z' && locale.equals("en-us") ? "zee" : NAMES[letter - 'A'])
                .collect(Collectors.joining(", "));
    }
}
