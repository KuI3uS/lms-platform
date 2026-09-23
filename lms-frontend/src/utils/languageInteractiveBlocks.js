const DEFAULT_CHARACTERS = [
    { id: "speaker-1", name: "Emma", avatar: "👩", side: "left" },
    { id: "speaker-2", name: "Leo", avatar: "👨", side: "right" }
];

export function createEmptyDialogConfig() {
    return {
        version: 1,
        kind: "dialog",
        characters: DEFAULT_CHARACTERS.map((character) => ({ ...character })),
        studentCharacterId: "speaker-2",
        turns: []
    };
}

export function createEmptyVocabularyConfig() {
    return {
        version: 1,
        kind: "vocabulary",
        items: []
    };
}

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function cleanText(value) {
    return String(value || "").trim();
}

function normalizeCharacter(character, fallback, index) {
    return {
        id: cleanText(character?.id) || fallback.id,
        name: cleanText(character?.name) || fallback.name,
        avatar: cleanText(character?.avatar) || fallback.avatar,
        voiceGender: ["female", "male", "neutral"].includes(character?.voiceGender) ? character.voiceGender : "auto",
        side: character?.side === "right" || index === 1 ? "right" : "left"
    };
}

export function parseDialogueEditor(text, characters = DEFAULT_CHARACTERS) {
    const characterByName = new Map(
        characters.map((character) => [character.name.toLocaleLowerCase(), character])
    );

    return String(text || "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
            const separator = line.indexOf(":");
            const rawSpeaker = separator >= 0 ? line.slice(0, separator).trim() : "";
            const rawPayload = separator >= 0 ? line.slice(separator + 1).trim() : line;
            const markedAsStudent = /\[\s*uczen\s*\]/i.test(rawSpeaker.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            const speakerName = rawSpeaker.replace(/\[.*?\]/g, "").trim();
            const knownCharacter = characterByName.get(speakerName.toLocaleLowerCase())
                || characters[index % Math.max(characters.length, 1)]
                || DEFAULT_CHARACTERS[0];
            const [phrase = "", alternatives = "", explanation = ""] = rawPayload
                .split("||")
                .map((part) => part.trim());

            return {
                speakerId: knownCharacter.id,
                text: phrase,
                acceptedAnswers: alternatives
                    .split(";")
                    .map((answer) => answer.trim())
                    .filter(Boolean),
                explanation,
                studentTurn: markedAsStudent
            };
        })
        .filter((turn) => turn.text);
}

export function dialogueToEditor(config) {
    const characters = config?.characters || DEFAULT_CHARACTERS;
    const byId = new Map(characters.map((character) => [character.id, character]));

    return (config?.turns || []).map((turn) => {
        const character = byId.get(turn.speakerId) || characters[0] || DEFAULT_CHARACTERS[0];
        const marker = turn.studentTurn ? " [UCZEŃ]" : "";
        const additions = [
            (turn.acceptedAnswers || []).join("; "),
            cleanText(turn.explanation)
        ];
        while (additions.length && !additions[additions.length - 1]) additions.pop();
        return `${character.name}${marker}: ${turn.text}${additions.length ? ` || ${additions.join(" || ")}` : ""}`;
    }).join("\n");
}

export function parseDialogContent(content) {
    const fallback = createEmptyDialogConfig();
    const parsed = parseJson(content);

    if (parsed?.kind === "dialog" && Array.isArray(parsed.turns)) {
        const rawCharacters = Array.isArray(parsed.characters) && parsed.characters.length > 0
            ? parsed.characters.slice(0, 2)
            : fallback.characters;
        const characters = rawCharacters.map((character, index) => (
            normalizeCharacter(character, DEFAULT_CHARACTERS[index] || DEFAULT_CHARACTERS[0], index)
        ));
        while (characters.length < 2) {
            characters.push({ ...DEFAULT_CHARACTERS[characters.length] });
        }
        const characterIds = new Set(characters.map((character) => character.id));
        return {
            ...fallback,
            ...parsed,
            characters,
            studentCharacterId: characterIds.has(parsed.studentCharacterId)
                ? parsed.studentCharacterId
                : characters[1].id,
            turns: parsed.turns.map((turn, index) => ({
                speakerId: characterIds.has(turn?.speakerId)
                    ? turn.speakerId
                    : characters[index % 2].id,
                text: cleanText(turn?.text),
                acceptedAnswers: Array.isArray(turn?.acceptedAnswers)
                    ? turn.acceptedAnswers.map(cleanText).filter(Boolean)
                    : [],
                explanation: cleanText(turn?.explanation),
                studentTurn: Boolean(turn?.studentTurn)
            })).filter((turn) => turn.text)
        };
    }

    if (cleanText(content)) {
        const turns = parseDialogueEditor(content, fallback.characters);
        return { ...fallback, turns };
    }
    return fallback;
}

export function serializeDialogConfig(config) {
    return JSON.stringify({ ...config, version: 1, kind: "dialog" });
}

export function parseVocabularyEditor(text) {
    return String(text || "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [term = "", translation = "", example = "", alternatives = ""] = line
                .split("|")
                .map((part) => part.trim());
            return {
                term,
                translation,
                example,
                acceptedAnswers: alternatives
                    .split(";")
                    .map((answer) => answer.trim())
                    .filter(Boolean)
            };
        })
        .filter((item) => item.term || item.translation);
}

export function vocabularyToEditor(config) {
    return (config?.items || []).map((item) => {
        const additions = [
            cleanText(item.example),
            (item.acceptedAnswers || []).join("; ")
        ];
        while (additions.length && !additions[additions.length - 1]) additions.pop();
        return `${item.term} | ${item.translation}${additions.length ? ` | ${additions.join(" | ")}` : ""}`;
    }).join("\n");
}

export function parseVocabularyContent(content) {
    const fallback = createEmptyVocabularyConfig();
    const parsed = parseJson(content);
    if (parsed?.kind === "vocabulary" && Array.isArray(parsed.items)) {
        return {
            ...fallback,
            ...parsed,
            items: parsed.items.map((item) => ({
                term: cleanText(item?.term),
                translation: cleanText(item?.translation),
                example: cleanText(item?.example),
                acceptedAnswers: Array.isArray(item?.acceptedAnswers)
                    ? item.acceptedAnswers.map(cleanText).filter(Boolean)
                    : []
            })).filter((item) => item.term || item.translation)
        };
    }
    if (cleanText(content)) {
        return { ...fallback, items: parseVocabularyEditor(content) };
    }
    return fallback;
}

export function serializeVocabularyConfig(config) {
    return JSON.stringify({ ...config, version: 1, kind: "vocabulary" });
}

export function normalizeLanguageAnswer(value) {
    return String(value || "")
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}' ]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function languageAnswerScore(expectedAnswers, answer) {
    const received = normalizeLanguageAnswer(answer);
    if (!received) return 0;

    return Math.max(0, ...expectedAnswers.map((expectedAnswer) => {
        const expected = normalizeLanguageAnswer(expectedAnswer);
        if (!expected) return 0;
        const row = Array.from({ length: received.length + 1 }, (_, index) => index);
        for (let expectedIndex = 1; expectedIndex <= expected.length; expectedIndex++) {
            let previous = row[0];
            row[0] = expectedIndex;
            for (let receivedIndex = 1; receivedIndex <= received.length; receivedIndex++) {
                const current = row[receivedIndex];
                row[receivedIndex] = Math.min(
                    row[receivedIndex] + 1,
                    row[receivedIndex - 1] + 1,
                    previous + (expected[expectedIndex - 1] === received[receivedIndex - 1] ? 0 : 1)
                );
                previous = current;
            }
        }
        return Math.round((1 - row[received.length] / Math.max(expected.length, received.length)) * 100);
    }));
}
