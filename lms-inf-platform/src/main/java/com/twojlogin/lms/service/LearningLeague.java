package com.twojlogin.lms.service;

public enum LearningLeague {
    CARBON("Węgiel", "#64748b", "C", 1, 5),
    COPPER("Miedź", "#f97316", "Cu", 5, 10),
    SILVER("Srebro", "#cbd5e1", "Ag", 10, 15),
    GOLD("Złoto", "#facc15", "Au", 15, 25),
    PLATINUM("Platyna", "#22d3ee", "Pt", 25, 40),
    CRYSTAL("Kryształ", "#a78bfa", "Kr", 40, 60),
    PRISM("Pryzmat", "#f472b6", "∞", 60, null);

    private final String displayName;
    private final String color;
    private final String symbol;
    private final int minimumLevel;
    private final Integer nextLevel;

    LearningLeague(
            String displayName,
            String color,
            String symbol,
            int minimumLevel,
            Integer nextLevel
    ) {
        this.displayName = displayName;
        this.color = color;
        this.symbol = symbol;
        this.minimumLevel = minimumLevel;
        this.nextLevel = nextLevel;
    }

    public String displayName() { return displayName; }
    public String color() { return color; }
    public String symbol() { return symbol; }
    public int minimumLevel() { return minimumLevel; }
    public Integer nextLevel() { return nextLevel; }

    public static LearningLeague forLevel(int level) {
        LearningLeague current = CARBON;
        for (LearningLeague league : values()) {
            if (level >= league.minimumLevel) current = league;
        }
        return current;
    }
}
