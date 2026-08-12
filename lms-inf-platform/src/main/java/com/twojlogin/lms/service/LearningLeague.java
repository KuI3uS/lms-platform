package com.twojlogin.lms.service;

public enum LearningLeague {
    COPPER("Miedź", "#fb923c", 1, 5),
    SILVER("Srebro", "#e2e8f0", 5, 10),
    GOLD("Złoto", "#facc15", 10, 15),
    PLATINUM("Platyna", "#22d3ee", 15, 25),
    CRYSTAL("Kryształ", "#a78bfa", 25, 40),
    DIAMOND("Diament", "#38bdf8", 40, 60),
    PRISM("Pryzmat", "#f472b6", 60, null);

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
