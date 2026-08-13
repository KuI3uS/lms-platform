package com.twojlogin.lms.entity;

public enum AchievementType {
    FIRST_LESSON("Pierwszy krok", "Ukończ pierwszą lekcję", "book", 25, 1),
    LESSONS_5("Dobry początek", "Ukończ 5 lekcji", "book", 50, 5),
    LESSONS_10("Uczeń z planem", "Ukończ 10 lekcji", "book", 100, 10),
    LESSONS_25("Konsekwentny rozwój", "Ukończ 25 lekcji", "layers", 200, 25),
    LESSONS_50("Pół setki", "Ukończ 50 lekcji", "layers", 400, 50),
    LESSONS_100("Setna lekcja", "Ukończ 100 lekcji", "trophy", 750, 100),

    STREAK_3("Dobry rytm", "Ucz się przez 3 kolejne dni", "fire", 75, 3),
    STREAK_7("Tydzień nauki", "Ucz się przez 7 kolejnych dni", "calendar", 150, 7),
    STREAK_14("Dwa tygodnie mocy", "Ucz się przez 14 kolejnych dni", "calendar", 300, 14),
    STREAK_30("Żelazny nawyk", "Ucz się przez 30 kolejnych dni", "fire", 750, 30),

    TASKS_10("Pierwsze rozwiązania", "Rozwiąż poprawnie 10 zadań", "check", 50, 10),
    TASKS_50("Łowca problemów", "Rozwiąż poprawnie 50 zadań", "check", 150, 50),
    TASKS_100("Setka rozwiązań", "Rozwiąż poprawnie 100 zadań", "lightning", 300, 100),
    TASKS_250("Maszyna do zadań", "Rozwiąż poprawnie 250 zadań", "lightning", 600, 250),
    TASKS_500("Arcymistrz praktyki", "Rozwiąż poprawnie 500 zadań", "trophy", 1_000, 500),
    COMBO_10("Bez pomyłki", "Rozwiąż 10 zadań poprawnie z rzędu", "bolt", 120, 10),
    COMBO_25("Perfekcyjna passa", "Rozwiąż 25 zadań poprawnie z rzędu", "bolt", 350, 25),

    XP_100("100 XP", "Zdobądź 100 punktów doświadczenia", "stars", 30, 100),
    XP_500("500 XP", "Zdobądź 500 punktów doświadczenia", "stars", 75, 500),
    XP_1000("Pierwszy tysiąc", "Zdobądź 1000 punktów doświadczenia", "stars", 150, 1_000),
    XP_5000("Elektrownia wiedzy", "Zdobądź 5000 punktów doświadczenia", "lightning", 400, 5_000),

    LEVEL_10("Dziesiąty poziom", "Osiągnij poziom 10", "level", 250, 10),
    LEVEL_50("Elita EduHub", "Osiągnij poziom 50", "level", 1_000, 50),
    PRISM_LEAGUE("Liga Pryzmatu", "Osiągnij ligę Pryzmatu", "gem", 1_500, 61),
    MYTHIC_LEAGUE("Mityczny", "Osiągnij najrzadszą ligę Mityczną", "gem", 5_000, 111),

    MODULE_MASTER("Mistrz modułu", "Ukończ wszystkie lekcje w module", "layers", 100, 1),
    MODULES_5("Kartograf wiedzy", "Ukończ 5 pełnych modułów", "layers", 350, 5),
    MODULES_10("Architekt nauki", "Ukończ 10 pełnych modułów", "layers", 750, 10),
    COURSE_GRADUATE("Absolwent EduHub", "Ukończ cały kurs", "certificate", 500, 1),
    COURSES_3("Kolekcjoner certyfikatów", "Ukończ 3 pełne kursy", "certificate", 1_200, 3),

    PERFECT_EXAM("Perfekcyjny wynik", "Zdobądź 100% z egzaminu", "trophy", 300, 1),
    EXAMS_10("Egzaminacyjny weteran", "Ukończ 10 egzaminów", "trophy", 600, 10),

    STUDY_HOUR("Pierwsza godzina", "Ucz się aktywnie przez 1 godzinę", "clock", 50, 3_600),
    STUDY_10_HOURS("Dziesięć godzin skupienia", "Ucz się aktywnie przez 10 godzin", "clock", 250, 36_000),
    STUDY_25_HOURS("Maratończyk wiedzy", "Ucz się aktywnie przez 25 godzin", "clock", 600, 90_000),
    STUDY_50_HOURS("Profesjonalny rytm", "Ucz się aktywnie przez 50 godzin", "clock", 1_200, 180_000);

    private final String title;
    private final String description;
    private final String icon;
    private final int gemReward;
    private final long target;

    AchievementType(String title, String description, String icon, int gemReward, long target) {
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.gemReward = gemReward;
        this.target = target;
    }

    public String title() { return title; }
    public String description() { return description; }
    public String icon() { return icon; }
    public int gemReward() { return gemReward; }
    public long target() { return target; }
}
