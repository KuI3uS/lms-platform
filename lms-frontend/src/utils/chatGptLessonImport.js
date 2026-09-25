import { MAX_LESSON_BLOCKS } from "./lessonBlockLimits.js";
import {
    createEmptyDialogConfig,
    parseDialogueEditor,
    parseVocabularyEditor,
    serializeDialogConfig,
    serializeVocabularyConfig
} from "./languageInteractiveBlocks.js";
import { createSentenceBuilderConfig, serializeSentenceBuilderConfig } from "./sentenceBuilder.js";

const TYPE_MAP = {
    tekst: "TEXT",
    material: "TEXT",
    informacja: "INFO",
    wskazowka: "TIP",
    ostrzezenie: "WARNING",
    podsumowanie: "SUMMARY",
    quiz: "QUIZ",
    zadanie: "TASK",
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
    ["instrukcja dla ucznia", "description"],
    ["wprowadzenie", "description"],
    ["pytanie", "question"],
    ["odpowiedz a", "answerA"],
    ["odpowiedz b", "answerB"],
    ["odpowiedz c", "answerC"],
    ["odpowiedz d", "answerD"],
    ["poprawna odpowiedz", "correctAnswer"],
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
    ["kod startowy", "starterCode"],
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

function splitSteps(source) {
    const steps = [];
    let current = null;

    String(source || "").replace(/\r\n?/g, "\n").split("\n").forEach((line) => {
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
    return steps;
}

function fieldsFromLines(lines) {
    const fields = {};
    let activeKey = null;

    lines.forEach((line) => {
        if (SECTION_LABELS.has(normalize(line))) {
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
        Object.entries(fields).map(([key, value]) => [key, value.trim()])
    );
}

function normalizeLanguage(value, fallback = "") {
    const language = normalize(String(value || "").split("\n")[0]);
    const languages = {
        java: "java",
        javascript: "javascript",
        python: "python",
        "c#": "csharp",
        csharp: "csharp",
        sql: "sql",
        html: "html",
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
    const practical = normalizedType.includes("zadanie praktyczne");
    if (practical) return { type: "TEXT", practical: true, languageExercise: false };

    const typeKey = Object.keys(TYPE_MAP).find(
        (key) => normalizedType === key || normalizedType.startsWith(`${key} `)
    );
    return {
        type: TYPE_MAP[typeKey],
        practical: false,
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

function parseStep(step, warnings, errors) {
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
        points: Math.max(0, Math.min(Number(fields.points) || 0, 1000))
    };

    if (resolved.practical) {
        block.content = `Zadanie praktyczne\n\n${fields.content || fields.instruction || ""}`.trim();
        warnings.push(`Krok ${step.number}: zadanie praktyczne zostanie zapisane jako czytelny blok materiału.`);
    }

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
        const correctAnswer = answerIndex >= 0
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

    if (resolved.type === "TASK") {
        block.instruction = fields.instruction || fields.content;
        block.expectedAnswer = fields.correctAnswer || "";
        block.language = resolved.languageExercise
            ? ""
            : normalizeLanguage(fields.language, "java");
        if (!block.expectedAnswer) {
            block.type = "TEXT";
            block.content = `Zadanie\n\n${block.instruction}`.trim();
            block.instruction = "";
            warnings.push(`Krok ${step.number}: zadanie bez poprawnej odpowiedzi zostanie zapisane jako materiał.`);
        }
    }

    if (resolved.type === "EXAMPLE") {
        block.language = normalizeLanguage(fields.language, "java");
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
    if (block.title?.trim().length > 255) {
        errors.push(`Krok ${step.number}: tytuł ma ${block.title.trim().length} znaków, a maksymalny limit wynosi 255.`);
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

    return block;
}

export function parseChatGptLesson(source, maxBlocks = MAX_LESSON_BLOCKS, variant = "PROGRAMMING") {
    const warnings = [];
    const errors = [];
    const steps = splitSteps(source);
    if (String(source || "").trim() && steps.length === 0) {
        errors.push("Nie znaleziono kroków. Każdy blok rozpocznij od nagłówka KROK 1, KROK 2 itd.");
    }
    if (steps.length > maxBlocks) {
        errors.push(
            `Lekcja zawiera ${steps.length} bloków. Maksymalnie można zaimportować ${maxBlocks}; podziel materiał na dwie lekcje.`
        );
    }

    const blocks = steps
        .map((step) => parseStep(step, warnings, errors))
        .filter(Boolean);

    if (String(source || "").trim() && errors.length === 0) {
        const interactiveTypes = new Set(["AUDIO", "DIALOG", "VOCABULARY", "WORD_LAB", "LISTENING", "SENTENCE_BUILDER", "TASK", "QUIZ"]);
        const interactiveCount = blocks.filter((block) => interactiveTypes.has(block.type)).length;
        if (blocks.length < Math.min(10, maxBlocks)) {
            warnings.push("Ta lekcja jest krótka. Dla pełnej, zaawansowanej lekcji zalecamy co najmniej 10 zróżnicowanych bloków.");
        }
        if (interactiveCount < Math.min(6, Math.ceil(blocks.length / 2))) {
            warnings.push("Lekcja ma mało aktywnej praktyki. Dodaj więcej zadań, wymowy, dialogów, układanek lub quizów zamiast kolejnych bloków teorii.");
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

export function getChatGptLessonPrompt(maxBlocks = MAX_LESSON_BLOCKS, variant = "PROGRAMMING") {
    const languageLesson = variant === "LANGUAGE";
    const allowedTypes = languageLesson
        ? "Tekst, Wskazówka, Informacja, Podsumowanie, Obraz, Film, Audio i wymowa, Rozpoznawanie ze słuchu, Dialog interaktywny, Trening słówek, Laboratorium słów, Układanie zdania, Zadanie, Quiz"
        : "Tekst, Wskazówka, Ostrzeżenie, Informacja, Podsumowanie, Obraz, Film, Audio i wymowa, Przykład kodu, Zadanie, Quiz, Plik, Cytat, Separator";
    const interactiveLanguageTemplates = languageLesson ? `
DIALOG INTERAKTYWNY — cały dialog jest jednym blokiem bez względu na liczbę wypowiedzi. Może mieć 2, 20 albo 60 wypowiedzi. Nie dziel jednej scenki na osobne bloki.
KROK [NUMER]
Typ bloku
Dialog interaktywny
Tytuł dialogu
[tytuł]
Opis sytuacji
[krótki naturalny kontekst]
Postać 1
[imię]
Avatar postaci 1
[jedno emoji]
Postać 2
[imię]
Avatar postaci 2
[jedno emoji]
Rola ucznia
[dokładne imię postaci, której kwestie uczeń ma mówić lub wpisywać]
Dialog
Emma: Good morning!
Leo: Good morning! || Morning! || „Good morning” jest neutralnym porannym powitaniem. || Dzień dobry!
Emma: How are you?
Leo: I'm good, thanks. || Fine, thanks.; I'm fine, thank you. || Po pytaniu o samopoczucie podajemy stan i możemy podziękować. || Mam się dobrze, dziękuję.
Język audio
[np. en-GB]

W polu Dialog każdy wiersz ma format „Postać: wypowiedź”. Dla kwestii roli ucznia dopisz po znakach || kolejno: alternatywne poprawne odpowiedzi oddzielone średnikami, krótkie wyjaśnienie korekty oraz polskie zdanie, które uczeń ma przetłumaczyć na angielski. Nie dodawaj oznaczeń A, B, C ani osobnych KROKÓW dla wypowiedzi.

TRENING SŁÓWEK — cały zestaw od 1 do 20 słówek jest jednym blokiem. Uczeń najpierw widzi fiszki, a następnie sam wpisuje tłumaczenia.
KROK [NUMER]
Typ bloku
Trening słówek
Tytuł treningu
[tytuł]
Instrukcja dla ucznia
[krótka instrukcja]
Słówka — jedno w wierszu
hello | cześć | Hello, Anna! | hej; dzień dobry
good morning | dzień dobry | Good morning, Emma!
bye | cześć, do widzenia | Bye, Leo! | goodbye
Język audio
[np. en-GB]

Każdy wiersz słówka ma format „słowo lub zwrot | polskie znaczenie | przykład opcjonalny | inne uznawane odpowiedzi oddzielone średnikami”. Nie przekraczaj 20 pozycji w jednym treningu.

LABORATORIUM SŁÓW — używaj dla 3–8 najważniejszych słów lekcji. Uczeń musi poprawnie przypomnieć znaczenie i wymówić każde słowo; błędu nie da się pominąć.
KROK [NUMER]
Typ bloku
Laboratorium słów
Tytuł laboratorium
[tytuł]
Instrukcja dla ucznia
[wyjaśnij, że każde słowo trzeba rozpoznać i powiedzieć]
Słówka — jedno w wierszu
[słowo | polskie znaczenie | naturalny przykład | inne poprawne znaczenia oddzielone średnikami]
Język audio
[np. en-GB]

ROZPOZNAWANIE ZE SŁUCHU — odpowiedź jest ukryta do czasu poprawnej próby. Używaj do alfabetu, liczb, godzin, minimal pairs, słów, krótkich zdań i dyktand.
KROK [NUMER]
Typ bloku
Rozpoznawanie ze słuchu
Tytuł ćwiczenia słuchowego
[tytuł]
Instrukcja dla ucznia
Posłuchaj i wpisz to, co słyszysz.
Słówka — jedno w wierszu
[tekst czytany przez lektora | dokładna odpowiedź ucznia | opcjonalny kontekst | inne uznawane odpowiedzi]
Język audio
[np. en-GB]

UKŁADANIE ZDANIA — uczeń układa tłumaczenie z 2–6 pomieszanych kafelków. Każdy wyraz oddzielony spacją jest jednym kafelkiem.
KROK [NUMER]
Typ bloku
Układanie zdania
Tytuł układanki
[tytuł]
Zdanie po polsku
[zdanie, które widzi uczeń]
Poprawne zdanie po angielsku
[od 2 do 6 wyrazów w poprawnej kolejności]
Język
en-GB
` : "";
    const subjectMethodology = languageLesson ? `
METODYKA LEKCJI JĘZYKOWEJ
- Najpierw ustal poziom CEFR ucznia, jedną sytuację komunikacyjną i jedno zachowanie końcowe, np. „uczeń samodzielnie zamawia napój i reaguje na dwa pytania sprzedawcy”. Jeżeli danych brakuje, wywnioskuj je z tematu i miejsca w kursie.
- Używaj naturalnego, współczesnego angielskiego. Wybierz jedną odmianę, en-GB albo en-US, i zachowaj ją konsekwentnie w zapisie, audio, słownictwie i dialogach.
- Dla A1 używaj częstych słów, krótkich komunikatów, konkretnych sytuacji i polskich podpór. Na kolejnych poziomach stopniowo ograniczaj polski i zwiększaj samodzielność, długość wypowiedzi oraz niejednoznaczność sytuacji.
- Zbuduj progresję: zrozumiały materiał wejściowy → zauważenie znaczenia lub reguły → kontrolowana praktyka → samodzielne przypomnienie → szyk zdania → wypowiedź na głos → dialog → transfer do nowej sytuacji → krótka powtórka.
- Co najmniej 60% bloków ma wymagać działania ucznia. Dla lekcji około 45 minut twórz zwykle 12–18 bloków, w tym 7–12 bloków aktywnych. Krótszą lekcję twórz tylko wtedy, gdy użytkownik wyraźnie o nią poprosi.
- Każdy nowy zwrot wykorzystaj co najmniej trzy razy w różnych czynnościach, np. rozpoznanie, układanie zdania i samodzielna wypowiedź. Nie powtarzaj jednak identycznego pytania ani identycznego przykładu.
- Najpierw rozpoznaj rodzaj kompetencji. Laboratorium słów stosuj wyłącznie dla prawdziwego słownictwa mającego znaczenie lub tłumaczenie, np. „house → dom”. Nigdy nie twórz pozycji „N → litera N”, „B → litera B” ani podobnych sztucznych tłumaczeń.
- Dla alfabetu, liczb, godzin, minimal pairs, dyktanda oraz rozpoznawania zapisu ze słuchu używaj bloku „Rozpoznawanie ze słuchu”, który ukrywa odpowiedź. Dla alfabetu buduj kolejno: poznanie pojedynczych liter → rozpoznanie ze słuchu → trudne pary → zapis usłyszanego literowania → samodzielne literowanie krótkiego słowa.
- W lekcjach o czytaniu i wymowie stosuj kolejność: uczeń słyszy → rozpoznaje i zapisuje → widzi zapis → sam wymawia → dopiero potem otrzymuje krótką regułę. Nie zaczynaj od długiej teorii o zapisie.
- Dobieraj zadania do celu, zamiast mechanicznie używać wszystkich typów. Laboratorium słów dodaj tylko wtedy, gdy lekcja rzeczywiście wprowadza 3–8 nowych jednostek leksykalnych.
- Każda kwestia ucznia w dialogu musi mieć w czwartym polu po znakach || konkretne polskie zdanie do przetłumaczenia, np. „Dzień dobry!”. Nigdy nie wpisuj ogólnej instrukcji „odpowiedz po angielsku”. Dodaj naturalne alternatywy tylko wtedy, gdy naprawdę pasują do kontekstu.
- Jedno ćwiczenie „Audio i wymowa” ma sprawdzać jedną literę, jedno słowo albo krótki naturalny zwrot — maksymalnie 5 słów. Nigdy nie każ w jednym nagraniu wymawiać całego alfabetu, długiej listy słów ani serii „A. B. C. D...”. Podziel taki materiał na kilka celowych prób i przeplataj go rozpoznawaniem znaczenia.
- Alfabetu nie ucz jako recytacji długich zakresów. Ćwicz pojedyncze litery w parach łatwych do pomylenia, następnie rozpoznawanie ze słuchu, literowanie krótkiego imienia lub słowa i dopiero na końcu praktyczne literowanie w dialogu.
- Układanka ma zawierać 2–6 sensownych kafelków. Dłuższą wypowiedź rozbij na kilka celowych ćwiczeń, a nie na przypadkowe fragmenty.
- Dystraktory quizu mają odzwierciedlać typowe błędy ucznia, ale poprawna odpowiedź musi być jednoznaczna. Sprawdzaj znaczenie, dobór zwrotu, szyk, gramatykę i reakcję w sytuacji, a nie samą pamięć definicji.
- Nie ucz kilku nowych reguł naraz. Wyjaśniaj krótko, przykład pokazuj w innym kontekście niż zadanie, a błędną odpowiedź wykorzystuj do konkretnej, życzliwej korekty.
` : `
METODYKA LEKCJI PRZEDMIOTOWEJ
- Najpierw ustal jedną obserwowalną umiejętność końcową i dowód jej opanowania. Jeśli danych brakuje, wywnioskuj rozsądny poziom z tematu oraz miejsca w kursie.
- Zbuduj progresję: aktywacja wcześniejszej wiedzy → krótkie wyjaśnienie → przykład → zadanie kontrolowane → samodzielne zastosowanie w nowym kontekście → diagnoza błędu → transfer → podsumowanie.
- Co najmniej 60% bloków ma wymagać działania ucznia. Dla lekcji około 45 minut twórz zwykle 10–18 bloków i 2–5 zróżnicowanych zadań praktycznych.
- Trudność zwiększaj jednym wymiarem naraz. Przykład i zadanie muszą korzystać z innych danych, nazw lub sytuacji.
- Sprawdzaj rozumienie i zastosowanie, nie przepisywanie gotowego rozwiązania ani pamięciowe odtworzenie definicji.
`;
    return `Jesteś metodykiem i nauczycielem. Przygotuj kompletną lekcję do importu w EduHub.

NAJWAŻNIEJSZA ZASADA LEKCJI
- Jedna lekcja rozwija jedną konkretną umiejętność i zawiera od 10 do maksymalnie ${maxBlocks} bloków, chyba że użytkownik wyraźnie poprosi o krótszą formę.
- Najpierw zaplanuj lekcję wewnętrznie, ale nie pokazuj planu ani komentarzy. Zwróć tylko gotowe bloki.
- Zachowaj logiczny rytm: krótkie wyjaśnienie problemu, demonstracja jednego nowego pojęcia na innym przykładzie, samodzielna praktyka o rosnącej trudności, sprawdzenie zrozumienia i krótkie podsumowanie.
- Nie próbuj używać wszystkich dostępnych typów bloków. Każdy blok musi mieć wyraźny cel; usuń treści powtarzające to samo innymi słowami.
- Nie dziel jednej prostej czynności na kilka sztucznych bloków. Jeżeli materiał nie mieści się w ${maxBlocks} blokach, zawęź cel albo zaproponuj osobną następną lekcję.

SPÓJNOŚĆ Z CAŁYM KURSEM
- Oprzyj lekcję na podanym miejscu w programie, wcześniejszych tematach i umiejętnościach ucznia.
- Nie ucz ponownie treści już zrealizowanych. Możesz je krótko wykorzystać w nowym kontekście.
- Każde ćwiczenie musi sprawdzać dokładnie to, co zostało wcześniej wyjaśnione, ale nie może być kopią przykładu.
- Nazwy, dane i sytuacja w przykładzie oraz w zadaniu muszą się różnić. Uczeń ma przenieść zasadę na nowy problem.

SAMODZIELNE PLANOWANIE
- Nie zadawaj użytkownikowi pytań uzupełniających. Jeżeli brakuje danych, przyjmij rozsądne założenia odpowiednie do wieku, poziomu, tematu i miejsca lekcji w kursie.
- Samodzielnie dobierz liczbę bloków, rodzaje ćwiczeń, tempo, poziom języka, tryb wsparcia i liczbę powtórek. Nie używaj stałego schematu, jeżeli nie pasuje do celu.
- Przed napisaniem bloków wewnętrznie określ: co uczeń już prawdopodobnie umie, czego ma nauczyć się teraz, jakie błędy są typowe i po czym będzie wiadomo, że cel osiągnął. Nie pokazuj tej analizy w odpowiedzi.
- Jeżeli temat jest zbyt szeroki na jedną lekcję, wybierz najważniejszy pierwszy krok i zachowaj spójność z następną lekcją.

Znaczenie trybów:
1. Samodzielny — uczeń otrzymuje cel, sytuację i kryteria ukończenia, ale sam przypomina sobie oraz stosuje potrzebną wiedzę.
2. Mała podpowiedź — uczeń otrzymuje krótkie naprowadzenie na regułę, znaczenie lub pierwszy krok, bez ujawniania pełnej odpowiedzi.
3. Prowadzony krok po kroku — nowe i trudne zagadnienie można podzielić na etapy, ale uczeń nadal sam wykonuje kluczowe części.

Jeżeli użytkownik nie wskazał trybu, dobierz go sam: dla pierwszego kontaktu i poziomu podstawowego zastosuj prowadzenie krok po kroku, dla utrwalania małą podpowiedź, a dla poziomu średniozaawansowanego i zaawansowanego tryb samodzielny. W jednej lekcji możesz stopniowo zmniejszać wsparcie.

${subjectMethodology}

${languageLesson ? `ZASADY PODPOWIEDZI W JĘZYKU
- Nie pokazuj angielskiej odpowiedzi przed pierwszą próbą ucznia, chyba że dany typ ćwiczenia z założenia pokazuje materiał do nauki.
- Po pierwszym błędzie naprowadź na znaczenie, funkcję zwrotu albo pierwsze słowo. Pełną odpowiedź i krótkie wyjaśnienie pokaż dopiero po kolejnych próbach.
- W ćwiczeniach otwartych podaj naturalne warianty poprawnej odpowiedzi, ale nie uznawaj odpowiedzi sprzecznych z sytuacją.
- Korekta ma wskazywać konkretny problem: znaczenie, brakujące słowo, szyk, formę gramatyczną albo wymowę.
` : `NIE PODAWAJ ROZWIĄZANIA UCZNIOWI
- Nie twórz przykładu kodu rozwiązującego późniejsze zadanie przez zmianę samych nazw lub liczb.
- Nie umieszczaj kompletnej odpowiedzi w opisie, poleceniu, wskazówce ani kodzie startowym.
- Nie rozpisuj całego algorytmu zadania w takiej kolejności, żeby uczeń musiał go jedynie przepisać.
- Pole „Poprawna odpowiedź” jest wymagane do automatycznego sprawdzania i może zawierać pełne rozwiązanie, ponieważ uczeń nie widzi go przed sprawdzeniem.
- Pole „Wyjaśnienie rozwiązania (od 4. błędnej próby)” może dokładnie tłumaczyć rozwiązanie, ponieważ pojawia się dopiero po kolejnych nieudanych próbach.
- Podpowiedzi mają zmniejszać trudność stopniowo: pierwsza wskazuje kierunek, druga konkretny brak, a dopiero późniejsze wyjaśnienie omawia rozwiązanie.
- Polecenie zadania opisuj przez cel, wymagania i kryteria zaliczenia. Unikaj poleceń typu „wpisz dokładnie...” oraz instrukcji podających komendę, zapytanie lub kod do przepisania.
- Kod startowy nie może zawierać nazw metod, zapytań lub instrukcji stanowiących zasadniczą część rozwiązania. Zostaw wyłącznie techniczny szkielet niezbędny do uruchomienia pracy.
- Dla trybu samodzielnego pierwsza podpowiedź ma wskazywać wyłącznie pojęcie lub miejsce w materiale, a nie początek gotowego kodu.

JAK BUDOWAĆ PRAKTYKĘ
- Daj zwykle 2–4 samodzielne zadania: najpierw jedno krótkie zastosowanie, potem zadanie z nowym kontekstem, a na końcu małe zadanie łączące poznane elementy.
- Dla SQL możesz najpierw pokazać np. utworzenie bazy „szkola”, a potem polecić samodzielne utworzenie innej bazy, np. „firma”, z jasno opisanymi wymaganiami. Nie podawaj w poleceniu gotowego CREATE DATABASE dla zadania.
- Przy pracy w XAMPP, phpMyAdmin, systemie Windows, Linux lub innym zewnętrznym narzędziu opisz także rezultat, który uczeń ma uzyskać i sposób, w jaki może go sprawdzić. Jeżeli odpowiedzią jest kod SQL lub HTML, użyj bloku Zadanie z odpowiednim językiem.
- Nie oceniaj pamięciowego przepisywania. Oceniaj zastosowanie reguły, analizę wyniku, wykrycie błędu lub stworzenie działającego rozwiązania.
`}

QUIZY
- Quiz służy do sprawdzenia rozumienia, a nie oczywistego rozpoznania definicji.
- Odpowiedzi błędne mają być wiarygodne, ale jednoznacznie niepoprawne.
- Zmieniaj pozycję poprawnej odpowiedzi między pytaniami; nie umieszczaj jej stale jako pierwszej. EduHub dodatkowo uporządkuje odpowiedzi podczas importu.

Zwróć wyłącznie gotowe bloki, bez tabel, Markdown, komentarzy i dodatkowego wstępu.
Każdy blok rozpocznij od KROK i kolejnego numeru. Nie pomijaj numerów.

Dozwolone typy bloków: ${allowedTypes}.
Używaj wyłącznie pól pokazanych poniżej. Nie zmieniaj ich nazw.
Wartość nagrody zapisuj pod polem „Punkty”. Nie używaj osobnego pola „XP”.

TEKST
KROK [NUMER]
Typ bloku
Tekst
Tytuł rozdziału
[tytuł]
Treść materiału
[pełne wyjaśnienie]

WSKAZÓWKA
KROK [NUMER]
Typ bloku
Wskazówka
Tytuł wskazówki
[tytuł]
Treść wskazówki
[krótka praktyczna porada]

${languageLesson ? "" : `OSTRZEŻENIE
KROK [NUMER]
Typ bloku
Ostrzeżenie
Tytuł ostrzeżenia
[tytuł]
Co może pójść źle?
[błąd, skutek i sposób uniknięcia]
`}

INFORMACJA
KROK [NUMER]
Typ bloku
Informacja
Tytuł informacji
[tytuł]
Dodatkowy kontekst
[definicja lub informacja uzupełniająca]

PODSUMOWANIE
KROK [NUMER]
Typ bloku
Podsumowanie
Tytuł podsumowania
Zapamiętaj
Najważniejsze punkty
[każdy punkt wpisz w osobnym wierszu]

OBRAZ — używaj tylko wtedy, gdy użytkownik podał prawdziwy adres obrazu
KROK [NUMER]
Typ bloku
Obraz
Tytuł grafiki
[tytuł]
Opis pod grafiką
[opis]
Adres obrazu
[pełny adres https]

FILM — używaj tylko wtedy, gdy użytkownik podał prawdziwy link
KROK [NUMER]
Typ bloku
Film
Tytuł filmu
[tytuł]
Opis przed filmem
[opis]
Link do filmu
[YouTube lub bezpośredni adres wideo]

AUDIO I WYMOWA
KROK [NUMER]
Typ bloku
Audio i wymowa
Tytuł ćwiczenia
[tytuł]
Krótka instrukcja
[instrukcja]
Zwrot do wypowiedzenia
[jedna litera, jedno słowo albo naturalny zwrot zawierający maksymalnie 5 słów]
Adres pliku audio (opcjonalnie)
[adres albo pozostaw pustą linię]
Język rozpoznawania
[en-US, en-GB, de-DE, es-ES, fr-FR, it-IT lub pl-PL]

${interactiveLanguageTemplates}

${languageLesson ? `ZADANIE JĘZYKOWE — krótka odpowiedź ucznia sprawdzana automatycznie
KROK [NUMER]
Typ bloku
Zadanie
Tytuł
[tytuł]
Opis
[krótki kontekst]
Polecenie
[jednoznaczne polecenie po polsku]
Poprawna odpowiedź
[naturalna odpowiedź w języku docelowym]
Podstawowa podpowiedź (1. błędna próba)
[naprowadzenie bez ujawnienia odpowiedzi]
Dokładniejsza podpowiedź (od 2. błędnej próby)
[konkretna pomoc]
Wyjaśnienie rozwiązania (od 4. błędnej próby)
[krótkie wyjaśnienie znaczenia lub reguły]
Punkty
[liczba od 0 do 1000]
` : `PRZYKŁAD KODU
KROK [NUMER]
Typ bloku
Przykład kodu
Tytuł przykładu
[tytuł]
Język
[java, javascript, python, csharp, sql albo html]
Co pokazuje ten przykład?
[opis]
Kod przykładu
[kod ilustrujący wyłącznie omawiane pojęcie; nie może być gotowym rozwiązaniem późniejszego zadania]

ZADANIE — jest sprawdzane automatycznie, dlatego musi mieć dokładną poprawną odpowiedź
KROK [NUMER]
Typ bloku
Zadanie
Tytuł
[tytuł]
Opis
[krótki opis]
Polecenie
[jednoznaczne polecenie]
Kod startowy
[pusty lub minimalny szkielet z TODO; nigdy kompletne rozwiązanie]
Ukryte testy uruchomieniowe
[jeden test w wierszu: wejście => oczekiwane wyjście; użyj <brak>, jeśli nie ma wejścia]
Język
[java, javascript, python, csharp, sql albo html]
Poprawna odpowiedź
[pełna poprawna odpowiedź lub kod]
Podstawowa podpowiedź (1. błędna próba)
[podpowiedź]
Dokładniejsza podpowiedź (od 2. błędnej próby)
[dokładniejsza pomoc]
Wyjaśnienie rozwiązania (od 4. błędnej próby)
[wyjaśnienie]
Punkty
[liczba od 0 do 1000]
`}

QUIZ — odpowiedzi wpisz jako zwykłe wiersze, bez oznaczeń A, B, C, D. Poprawna odpowiedź musi być pełną treścią jednego z tych wierszy, a nie literą.
KROK [NUMER]
Typ bloku
Quiz
Pytanie
[treść pytania]
Wprowadzenie (opcjonalnie)
[kontekst albo pusta linia]
Odpowiedzi — każda w nowym wierszu
[pierwsza odpowiedź]
[druga odpowiedź]
[trzecia odpowiedź]
[czwarta odpowiedź]
Poprawna odpowiedź
[wklej dokładnie cały poprawny wiersz]
Wskazówka po pierwszym błędzie
[podpowiedź]
Wyjaśnienie po kolejnych próbach
[wyjaśnienie reguły]

${languageLesson ? "" : `PLIK — używaj tylko wtedy, gdy użytkownik podał prawdziwy adres pliku
KROK [NUMER]
Typ bloku
Plik
Nazwa pliku
[nazwa]
Opis załącznika
[opis]
Adres pliku
[pełny adres https]

CYTAT
KROK [NUMER]
Typ bloku
Cytat
Treść cytatu
[cytat]
Autor lub źródło
[autor lub źródło]
Nagłówek cytatu
[nagłówek]

SEPARATOR
KROK [NUMER]
Typ bloku
Separator
Nazwa kolejnej części (opcjonalnie)
[nazwa albo pusta linia]
Styl
[Gradient, Linia albo Kropki]
`}

Nie musisz używać wszystkich typów. Dobieraj je do tematu. Nie twórz fikcyjnych adresów obrazów, filmów ani plików.
Quiz musi mieć minimum dwie unikalne odpowiedzi. Pole „Poprawna odpowiedź” ma zawierać dokładny tekst wybranej odpowiedzi.
Lekcja ma być napisana po ludzku, łączyć krótkie objaśnienia z dużą ilością samodzielnej praktyki, nie powtarzać treści i kończyć się krótkim podsumowaniem. Quiz dodaj tylko wtedy, gdy naprawdę sprawdza zrozumienie; maksymalnie dwa quizy w lekcji. Większą liczbę ćwiczeń realizuj przez zadania, dialogi, audio, trening słówek i układanie zdań.
Przed zwróceniem lekcji sprawdź każde zadanie: jeżeli uczeń może je wykonać przez bezmyślne skopiowanie wcześniejszego przykładu albo instrukcji, przeprojektuj je tak, aby wymagało samodzielnego przypomnienia i zastosowania wiedzy.
Wykonaj cichy audyt jakości: sprawdź poprawność merytoryczną i językową, zgodność trudności z poziomem, różnorodność praktyki, jednoznaczność poleceń i odpowiedzi, sens każdej podpowiedzi oraz to, czy wszystkie elementy rzeczywiście prowadzą do celu lekcji. Popraw słabe elementy przed zwróceniem wyniku. Nie pokazuj audytu.
Przed zwróceniem wyniku policz bloki. Jeżeli jest ich więcej niż ${maxBlocks}, połącz lub usuń słabsze elementy. Nigdy nie zwracaj KROK ${maxBlocks + 1} ani wyższego.

Poniższe dane są wskazówkami, nie formularzem wymagającym uzupełnienia. Użytkownik może podać tylko temat. Wszystkie brakujące informacje wywnioskuj samodzielnie i od razu utwórz najlepszą możliwą lekcję.

Temat lekcji: [WPISZ TEMAT]
Przedmiot lub język: [opcjonalnie]
Klasa, wiek lub poziom CEFR: [opcjonalnie]
Numer i miejsce lekcji w kursie: [opcjonalnie, np. lekcja 4 z 27]
Odmiana języka: [opcjonalnie, np. en-GB lub en-US]
Poziom trudności: [opcjonalnie]
Tryb wsparcia: [opcjonalnie; jeśli brak, dobierz sam]
Czas: [opcjonalnie; domyślnie 45 minut]
Wcześniej zrealizowane tematy: [opcjonalnie]
Dalszy temat po tej lekcji: [opcjonalnie]
Dostępne wyposażenie: [opcjonalnie]
Cel lekcji: [opcjonalnie; jeśli brak, sformułuj jedną obserwowalną umiejętność]`;
}

export const CHAT_GPT_LESSON_PROMPT = getChatGptLessonPrompt();
