import { MAX_BLOCK_TITLE_LENGTH } from "./lessonBlockLimits.js";
import { parseDialogContent } from "./languageInteractiveBlocks.js";

const BLOCK_TYPES = new Set([
    "THEORY", "CONTENT", "TEXT", "TIP", "WARNING", "INFO", "SUMMARY", "QUOTE", "EXAMPLE",
    "IMAGE", "VIDEO", "PDF", "DOWNLOAD", "AUDIO", "DIALOG", "VOCABULARY", "WORD_LAB",
    "LISTENING", "SENTENCE_BUILDER", "QUIZ", "TASK", "DEBUGGING", "PREDICT_OUTPUT",
    "CODE_REVIEW", "OPEN_RESPONSE", "PRACTICAL_LAB", "DIVIDER"
]);
const TEXT_TYPES = new Set(["THEORY", "CONTENT", "TEXT", "TIP", "WARNING", "INFO", "SUMMARY", "QUOTE", "EXAMPLE"]);
const TASK_TYPES = new Set(["TASK", "DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW", "OPEN_RESPONSE"]);
const VOCABULARY_TYPES = new Set(["VOCABULARY", "WORD_LAB", "LISTENING"]);
const INTERACTIVE_TYPES = new Set(["DIALOG", "SENTENCE_BUILDER", ...VOCABULARY_TYPES]);

const text = value => typeof value === "string" ? value.trim() : "";
const fieldError = (field, reason) => `Pole „${field}”: ${reason}`;

function readInteractiveContent(content) {
    try {
        const parsed = JSON.parse(content);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function normalizeQuizOption(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l").replace(/Ł/g, "L")
        .replace(/\*\*/g, "").replace(/^#{1,6}\s*/, "")
        .replace(/\s+/g, " ").trim().toLocaleLowerCase("pl-PL");
}

/** Validate the actual API payload, without mutating or silently repairing it. */
export function getLessonBlockValidationError(block) {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
        return fieldError("Blok", "Brakuje konfiguracji bloku.");
    }
    if (!BLOCK_TYPES.has(block.type)) {
        return fieldError("Typ bloku", "Wybierz obsługiwany typ bloku EduHub.");
    }
    const type = block.type;
    const title = text(block.title);
    if (type !== "DIVIDER" && !title) {
        return fieldError("Tytuł", "Podaj tytuł bloku.");
    }
    if (title.length > MAX_BLOCK_TITLE_LENGTH) {
        return fieldError("Tytuł", `Tytuł ma ${title.length} znaków, a maksymalny limit wynosi ${MAX_BLOCK_TITLE_LENGTH}.`);
    }
    if (TEXT_TYPES.has(type) && !text(block.content)) {
        return fieldError("Treść", "Uzupełnij treść tego bloku.");
    }
    if (["IMAGE", "VIDEO", "PDF", "DOWNLOAD"].includes(type) && !text(block.mediaUrl)) {
        return fieldError("Adres materiału", "Dodaj adres obrazu, filmu lub pliku.");
    }
    if (type === "AUDIO" && !text(block.content)) {
        return fieldError("Zwrot do wypowiedzenia", "Dodaj zwrot, który uczeń ma odsłuchać i powtórzyć.");
    }
    if (INTERACTIVE_TYPES.has(type)) {
        const config = readInteractiveContent(block.content);
        if (!config) {
            return fieldError("Treść interaktywnego bloku", "Konfiguracja musi być poprawnym obiektem JSON, a nie pustą wartością lub listą.");
        }
        if (type === "DIALOG") {
            if (!Array.isArray(config.turns) || config.turns.length < 2) {
                return fieldError("Dialog", "Dodaj przynajmniej dwie wypowiedzi postaci.");
            }
            const incompleteTurn = config.turns.findIndex(turn => !text(turn?.text));
            if (incompleteTurn >= 0) {
                return fieldError("Dialog", `Wypowiedź ${incompleteTurn + 1} nie ma treści. Uzupełnij tekst postaci.`);
            }
            const dialog = parseDialogContent(block.content);
            if (dialog.characters.length < 2 || dialog.characters.some(character => !text(character.name))) {
                return fieldError("Bohaterowie dialogu", "Dialog wymaga dwóch nazwanych bohaterów.");
            }
            if (!dialog.studentCharacterId || !dialog.characters.some(character => String(character.id) === String(dialog.studentCharacterId))) {
                return fieldError("Postać ucznia", "Wybierz postać, w którą wciela się uczeń.");
            }
        }
        if (VOCABULARY_TYPES.has(type)) {
            const label = type === "LISTENING" ? "Nagrania — jedno w wierszu" : "Słówka — jedno w wierszu";
            if (!Array.isArray(config.items) || config.items.length < 1 || config.items.length > 20) {
                return fieldError(label, type === "LISTENING"
                    ? "Dodaj od 1 do 20 nagrań z zapisem i poprawną odpowiedzią."
                    : "Dodaj od 1 do 20 słówek wraz z tłumaczeniem.");
            }
            const incompleteItem = config.items.findIndex(item => !text(item?.term) || !text(item?.translation));
            if (incompleteItem >= 0) {
                return fieldError(label, `Pozycja ${incompleteItem + 1} wymaga słowa i tłumaczenia zapisanych jako tekst (słowo | tłumaczenie).`);
            }
        }
        if (type === "SENTENCE_BUILDER") {
            if (!text(config.polishSentence)) {
                return fieldError("Zdanie po polsku", "Dodaj polskie zdanie do przetłumaczenia.");
            }
            if (!Array.isArray(config.words) || config.words.length < 2 || config.words.length > 6) {
                return fieldError("Poprawne zdanie po angielsku", "Zdanie musi zawierać od 2 do 6 kafelków.");
            }
            const emptyWord = config.words.findIndex(word => !text(word));
            if (emptyWord >= 0) {
                return fieldError("Poprawne zdanie po angielsku", `Kafelek ${emptyWord + 1} musi zawierać niepusty tekst.`);
            }
        }
    }
    if (type === "QUIZ") {
        const options = typeof block.content === "string"
            ? block.content.split(/\r?\n/).map(option => option.trim()).filter(Boolean)
            : [];
        if (options.length < 2) {
            return fieldError("Odpowiedzi — każda w nowym wierszu", "Quiz wymaga przynajmniej dwóch odpowiedzi, każdej w osobnym wierszu.");
        }
        if (new Set(options.map(normalizeQuizOption)).size !== options.length) {
            return fieldError("Odpowiedzi — każda w nowym wierszu", "Wszystkie odpowiedzi quizu muszą być różne.");
        }
        if (!options.includes(block.expectedAnswer)) {
            return fieldError("Poprawna odpowiedź", "Wpisz pełną treść jednej z odpowiedzi quizu, dokładnie tak jak na liście, a nie samą literę.");
        }
    }
    if (TASK_TYPES.has(type)) {
        if (!text(block.instruction)) {
            return fieldError("Polecenie", "Dodaj polecenie do aktywności.");
        }
        if (!text(block.expectedAnswer)) {
            return fieldError(type === "OPEN_RESPONSE" || type === "CODE_REVIEW" ? "Model odpowiedzi i kryteria samooceny" : "Poprawna odpowiedź",
                type === "OPEN_RESPONSE" || type === "CODE_REVIEW"
                    ? "Dodaj model odpowiedzi i kryteria samooceny."
                    : "Dodaj poprawną odpowiedź do aktywności.");
        }
    }
    if (["DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW"].includes(type) && !text(block.starterCode)) {
        return fieldError(type === "DEBUGGING" ? "Kod z błędem" : "Kod startowy",
            type === "DEBUGGING" ? "Dodaj kod z błędem, który uczeń ma naprawić."
                : type === "PREDICT_OUTPUT" ? "Dodaj kod, którego wynik uczeń ma przewidzieć."
                    : "Dodaj kod do analizy.");
    }
    if (type === "PRACTICAL_LAB") {
        if (!text(block.instruction)) {
            return fieldError("Cel i wymagania laboratorium", "Dodaj cel i wymagania laboratorium.");
        }
        if (!text(block.content)) {
            return fieldError("Weryfikacja i kryteria ukończenia", "Dodaj sposób weryfikacji i kryteria ukończenia.");
        }
    }
    return "";
}
