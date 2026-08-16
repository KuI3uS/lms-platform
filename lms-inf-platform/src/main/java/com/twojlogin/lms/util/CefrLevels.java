package com.twojlogin.lms.util;

import java.util.List;
import java.util.Locale;

public final class CefrLevels {

    public static final List<String> ORDERED = List.of("A1", "A2", "B1", "B2", "C1", "C2");

    private CefrLevels() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return ORDERED.contains(normalized) ? normalized : null;
    }

    public static int rank(String level) {
        return ORDERED.indexOf(normalize(level));
    }

    public static boolean isInRange(String level, String start, String end) {
        int valueRank = rank(level);
        int startRank = rank(start);
        int endRank = rank(end);
        return valueRank >= 0 && startRank >= 0 && endRank >= startRank
                && valueRank >= startRank && valueRank <= endRank;
    }

    public static String next(String level) {
        int index = rank(level);
        return index >= 0 && index + 1 < ORDERED.size() ? ORDERED.get(index + 1) : null;
    }

    public static List<String> between(String start, String end) {
        int startRank = rank(start);
        int endRank = rank(end);
        if (startRank < 0 || endRank < startRank) return List.of();
        return ORDERED.subList(startRank, endRank + 1);
    }
}
