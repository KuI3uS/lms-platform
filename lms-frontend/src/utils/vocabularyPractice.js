import { languageAnswerScore } from "./languageInteractiveBlocks.js";

export function checkVocabularyAnswer(item, answer, failedAttempts = 0, threshold = 82) {
    if (!item || !String(answer || "").trim()) return null;
    const score = languageAnswerScore([item.translation, ...(item.acceptedAnswers || [])], answer);
    const accepted = score >= threshold;
    return { score, accepted, failedAttempts: failedAttempts + (accepted ? 0 : 1) };
}

export function vocabularyHint(answer, failedAttempts) {
    if (failedAttempts < 3) return null;
    const characters = Array.from(String(answer || "").trim().normalize("NFC"));
    const letterCount = characters.filter((character) => /[\p{L}\p{N}]/u.test(character)).length;
    if (!letterCount) return null;
    if (letterCount === 1) return "Odpowiedź ma jeden znak. Sprawdź, którą literę lub cyfrę słyszysz.";

    let first = "";
    const pattern = characters.map((character) => {
        if (!/[\p{L}\p{N}]/u.test(character)) return character;
        if (!first) { first = character; return character; }
        return "_";
    }).join("");
    return `Pierwszy znak: „${first}”. Liczba liter lub cyfr: ${letterCount}. Wzór: ${pattern}`;
}
