// Spell letter names explicitly: some system voices read uppercase letters as “capital P”.
const NAMES = {
    A: ["ay", "a", "aye"], B: ["bee", "be"], C: ["see", "sea"], D: ["dee"],
    E: ["ee"], F: ["eff", "ef"], G: ["gee"], H: ["aitch", "haitch"],
    I: ["eye", "i"], J: ["jay"], K: ["kay"], L: ["ell", "el"],
    M: ["em"], N: ["en"], O: ["oh", "o"], P: ["pee", "pea"],
    Q: ["cue", "queue"], R: ["are", "ar"], S: ["ess", "es"],
    T: ["tee", "tea"], U: ["you", "u"], V: ["vee"], W: ["double you", "double u"],
    X: ["ex"], Y: ["why"], Z: ["zee", "zed"]
};

const IPA = {
    A: "eɪ", B: "biː", C: "siː", D: "diː", E: "iː", F: "ef", G: "dʒiː",
    H: "eɪtʃ", I: "aɪ", J: "dʒeɪ", K: "keɪ", L: "el", M: "em", N: "en",
    O: "əʊ", P: "piː", Q: "kjuː", R: "ɑː", S: "es", T: "tiː", U: "juː",
    V: "viː", W: "ˈdʌbəl juː", X: "eks", Y: "waɪ", Z: "zed"
};

function isEnglish(language) {
    return /^en(?:-|$)/i.test(String(language || "en-US").replaceAll("_", "-"));
}

// Only a whole letter or explicit spelling is treated as an alphabet exercise.
// Ordinary words and sentences (including the article A and pronoun I) stay intact.
export function englishSpelling(phrase, language = "en-US") {
    if (!isEnglish(language)) return null;
    const text = String(phrase || "").trim().replace(/[.!?]+$/, "").trim();
    if (/^[a-z]$/i.test(text)) return [text.toUpperCase()];
    if (/^[a-z](?:\s*[-–—]\s*[a-z])+$/i.test(text) || /^[A-Z](?:\s+[A-Z])+$/.test(text)) {
        return text.toUpperCase().match(/[A-Z]/g);
    }
    return null;
}

export function englishLetter(phrase, language = "en-US") {
    const letters = englishSpelling(phrase, language);
    return letters?.length === 1 ? letters[0] : null;
}

function letterNames(letter, language) {
    return letter === "Z" && !/^en[-_]us$/i.test(language || "en-US") ? ["zed", "zee"] : NAMES[letter];
}

export function letterPronunciation(phrase, language = "en-US") {
    const letter = englishLetter(phrase, language);
    if (!letter) return null;
    const american = /^en[-_]us$/i.test(language || "en-US");
    return american && letter === "Z" ? "ziː"
        : american && letter === "O" ? "oʊ"
        : american && letter === "R" ? "ɑr"
        : IPA[letter];
}

export function speechText(phrase, language = "en-US") {
    if (!isEnglish(language)) return phrase;
    const names = (letters) => letters.map((letter) => letterNames(letter, language)[0]).join(", ");
    const letters = englishSpelling(phrase, language);
    if (letters) return names(letters);
    // Also handle spelling embedded in a dialogue: “Is that A-L-E-X?”
    return String(phrase || "").replace(
        /(?<![\p{L}\p{N}_])([a-z](?:\s*[-–—]\s*[a-z])+)(?![\p{L}\p{N}_])/giu,
        (spelling) => names(spelling.toUpperCase().match(/[A-Z]/g))
    );
}

function matchesSpelling(letters, received, language) {
    if (received.replaceAll(" ", "") === letters.join("").toLowerCase()) return true;
    const tokens = received.split(" ");
    let positions = new Set([0]);
    for (const letter of letters) {
        const next = new Set();
        for (const position of positions) {
            for (const name of [letter.toLowerCase(), ...letterNames(letter, language)]) {
                const words = name.split(" ");
                if (words.every((word, offset) => word === tokens[position + offset])) {
                    next.add(position + words.length);
                }
            }
        }
        positions = next;
    }
    return positions.has(tokens.length);
}

// Continuous recognition may split A-L-E-X into several result segments.
// Keep each segment, with a bounded set of the browser's alternatives.
export function recognitionTranscripts(results, limit = 9) {
    let candidates = [""];
    for (const result of Array.from(results || [])) {
        const alternatives = Array.from(result || [])
            .map((alternative) => String(alternative?.transcript || "").trim())
            .filter(Boolean);
        if (!alternatives.length) continue;
        candidates = candidates.flatMap((prefix) => alternatives.map((text) => `${prefix} ${text}`.trim())).slice(0, limit);
    }
    return [...new Set(candidates)].filter(Boolean);
}

function normalize(value) {
    return (value || "")
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}' ]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function distance(first, second) {
    const rows = Array.from({ length: second.length + 1 }, (_, index) => index);
    for (let firstIndex = 1; firstIndex <= first.length; firstIndex++) {
        let previous = rows[0];
        rows[0] = firstIndex;
        for (let secondIndex = 1; secondIndex <= second.length; secondIndex++) {
            const current = rows[secondIndex];
            rows[secondIndex] = Math.min(
                rows[secondIndex] + 1,
                rows[secondIndex - 1] + 1,
                previous + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1)
            );
            previous = current;
        }
    }
    return rows[second.length];
}

export function pronunciationScore(target, transcript, language = "en-US") {
    const letters = englishSpelling(target, language);
    const expected = normalize(target);
    const received = normalize(transcript);
    if (letters) return matchesSpelling(letters, received, language) ? 100 : 0;
    if (!expected || !received) return 0;
    const compactExpected = expected.replace(/[ '\s]/g, "");
    const compactReceived = received.replace(/[ '\s]/g, "");
    if (compactExpected === compactReceived) return 100;
    return Math.max(0, Math.round(
        (1 - distance(expected, received) / Math.max(expected.length, received.length)) * 100
    ));
}
