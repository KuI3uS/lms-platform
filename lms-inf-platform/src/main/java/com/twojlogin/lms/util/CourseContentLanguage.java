package com.twojlogin.lms.util;

import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** The language of authored content, not the language a language course teaches. */
public final class CourseContentLanguage {
    private static final Set<String> SUPPORTED = Set.of("pl", "en", "es");

    private CourseContentLanguage() {}

    public static String requireSupported(String value) {
        String language = value == null ? "pl" : value.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED.contains(language)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Język treści kursu musi mieć wartość pl, en lub es.");
        }
        return language;
    }
}
