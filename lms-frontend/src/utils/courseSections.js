const SECTION_EXPANSION_STORAGE_KEY = "eduhub-course-section-expansion-v1";

export function buildCourseSections(modules = []) {
    const sections = [];
    for (const [moduleIndex, module] of modules.entries()) {
        const title = module.sectionTitle?.trim() || "";
        if (title || sections.length === 0) {
            sections.push({
                id: module.id,
                title,
                startStageNumber: moduleIndex + 1,
                endStageNumber: moduleIndex + 1,
                lessonCount: 0,
                entries: []
            });
        }
        const section = sections[sections.length - 1];
        section.entries.push({ module, moduleIndex });
        section.endStageNumber = moduleIndex + 1;
        section.lessonCount += module.lessons?.length || 0;
    }
    return sections;
}

export function courseSectionExpansionKey(courseId, userId, sectionId) {
    return `${userId ?? "guest"}:${courseId}:${sectionId}`;
}

export function readCourseSectionExpansion(storage) {
    try {
        const raw = (storage ?? globalThis.localStorage)?.getItem(SECTION_EXPANSION_STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : {};
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
        return Object.fromEntries(Object.entries(saved).filter(([, value]) => typeof value === "boolean"));
    } catch {
        return {};
    }
}

export function saveCourseSectionExpansion(expansion, storage) {
    try {
        (storage ?? globalThis.localStorage)?.setItem(SECTION_EXPANSION_STORAGE_KEY, JSON.stringify(expansion));
    } catch {
        // Collapsing still works when browser storage is unavailable.
    }
}
