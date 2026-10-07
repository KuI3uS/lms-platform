export const COURSE_CATEGORIES = [
    {
        value: "SCHOOL",
        label: "Technikum",
        title: "Technik informatyk",
        description: "Przedmioty szkolne uporządkowane według klas 1–4.",
        accent: "emerald"
    },
    {
        value: "UNIVERSITY",
        label: "Uczelnia",
        title: "Strefa akademicka",
        description: "Materiały, laboratoria i kursy przeznaczone dla studentów.",
        accent: "amber"
    },
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

export const SCHOOL_LEVELS = ["Klasa 1", "Klasa 2", "Klasa 3", "Klasa 4"];

export const UNIVERSITY_LEVELS = [
    "Studia I stopnia",
    "Studia II stopnia",
    "Studia podyplomowe"
];

function normalizedCourseName(course) {
    return `${course?.name || ""} ${course?.title || ""}`
        .toLocaleLowerCase("pl-PL")
        .replaceAll(".", " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isLegacySchoolCourse(course) {
    if (course?.category && course.category !== "PROGRAMMING") return false;

    const name = normalizedCourseName(course);
    return /\binf\s*0?[234]\b/.test(name)
        || name.includes("administrowanie systemami operacyjnymi")
        || name.includes("lokalnych sieci komputerowych")
        || name.includes("urządzenia techniki komputerowej")
        || name.includes("urzadzenia techniki komputerowej");
}

export function getCourseCategory(course) {
    if (isLegacySchoolCourse(course)) return "SCHOOL";
    return course?.category || "PROGRAMMING";
}

export function getEducationLevel(course) {
    if (SCHOOL_LEVELS.includes(course?.level)) return course.level;

    const name = normalizedCourseName(course);
    if (/\b(iv|4)\b/.test(name)) return "Klasa 4";
    if (/\b(iii|3)\b/.test(name) || /\binf\s*0?[23]\b/.test(name)) return "Klasa 3";
    if (/\b(ii|2)\b/.test(name)) return "Klasa 2";
    return "Klasa 1";
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
    if (getCourseCategory(course) === "SCHOOL") {
        return getEducationLevel(course);
    }
    if (getCourseCategory(course) === "LANGUAGE") {
        const start = course?.cefrLevel || "A1";
        const end = course?.cefrEndLevel || start;
        return start === end ? start : `${start}–${end}`;
    }
    return course?.level || "Podstawy";
}
