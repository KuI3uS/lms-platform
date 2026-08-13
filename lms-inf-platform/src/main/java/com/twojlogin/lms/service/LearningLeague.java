package com.twojlogin.lms.service;

public enum LearningLeague {
    COPPER("Miedź", "#fb923c", 1, 11),
    SILVER("Srebro", "#e2e8f0", 11, 21),
    GOLD("Złoto", "#facc15", 21, 31),
    PLATINUM("Platyna", "#22d3ee", 31, 41),
    CRYSTAL("Kryształ", "#a78bfa", 41, 51),
    DIAMOND("Diament", "#38bdf8", 51, 61),
    PRISM("Pryzmat", "#f472b6", 61, 71),
    LEGENDARY_ONE("Legendarny I", "#fb7185", 71, 91),
    LEGENDARY_TWO("Legendarny II", "#ef4444", 91, 111),
    MYTHIC("Mityczny", "#e879f9", 111, null);

    private final String displayName;
    private final String color;
    private final int minimumLevel;
    private final Integer nextLevel;

    LearningLeague(
            String displayName,
            String color,
            int minimumLevel,
            Integer nextLevel
    ) {
        this.displayName = displayName;
        this.color = color;
        this.minimumLevel = minimumLevel;
        this.nextLevel = nextLevel;
    }

    public String displayName() { return displayName; }
    public String color() { return color; }
    public int minimumLevel() { return minimumLevel; }
    public Integer nextLevel() { return nextLevel; }

    public static LearningLeague forLevel(int level) {
        LearningLeague current = COPPER;
        for (LearningLeague league : values()) {
            if (level >= league.minimumLevel) current = league;
        }
        return current;
    }
}
