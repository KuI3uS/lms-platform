const GENERATED_COVERS = {
    inf02: "/images/course-covers/inf02.webp",
    inf03: "/images/course-covers/inf03.webp",
    java: "/images/course-covers/java.webp",
    default: "/images/course-covers/programming.webp"
};

function normalizeCourseName(course) {
    return `${course?.title || ""} ${course?.name || ""}`
        .toLocaleLowerCase("pl-PL")
        .replace(/[^a-z0-9]/g, "");
}

export function getGeneratedCourseCover(course) {
    const courseName = normalizeCourseName(course);

    if (courseName.includes("inf02")) return GENERATED_COVERS.inf02;
    if (courseName.includes("inf03")) return GENERATED_COVERS.inf03;
    if (courseName.includes("java")) return GENERATED_COVERS.java;

    return GENERATED_COVERS.default;
}

export function getCourseCover(course) {
    const customCover = course?.thumbnailUrl?.trim();

    return customCover || getGeneratedCourseCover(course);
}
