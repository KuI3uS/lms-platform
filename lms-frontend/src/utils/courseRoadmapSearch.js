function normalizeSearchText(value) {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .replace(/[łŁ]/g, "l")
        .toLocaleLowerCase("pl")
        .replace(/\s*[-‐‑‒–—−]\s*/g, "-")
        .replace(/\s+/g, " ")
        .trim();
}

function containsTokens(text, tokens) {
    return tokens.every(token => text.includes(token));
}

export function filterCourseRoadmap(sections, query) {
    const normalizedQuery = normalizeSearchText(query);
    const active = Boolean(normalizedQuery);
    const exactStage = normalizedQuery.match(/^(?:etap\s*#?\s*)?(\d+)$/i);
    const stageNumber = exactStage ? Number(exactStage[1]) : null;
    const tokens = normalizedQuery.split(" ");
    const filteredSections = [];
    let moduleCount = 0;
    let lessonCount = 0;

    for (const section of sections ?? []) {
        const originalEntries = section.entries ?? [];
        const sectionText = normalizeSearchText(section.title);
        const sectionMatches = !active || (!exactStage && containsTokens(sectionText, tokens));
        const entries = [];

        for (const entry of originalEntries) {
            const moduleText = normalizeSearchText(entry.module?.name);
            const moduleMatches = sectionMatches || (exactStage
                ? Number.isSafeInteger(stageNumber) && stageNumber > 0 && entry.moduleIndex + 1 === stageNumber
                : containsTokens(moduleText, tokens));
            const lessonEntries = (entry.module?.lessons ?? [])
                .map((lesson, lessonIndex) => ({ lesson, lessonIndex }))
                .filter(({ lesson }) => moduleMatches || (!exactStage && containsTokens(
                    `${sectionText} ${moduleText} ${normalizeSearchText(lesson.title)}`,
                    tokens
                )));

            if (!moduleMatches && lessonEntries.length === 0) continue;
            entries.push({ ...entry, lessonEntries });
            moduleCount += 1;
            lessonCount += lessonEntries.length;
        }

        if (entries.length === 0) continue;
        filteredSections.push({
            ...section,
            firstModule: originalEntries[0]?.module ?? null,
            entries
        });
    }

    return { active, sections: filteredSections, moduleCount, lessonCount };
}
