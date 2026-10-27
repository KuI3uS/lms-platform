import { MAX_BLOCK_TITLE_LENGTH, MAX_LESSON_BLOCKS } from "./lessonBlockLimits.js";
import {
    createEmptyDialogConfig,
    parseDialogueEditor,
    parseVocabularyEditor,
    serializeDialogConfig,
    serializeVocabularyConfig
} from "./languageInteractiveBlocks.js";
import { createSentenceBuilderConfig, serializeSentenceBuilderConfig } from "./sentenceBuilder.js";
import { getBlockBaseXp, REWARDED_BLOCK_TYPES } from "./lessonBlockRewards.js";
import { cleanChatGptText } from "./chatGptReferences.js";
import { getChatGptLessonPrompt } from "./lessonImportPrompt.js";
import { getLessonBlockValidationError } from "./lessonBlockValidation.js";
import { normalizeCodeLanguage } from "./codeLanguages.js";

const TYPE_MAP = {
    tekst: "TEXT",
    material: "TEXT",
    informacja: "INFO",
    wskazowka: "TIP",
    ostrzezenie: "WARNING",
    podsumowanie: "SUMMARY",
    quiz: "QUIZ",
    zadanie: "TASK",
    "laboratorium praktyczne": "PRACTICAL_LAB",
    "zadanie praktyczne": "PRACTICAL_LAB",
    debugowanie: "DEBUGGING",
    "napraw kod": "DEBUGGING",
    "przewidz wynik": "PREDICT_OUTPUT",
    "przewidywanie wyniku": "PREDICT_OUTPUT",
    "analiza kodu": "CODE_REVIEW",
    "analiza kodu / code review": "CODE_REVIEW",
    "code review": "CODE_REVIEW",
    "odpowiedz otwarta": "OPEN_RESPONSE",
    "przyklad kodu": "EXAMPLE",
    obraz: "IMAGE",
    film: "VIDEO",
    "audio i wymowa": "AUDIO",
    "audio i cwiczenie wymowy": "AUDIO",
    "cwiczenie wymowy": "AUDIO",
    "cwiczenie jezykowe": "TASK",
    dialog: "DIALOG",
    "dialog interaktywny": "DIALOG",
    "scenka dialogowa": "DIALOG",
    "trening slowek": "VOCABULARY",
    slownictwo: "VOCABULARY",
    "cwiczenie slownictwa": "VOCABULARY",
    "laboratorium slow": "WORD_LAB",
    "aktywny trening slow": "WORD_LAB",
    "rozpoznawanie ze sluchu": "LISTENING",
    dyktando: "LISTENING",
    "ukladanie zdania": "SENTENCE_BUILDER",
    "kafelki ze slowami": "SENTENCE_BUILDER",
    "rozsypanka wyrazowa": "SENTENCE_BUILDER",
    plik: "PDF",
    cytat: "QUOTE",
    separator: "DIVIDER"
};

const FIELD_ALIASES = [
    ["typ bloku", "type"],
    ["tytul rozdzialu", "title"],
    ["tytul wskazowki", "title"],
    ["tytul ostrzezenia", "title"],
    ["tytul informacji", "title"],
    ["tytul podsumowania", "title"],
    ["tytul grafiki", "title"],
    ["tytul filmu", "title"],
    ["tytul cwiczenia", "title"],
    ["tytul dialogu", "title"],
    ["tytul treningu", "title"],
    ["tytul laboratorium", "title"],
    ["tytul cwiczenia sluchowego", "title"],
    ["tytul ukladanki", "title"],
    ["tytul przykladu", "title"],
    ["tytul debugowania", "title"],
    ["tytul analizy", "title"],
    ["tytul odpowiedzi otwartej", "title"],
    ["nazwa pliku", "title"],
    ["naglowek cytatu", "title"],
    ["nazwa kolejnej czesci (opcjonalnie)", "title"],
    ["tytul", "title"],
    ["tresc materialu", "content"],
    ["tresc wskazowki", "content"],
    ["co moze pojsc zle?", "content"],
    ["dodatkowy kontekst", "content"],
    ["najwazniejsze punkty", "content"],
    ["zwrot do wypowiedzenia", "content"],
    ["kod przykladu", "content"],
    ["weryfikacja i kryteria ukonczenia", "content"],
    ["tresc cytatu", "content"],
    ["odpowiedzi — kazda w nowym wierszu", "content"],
    ["odpowiedzi - kazda w nowym wierszu", "content"],
    ["odpowiedzi", "content"],
    ["tresc", "content"],
    ["dialog", "dialog"],
    ["slowka — jedno w wierszu", "vocabulary"],
    ["slowka - jedno w wierszu", "vocabulary"],
    ["slowka", "vocabulary"],
    ["zdanie po polsku", "polishSentence"],
    ["poprawne zdanie po angielsku", "englishSentence"],
    ["zdanie po angielsku", "englishSentence"],
    ["opis pod grafika", "description"],
    ["opis przed filmem", "description"],
    ["krotka instrukcja", "description"],
    ["co pokazuje ten przyklad?", "description"],
    ["opis zalacznika", "description"],
    ["autor lub zrodlo", "description"],
    ["wprowadzenie (opcjonalnie)", "description"],
    ["opis", "description"],
    ["opis sytuacji", "description"],
    ["srodowisko i sytuacja", "description"],
    ["objaw bledu", "description"],
    ["kontekst", "description"],
    ["instrukcja dla ucznia", "description"],
    ["wprowadzenie", "description"],
    ["pytanie", "question"],
    ["odpowiedz a", "answerA"],
    ["odpowiedz b", "answerB"],
    ["odpowiedz c", "answerC"],
    ["odpowiedz d", "answerD"],
    ["poprawna odpowiedz", "correctAnswer"],
    ["poprawny wynik programu", "correctAnswer"],
    ["poprawiony kod", "correctAnswer"],
    ["model odpowiedzi i kryteria samooceny", "correctAnswer"],
    ["model odpowiedzi", "correctAnswer"],
    ["akceptowane odpowiedzi", "correctAnswer"],
    ["pierwsza wskazowka", "hint"],
    ["wskazowka po pierwszym bledzie", "hint"],
    ["podstawowa podpowiedz (1. bledna proba)", "hint"],
    ["dokladniejsza podpowiedz", "detailedHint"],
    ["dokladniejsza podpowiedz (od 2. blednej proby)", "detailedHint"],
    ["wyjasnienie po kolejnych probach", "detailedHint"],
    ["wyjasnienie rozwiazania", "solutionExplanation"],
    ["wyjasnienie rozwiazania (od 4. blednej proby)", "solutionExplanation"],
    ["polecenie", "instruction"],
    ["cel i wymagania", "instruction"],
    ["zadanie naprawcze", "instruction"],
    ["pytanie do kodu", "instruction"],
    ["pytanie i kryteria odpowiedzi", "instruction"],
    ["kod startowy", "starterCode"],
    ["kod z bledem", "starterCode"],
    ["kod do przeanalizowania", "starterCode"],
    ["kod do analizy", "starterCode"],
    ["ukryte testy uruchomieniowe", "hiddenTests"],
    ["jezyk", "language"],
    ["jezyk rozpoznawania", "language"],
    ["jezyk audio", "language"],
    ["postac 1", "character1"],
    ["avatar postaci 1", "avatar1"],
    ["postac 2", "character2"],
    ["avatar postaci 2", "avatar2"],
    ["rola ucznia", "studentCharacter"],
    ["adres obrazu", "mediaUrl"],
    ["link do filmu", "mediaUrl"],
    ["adres pliku audio (opcjonalnie)", "mediaUrl"],
    ["adres pliku", "mediaUrl"],
    ["styl", "mediaType"],
    ["punkty (xp)", "points"],
    ["punkty xp", "points"],
    ["punkty", "points"],
    ["xp", "points"],
    ["najwazniejsze informacje", "summary"],
    ["po tej lekcji potrafisz", "skills"]
];

const SECTION_LABELS = new Set([
    "podstawowe informacje",
    "kod",
    "sprawdzanie"
]);

function normalize(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l")
        .replace(/Ł/g, "L")
        .replace(/\*\*/g, "")
        .replace(/^#{1,6}\s*/, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function readField(line) {
    const cleaned = String(line || "")
        .replace(/\*\*/g, "")
        .replace(/^#{1,6}\s*/, "")
        .trim();
    const normalized = normalize(cleaned.replace(/:$/, ""));

    for (const [label, key] of FIELD_ALIASES) {
        if (normalized === label) return { key, inlineValue: "" };
        if (normalized.startsWith(`${label}:`)) {
            return {
                key,
                inlineValue: cleaned.slice(cleaned.indexOf(":") + 1).trim()
            };
        }
    }
    return null;
}

function unwrapFencedValue(value) {
    const text = String(value || "").trim();
    const lines = text.split("\n");
    const opening = lines[0]?.match(/^(`{3,}|~{3,})[^\n]*$/);
    if (!opening || lines.length < 2) return text;
    const closing = new RegExp(`^${opening[1][0]}{${opening[1].length},}\\s*$`);
    return closing.test(lines.at(-1).trim()) ? lines.slice(1, -1).join("\n") : text;
}

function splitSteps(source) {
    const steps = [];
    let current = null;
    let fence = null;

    unwrapFencedValue(source).replace(/\r\n?/g, "\n").split("\n").forEach((line) => {
        const marker = line.trim().match(/^(`{3,}|~{3,})(.*)$/);
        if (fence) {
            if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
            if (current) current.lines.push(line);
            return;
        }
        if (marker) {
            fence = marker[1];
            if (current) current.lines.push(line);
            return;
        }
        const stepMatch = normalize(line).match(/^krok\s+(\d+)\b(.*)$/);
        if (stepMatch) {
            if (current) steps.push(current);
            current = {
                number: Number(stepMatch[1]),
                heading: stepMatch[2].replace(/^[\s—–-]+/, "").trim(),
                lines: []
            };
        } else if (current) {
            current.lines.push(line);
        }
    });

    if (current) steps.push(current);
    return { steps, unclosedFence: Boolean(fence) };
}

function fieldsFromLines(lines) {
    const fields = {};
    let activeKey = null;
    let fence = null;

    lines.forEach((line) => {
        const marker = line.trim().match(/^(`{3,}|~{3,})(.*)$/);
        if (fence || marker) {
            if (activeKey) fields[activeKey] = fields[activeKey] ? `${fields[activeKey]}\n${line}` : line;
            if (!fence) fence = marker[1];
            else if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
            return;
        }
        if (SECTION_LABELS.has(normalize(line)) && !(activeKey && !fields[activeKey]?.trim())) {
            activeKey = null;
            return;
        }
        const field = readField(line);
        if (field) {
            const fieldAlreadyFilled = Object.prototype.hasOwnProperty.call(fields, field.key)
                && Boolean(fields[field.key]?.trim());
            if (fieldAlreadyFilled) {
                if (activeKey) {
                    fields[activeKey] = fields[activeKey]
                        ? `${fields[activeKey]}\n${line}`
                        : line;
                }
                return;
            }
            activeKey = field.key;
            fields[activeKey] = field.inlineValue;
            return;
        }
        if (!activeKey) return;
        fields[activeKey] = fields[activeKey]
            ? `${fields[activeKey]}\n${line}`
            : line;
    });

    return Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, ["starterCode", "correctAnswer", "hiddenTests"].includes(key) ? unwrapFencedValue(value) : value.trim()])
    );
}

function normalizeLanguage(value, fallback = "") {
    const language = normalize(String(value || "").split("\n")[0]);
    const codeLanguage = normalizeCodeLanguage(language);
    if (codeLanguage) return codeLanguage;
    const languages = {
        "en-us": "en-US",
        "en-gb": "en-GB",
        "angielski (stany zjednoczone)": "en-US",
        "angielski (usa)": "en-US",
        "angielski (wielka brytania)": "en-GB",
        "angielski (brytyjski)": "en-GB",
        "de-de": "de-DE",
        "es-es": "es-ES",
        "fr-fr": "fr-FR",
        "it-it": "it-IT",
        "pl-pl": "pl-PL"
    };
    return languages[language] || fallback;
}

function resolveType(rawType, heading) {
    const normalizedType = normalize(rawType || heading);

    const typeKey = Object.keys(TYPE_MAP).find(
        (key) => normalizedType === key || normalizedType.startsWith(`${key} `)
    );
    return {
        type: TYPE_MAP[typeKey],
        languageExercise: normalizedType.startsWith("cwiczenie jezykowe")
    };
}

function summaryContent(fields) {
    return [
        fields.summary && `Najważniejsze informacje\n${fields.summary}`,
        fields.skills && `Po tej lekcji potrafisz\n${fields.skills}`
    ].filter(Boolean).join("\n\n");
}

function stableHash(value) {
    return Array.from(String(value || "")).reduce(
        (hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0,
        0
    );
}

function distributeQuizAnswer(answers, correctAnswer, seed) {
    const correctIndex = answers.indexOf(correctAnswer);
    if (correctIndex < 0 || answers.length < 2) return answers;

    const reordered = [...answers];
    const [correct] = reordered.splice(correctIndex, 1);
    const targetIndex = stableHash(seed) % answers.length;
    reordered.splice(targetIndex, 0, correct);
    return reordered;
}

function parseStep(step, warnings, errors, variant) {
    const initialErrorCount = errors.length;
    const fields = fieldsFromLines(step.lines);
    const resolved = resolveType(fields.type, step.heading);
    if (!resolved.type) {
        errors.push(`Krok ${step.number}: nie rozpoznano typu bloku „${fields.type || step.heading || "brak"}”.`);
        return null;
    }

    const block = {
        title: fields.title || (resolved.type === "DIVIDER" ? "" : `Krok ${step.number}`),
        type: resolved.type,
        content: fields.content || "",
        description: fields.description || "",
        instruction: fields.instruction || "",
        starterCode: fields.starterCode || "",
        expectedAnswer: "",
        hint: fields.hint || "",
        detailedHint: fields.detailedHint || "",
        solutionExplanation: fields.solutionExplanation || "",
        hiddenTests: fields.hiddenTests || "",
        language: fields.language || "",
        mediaUrl: fields.mediaUrl || "",
        mediaType: fields.mediaType || "",
        published: true,
        points: 0
    };

    if (resolved.type === "SUMMARY") {
        block.content = summaryContent(fields) || fields.content;
    }

    if (resolved.type === "QUIZ") {
        const answersFromList = (fields.content || "")
            .split("\n")
            .map((answer) => answer.trim())
            .filter(Boolean);
        const legacyAnswers = [fields.answerA, fields.answerB, fields.answerC, fields.answerD].filter(Boolean);
        const answers = answersFromList.length ? answersFromList : legacyAnswers;
        const correctKey = normalize(fields.correctAnswer).toUpperCase();
        const answerIndex = ["A", "B", "C", "D"].indexOf(correctKey);
        const correctAnswer = answers.includes(fields.correctAnswer)
            ? fields.correctAnswer
            : answerIndex >= 0
            ? answers[answerIndex] || ""
            : fields.correctAnswer || "";
        const distributedAnswers = distributeQuizAnswer(
            answers,
            correctAnswer,
            `${step.number}:${fields.question || block.title}`
        );
        block.instruction = fields.question || fields.instruction || block.title;
        block.title = fields.question || block.title;
        block.content = distributedAnswers.join("\n");
        block.expectedAnswer = correctAnswer;
        block.detailedHint = fields.detailedHint || fields.solutionExplanation || "";
        if (answers.length < 2) {
            errors.push(`Krok ${step.number}: quiz wymaga co najmniej dwóch odpowiedzi zapisanych pod polem „Odpowiedzi — każda w nowym wierszu”.`);
        } else if (new Set(answers.map(normalize)).size !== answers.length) {
            errors.push(`Krok ${step.number}: wszystkie odpowiedzi quizu muszą być różne.`);
        } else if (!block.expectedAnswer || !answers.includes(block.expectedAnswer)) {
            errors.push(`Krok ${step.number}: „Poprawna odpowiedź” musi być pełną treścią jednego z wierszy odpowiedzi.`);
        }
    }

    if (["TASK", "DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW", "OPEN_RESPONSE"].includes(resolved.type)) {
        block.instruction = fields.instruction || fields.content;
        block.expectedAnswer = fields.correctAnswer || "";
        block.language = resolved.languageExercise || (variant === "LANGUAGE" && resolved.type === "TASK") || resolved.type === "OPEN_RESPONSE"
            ? ""
            : normalizeLanguage(fields.language, "java");
        if (!block.expectedAnswer) {
            errors.push(`Krok ${step.number}: pole „Poprawna odpowiedź” jest puste. Dodaj pełne rozwiązanie albo wybierz „Odpowiedź otwarta” lub „Laboratorium praktyczne” z wymaganymi kryteriami.`);
        }
    }

    if (resolved.type === "PRACTICAL_LAB") {
        block.instruction = fields.instruction || "";
        block.content = fields.content || "";
        block.language = "";
        if (!block.instruction) {
            errors.push(`Krok ${step.number}: laboratorium wymaga pola „Cel i wymagania”.`);
        }
        if (!block.content) {
            errors.push(`Krok ${step.number}: laboratorium wymaga pola „Weryfikacja i kryteria ukończenia”.`);
        }
    }

    if (["DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW"].includes(resolved.type) && !block.starterCode) {
        errors.push(`Krok ${step.number}: blok „${block.title}” wymaga kodu do analizy.`);
    }

    if (resolved.type === "EXAMPLE") {
        block.language = normalizeLanguage(fields.language, "java");
        block.content = unwrapFencedValue(block.content);
    }

    if (resolved.type === "IMAGE") block.mediaType = "image";
    if (resolved.type === "VIDEO") block.mediaType = "video";
    if (resolved.type === "PDF") block.mediaType = "file";
    if (resolved.type === "AUDIO") {
        block.mediaType = "audio";
        block.language = normalizeLanguage(fields.language, "en-US");
    }
    if (resolved.type === "DIALOG") {
        const config = createEmptyDialogConfig();

        config.characters = [
            {
                ...config.characters[0],
                name: (fields.character1 || "Emma").trim(),
                avatar: (fields.avatar1 || "👩").trim()
            },
            {
                ...config.characters[1],
                name: (fields.character2 || "Leo").trim(),
                avatar: (fields.avatar2 || "👨").trim()
            }
        ];
        const requestedStudent = normalize(fields.studentCharacter);
        const selectedStudent = config.characters.find(
            (character) => normalize(character.name) === requestedStudent
        );
        config.studentCharacterId = selectedStudent?.id || config.characters[1].id;
        config.turns = parseDialogueEditor(fields.dialog || fields.content, config.characters);
        block.content = serializeDialogConfig(config);
        block.language = normalizeLanguage(fields.language, "en-GB");
        block.mediaType = "dialog";
        if (config.turns.length < 2) {
            errors.push(`Krok ${step.number}: dialog wymaga co najmniej dwóch wypowiedzi w formacie „Postać: wypowiedź”.`);
        }
    }
    if (resolved.type === "VOCABULARY" || resolved.type === "WORD_LAB" || resolved.type === "LISTENING") {
        const items = parseVocabularyEditor(fields.vocabulary || fields.content);
        block.content = serializeVocabularyConfig({
            version: 1,
            kind: "vocabulary",
            items
        });
        block.language = normalizeLanguage(fields.language, "en-GB");
        block.mediaType = resolved.type === "WORD_LAB" ? "word-lab" : resolved.type === "LISTENING" ? "listening" : "vocabulary";
        if (items.length < 1) {
            errors.push(`Krok ${step.number}: trening słówek wymaga przynajmniej jednej pozycji.`);
        } else if (items.length > 20) {
            errors.push(`Krok ${step.number}: trening słówek zawiera ${items.length} pozycji, a maksymalnie może zawierać 20.`);
        }
        if (items.some((item) => !item.term || !item.translation)) {
            errors.push(`Krok ${step.number}: każde słówko musi mieć zapis „słowo | tłumaczenie”.`);
        }
    }
    if (resolved.type === "SENTENCE_BUILDER") {
        const config = createSentenceBuilderConfig(fields.polishSentence, fields.englishSentence);
        block.content = serializeSentenceBuilderConfig(config);
        block.language = normalizeLanguage(fields.language, "en-GB");
        block.mediaType = "sentence-builder";
        if (!config.polishSentence) {
            errors.push(`Krok ${step.number}: układanie zdania wymaga pola „Zdanie po polsku”.`);
        }
        if (config.words.length < 2 || config.words.length > 6) {
            errors.push(`Krok ${step.number}: poprawne zdanie po angielsku musi zawierać od 2 do 6 kafelków.`);
        }
    }
    if (resolved.type === "DIVIDER") {
        const dividerStyles = { gradient: "gradient", linia: "line", line: "line", kropki: "dots", dots: "dots" };
        block.mediaType = dividerStyles[normalize(fields.mediaType)] || "gradient";
    }

    if (resolved.type !== "DIVIDER" && !block.title?.trim()) {
        errors.push(`Krok ${step.number}: blok wymaga tytułu zgodnego z formularzem EduHub.`);
    }
    if (block.title?.trim().length > MAX_BLOCK_TITLE_LENGTH) {
        errors.push(`Krok ${step.number}: tytuł ma ${block.title.trim().length} znaków, a maksymalny limit wynosi ${MAX_BLOCK_TITLE_LENGTH}.`);
    }
    if (fields.language?.trim() && !normalizeLanguage(fields.language)) {
        errors.push(`Krok ${step.number}: pole „Język” ma nieobsługiwaną wartość „${fields.language.split("\n")[0]}”. Użyj tokenu z wzoru (np. javascript, java, sql, html, php, text albo en-GB), nie opisu języka.`);
    }

    if (["IMAGE", "VIDEO", "PDF"].includes(resolved.type) && !block.mediaUrl?.trim()) {
        errors.push(`Krok ${step.number}: blok „${block.title}” wymaga prawidłowego adresu materiału.`);
    }

    if (resolved.type === "AUDIO" && !block.content?.trim()) {
        errors.push(`Krok ${step.number}: blok audio wymaga zwrotu do wypowiedzenia.`);
    }

    if (["TEXT", "TIP", "WARNING", "INFO", "SUMMARY", "QUOTE", "EXAMPLE"]
        .includes(block.type) && !block.content) {
        errors.push(`Krok ${step.number}: blok „${block.title}” nie ma treści.`);
    }

    const pointsText = String(fields.points || "").trim().replace(/\s*XP$/i, "").replace(",", ".");
    const points = Number(pointsText);
    block.points = pointsText && Number.isFinite(points)
        ? Math.max(0, Math.min(Math.trunc(points), 1000))
        : getBlockBaseXp(block);
    if (fields.points?.trim() && (!pointsText || !Number.isFinite(points))) {
        warnings.push(`Krok ${step.number}: nie rozpoznano liczby punktów. Ustawiono ${block.points} XP.`);
    }

    if (errors.length === initialErrorCount) {
        const validationError = getLessonBlockValidationError(block);
        if (validationError) errors.push(`Krok ${step.number}: ${validationError}`);
    }
    return block;
}

export function parseChatGptLesson(source, maxBlocks = MAX_LESSON_BLOCKS, variant = "PROGRAMMING") {
    const cleanSource = cleanChatGptText(source);
    const warnings = [];
    const errors = [];
    if (/^(?:Przygotuj (?:kompletny pakiet|gotową lekcję)|Jesteś metodykiem)/i.test(cleanSource.trim()) && /KROK \[NUMER\]/.test(cleanSource)) {
        return { blocks: [], warnings: [], errors: ["Wklejono wzór promptu, a nie gotową lekcję. Najpierw wklej prompt do ChatGPT, a tutaj wklej jego odpowiedź rozpoczynającą się od KROK 1."] };
    }
    const { steps, unclosedFence } = splitSteps(cleanSource);
    if (unclosedFence) errors.push("Kod ma niezamknięty blok backticków. Dodaj końcowe potrójne backticki przed następnym polem; sprawdź, czy odpowiedź ChatGPT nie została ucięta.");
    if (cleanSource.trim() && steps.length === 0) {
        errors.push("Nie znaleziono kroków. Każdy blok rozpocznij od nagłówka KROK 1, KROK 2 itd.");
    }
    if (steps.length > maxBlocks) {
        errors.push(
            `Lekcja zawiera ${steps.length} bloków. Maksymalnie można zaimportować ${maxBlocks}; podziel materiał na dwie lekcje.`
        );
    }

    steps.forEach((step, index) => {
        if (step.number !== index + 1) errors.push(`Numeracja kroków: oczekiwano KROK ${index + 1}, a otrzymano KROK ${step.number}. W jednej lekcji użyj kolejnych numerów od 1, bez luk i powtórzeń.`);
    });
    const blocks = steps
        .map((step) => parseStep(step, warnings, errors, variant))
        .filter(Boolean);

    if (cleanSource.trim() && errors.length === 0) {
        const interactiveCount = blocks.filter((block) => REWARDED_BLOCK_TYPES.has(block.type)).length;
        if (interactiveCount < Math.ceil(blocks.length * 0.6)) {
            warnings.push("Lekcja ma mniej niż 60% aktywnej praktyki. Dodaj odpowiedni blok zadaniowy zamiast kolejnego fragmentu teorii.");
        }
        if (variant === "LANGUAGE") {
            const types = new Set(blocks.map((block) => block.type));
            if (!types.has("DIALOG")) {
                warnings.push("W lekcji językowej brakuje dialogu, który ćwiczy użycie języka w sytuacji komunikacyjnej.");
            }
            if (!types.has("AUDIO")) {
                warnings.push("W lekcji językowej brakuje ćwiczenia wymowy lub mówienia.");
            }
            if (!types.has("SENTENCE_BUILDER")) {
                warnings.push("W lekcji językowej brakuje układania zdania utrwalającego szyk wyrazów.");
            }
        }
    }

    return { blocks, warnings, errors };
}

export { getChatGptLessonPrompt };
export const CHAT_GPT_LESSON_PROMPT = getChatGptLessonPrompt();
