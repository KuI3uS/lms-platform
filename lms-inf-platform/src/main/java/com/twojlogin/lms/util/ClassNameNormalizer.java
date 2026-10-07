package com.twojlogin.lms.util;

public class ClassNameNormalizer {

    public static String normalize(String value) {
        if (value == null) return null;

        return value
                .trim()
                .toUpperCase()
                .replace(" ", "")
                .replace("-", "")
                .replace("_", "");
    }
}