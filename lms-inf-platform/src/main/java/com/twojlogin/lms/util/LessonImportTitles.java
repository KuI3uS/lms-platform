package com.twojlogin.lms.util;

import java.text.Normalizer;
import java.util.Locale;

public final class LessonImportTitles {
    private LessonImportTitles() {}

    public static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFKC)
                .replace('`', ' ')
                .replaceAll("[‘’]", "'")
                .replaceAll("[–—−]", "-")
                .replaceAll("\\s*-\\s*", " - ")
                .replaceAll("\\s+", " ")
                .trim().toLowerCase(Locale.ROOT);
    }
}
