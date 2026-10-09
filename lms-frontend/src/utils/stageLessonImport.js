import { cleanChatGptText } from "./chatGptReferences.js";
import {
    getChatGptLessonPrompt,
    parseChatGptLesson
} from "./chatGptLessonImport.js";
import { MAX_LESSON_BLOCKS } from "./lessonBlockLimits.js";

export const MAX_LESSONS_PER_STAGE_IMPORT = 50;

const LESSON_HEADER = /^\s*(?:#{1,6}\s*)?(?:={2,}\s*)?LEKCJA\s+(\d+)(?:\s*(?:—|-|:)\s*(.*?))?(?:\s*=+)?\s*$/gim;
const END_MARKER = /^\s*(?:={2,}\s*)?KONIEC\s+LEKCJI(?:\s*=+)?\s*$/gim;
const TITLE_LABEL = /^\s*(?:\*{1,2})?TYTUŁ\s+LEKCJI(?:\*{1,2})?\s*(?::\s*(.*))?$/im;

function normalizeTitle(value) {
    return cleanChatGptText(value)
        .replace(/^\s*[-–—:]\s*/, "")
        .replace(/\s+/g, " ")
        .trim();
}

function extractTitle(section, inlineTitle) {
    const inline = normalizeTitle(inlineTitle || "");
    if (inline) return { title: inline, body: section };

    const label = TITLE_LABEL.exec(section);
    if (!label) return { title: "", body: section };

    let title = normalizeTitle(label[1] || "");
    let bodyStart = label.index + label[0].length;

    if (!title) {
        const remainder = section.slice(bodyStart);
        const nextLine = remainder.match(/^\s*\r?\n\s*([^\r\n]+)(?:\r?\n|$)/);
        if (nextLine) {
            title = normalizeTitle(nextLine[1]);
            bodyStart += nextLine[0].length;
        }
    }

    return {
        title,
        body: `${section.slice(0, label.index)}\n${section.slice(bodyStart)}`
    };
}

export function parseStageLessonImport(
    source,
    maxBlocks = MAX_LESSON_BLOCKS,
    variant = "PROGRAMMING"
) {
    const cleanSource = cleanChatGptText(source).replace(END_MARKER, "").trim();
    const headers = [...cleanSource.matchAll(LESSON_HEADER)];
    const errors = [];
    const warnings = [];
    const lessons = [];

    if (cleanSource && headers.length === 0) {
        errors.push("Nie znaleziono lekcji. Każdą rozpocznij od nagłówka „LEKCJA 1 — tytuł”.");
    }
    if (headers.length > MAX_LESSONS_PER_STAGE_IMPORT) {
        errors.push(
            `Jednorazowo można zaimportować maksymalnie ${MAX_LESSONS_PER_STAGE_IMPORT} lekcji w jednym etapie.`
        );
    }

    const seenNumbers = new Set();
    const seenTitles = new Set();

    headers.forEach((header, index) => {
        const number = Number(header[1]);
        const nextHeader = headers[index + 1];
        const rawSection = cleanSource.slice(
            header.index + header[0].length,
            nextHeader ? nextHeader.index : cleanSource.length
        ).trim();
        const { title, body } = extractTitle(rawSection, header[2]);

        if (seenNumbers.has(number)) {
            errors.push(`Numer lekcji ${number} występuje w paczce więcej niż raz.`);
        }
        seenNumbers.add(number);

        if (!title) {
            errors.push(`Lekcja ${number} nie ma tytułu.`);
        } else if (title.length > 255) {
            errors.push(`Tytuł lekcji ${number} ma więcej niż 255 znaków.`);
        } else {
            const titleKey = title.toLocaleLowerCase("pl-PL");
            if (seenTitles.has(titleKey)) {
                errors.push(`Tytuł „${title}” występuje w paczce więcej niż raz.`);
            }
            seenTitles.add(titleKey);
        }

        const parsed = parseChatGptLesson(body, maxBlocks, variant);
        if (parsed.blocks.length === 0 && parsed.errors.length === 0) {
            parsed.errors.push("Nie znaleziono kroków. Lekcja musi zawierać co najmniej KROK 1.");
        }
        parsed.errors.forEach(error => errors.push(`Lekcja ${number} („${title || "bez tytułu"}”): ${error}`));
        parsed.warnings.forEach(warning => warnings.push(`Lekcja ${number} („${title || "bez tytułu"}”): ${warning}`));

        lessons.push({
            number,
            title,
            blocks: parsed.blocks
        });
    });

    const sortedNumbers = [...seenNumbers].sort((a, b) => a - b);
    sortedNumbers.forEach((number, index) => {
        if (number !== index + 1) {
            warnings.push("Numery lekcji nie są kolejne od 1. Kolejność importu będzie zgodna z kolejnością wklejenia.");
        }
    });

    return {
        lessons,
        lessonCount: lessons.length,
        blockCount: lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0),
        errors: [...new Set(errors)],
        warnings: [...new Set(warnings)]
    };
}

export function getStageLessonPrompt({
    maxBlocks = MAX_LESSON_BLOCKS,
    variant = "PROGRAMMING",
    stageTitle = "",
    lessonTitles = []
} = {}) {
    const normalizedTitles = lessonTitles
        .map(normalizeTitle)
        .filter(Boolean);
    const lessonList = normalizedTitles.length > 0
        ? normalizedTitles.map((title, index) => `${index + 1}. ${title}`).join("\n")
        : "1. [wpisz tytuł pierwszej lekcji]\n2. [wpisz tytuł drugiej lekcji]";
    const singleLessonRules = getChatGptLessonPrompt(maxBlocks, variant);

    return `Przygotuj kompletny pakiet lekcji do jednorazowego importu w EduHub.

ETAP
${stageTitle || "[wpisz nazwę etapu]"}

LEKCJE DO PRZYGOTOWANIA
${lessonList}

WAŻNE
- Przygotuj dokładnie wszystkie lekcje z listy, w tej samej kolejności i z tymi samymi tytułami.
- Każda lekcja ma być pełna, przemyślana i możliwa do przeprowadzenia bez dopisywania brakujących treści.
- Każda lekcja może mieć maksymalnie ${maxBlocks} bloków i ma rozwijać jedną konkretną umiejętność.
- Pomiędzy lekcjami zachowaj progresję. Nie powtarzaj tej samej teorii i tych samych ćwiczeń.
- Nie zadawaj pytań. Brakujące decyzje metodyczne podejmij samodzielnie.

OBOWIĄZKOWY FORMAT ODPOWIEDZI
LEKCJA 1 — [dokładny tytuł pierwszej lekcji]
KROK 1
[pierwszy blok zgodny z zasadami poniżej]
KROK 2
[kolejny blok]
KONIEC LEKCJI

LEKCJA 2 — [dokładny tytuł drugiej lekcji]
KROK 1
[pierwszy blok]
KONIEC LEKCJI

Kontynuuj aż do ostatniej lekcji. Numerację KROKÓW zaczynaj od 1 w każdej lekcji. Nie dodawaj Markdown, tabel, wstępu ani komentarza poza wskazanym formatem.

SZCZEGÓŁOWE ZASADY TWORZENIA KAŻDEJ LEKCJI
Poniższe zasady stosuj osobno do każdej lekcji. Zdanie „zwróć tylko gotowe bloki” oznacza bloki wewnątrz znaczników LEKCJA/KONIEC LEKCJI wymaganych powyżej.

${singleLessonRules}

Na końcu sprawdź wewnętrznie, czy utworzyłeś dokładnie ${normalizedTitles.length || "tyle, ile podano"} lekcji, czy każda zaczyna się od LEKCJA N — tytuł i czy każda ma własne KROK 1. Zwróć wyłącznie gotowy pakiet.`;
}
