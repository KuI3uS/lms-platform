export function createSentenceBuilderConfig(polishSentence = "", englishSentence = "") {
    return {
        version: 1,
        kind: "sentence-builder",
        polishSentence: String(polishSentence || "").trim(),
        words: String(englishSentence || "").trim().split(/\s+/).filter(Boolean)
    };
}

export function parseSentenceBuilderContent(content) {
    try {
        const parsed = JSON.parse(content || "{}");
        if (parsed?.kind !== "sentence-builder") return createSentenceBuilderConfig();
        return {
            version: 1,
            kind: "sentence-builder",
            polishSentence: String(parsed.polishSentence || "").trim(),
            words: Array.isArray(parsed.words)
                ? parsed.words.map((word) => String(word || "").trim()).filter(Boolean).slice(0, 6)
                : []
        };
    } catch {
        return createSentenceBuilderConfig();
    }
}

export function serializeSentenceBuilderConfig(config) {
    return JSON.stringify({
        version: 1,
        kind: "sentence-builder",
        polishSentence: String(config?.polishSentence || "").trim(),
        words: Array.isArray(config?.words)
            ? config.words.map((word) => String(word || "").trim()).filter(Boolean).slice(0, 6)
            : []
    });
}

export function sentenceWordMatches(actual, expected) {
    const normalize = (value) => String(value || "")
        .toLocaleLowerCase()
        .replace(/[’]/g, "'")
        .replace(/[^\p{L}\p{N}']/gu, "");
    return normalize(actual) === normalize(expected);
}
