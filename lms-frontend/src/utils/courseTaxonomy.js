export const COURSE_CATEGORIES = [
    {
        value: "PROGRAMMING",
        label: "Programowanie",
        title: "Programowanie i technologie",
        description: "Java, Python, aplikacje webowe i ścieżki egzaminacyjne.",
        accent: "cyan"
    },
    {
        value: "DIGITAL_SKILLS",
        label: "Rozwój cyfrowy",
        title: "Umiejętności cyfrowe",
        description: "Narzędzia komputerowe, bezpieczeństwo i praca cyfrowa.",
        accent: "blue"
    },
    {
        value: "LANGUAGE",
        label: "Języki",
        title: "Kursy językowe",
        description: "Nauka języków według poziomów CEFR od A1 do C2.",
        accent: "violet"
    }
];

export const COURSE_LANGUAGES = [
    { value: "ENGLISH", label: "Angielski" },
    { value: "GERMAN", label: "Niemiecki" },
    { value: "SPANISH", label: "Hiszpański" },
    { value: "FRENCH", label: "Francuski" },
    { value: "POLISH", label: "Polski" }
];

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function getCourseCategory(course) {
    return course?.category || "PROGRAMMING";
}

export function getCategoryDefinition(courseOrCategory) {
    const category = typeof courseOrCategory === "string"
        ? courseOrCategory
        : getCourseCategory(courseOrCategory);

    return COURSE_CATEGORIES.find((item) => item.value === category)
        || COURSE_CATEGORIES[0];
}

export function getCourseLanguageLabel(language) {
    return COURSE_LANGUAGES.find((item) => item.value === language)?.label
        || language
        || "";
}

export function getCourseLevelLabel(course) {
    if (getCourseCategory(course) === "LANGUAGE") {
        return course?.cefrLevel || "A1";
    }
    return course?.level || "Podstawy";
}
