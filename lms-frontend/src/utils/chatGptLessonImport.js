import { MAX_LESSON_BLOCKS } from "./lessonBlockLimits.js";

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
    ["opis pod grafika", "description"],
    ["opis przed filmem", "description"],
    ["krotka instrukcja", "description"],
    ["co pokazuje ten przyklad?", "description"],
    ["opis zalacznika", "description"],
    ["autor lub zrodlo", "description"],
    ["wprowadzenie (opcjonalnie)", "description"],
    ["opis", "description"],
    ["wprowadzenie", "description"],
    ["pytanie", "question"],
    ["odpowiedz a", "answerA"],
    ["odpowiedz b", "answerB"],
    ["odpowiedz c", "answerC"],
    ["odpowiedz d", "answerD"],
    ["poprawna odpowiedz", "correctAnswer"],
    ["wskazowka po pierwszym bledzie", "hint"],
    ["podstawowa podpowiedz (1. bledna proba)", "hint"],
    ["dokladniejsza podpowiedz", "detailedHint"],
    ["dokladniejsza podpowiedz (od 2. blednej proby)", "detailedHint"],
    ["wyjasnienie po kolejnych probach", "solutionExplanation"],
    ["wyjasnienie rozwiazania", "solutionExplanation"],
    ["wyjasnienie rozwiazania (od 4. blednej proby)", "solutionExplanation"],
    ["polecenie", "instruction"],
    ["kod startowy", "starterCode"],
    ["ukryte testy uruchomieniowe", "hiddenTests"],
    ["jezyk", "language"],
    ["jezyk rozpoznawania", "language"],
    ["adres obrazu", "mediaUrl"],
    ["link do filmu", "mediaUrl"],
    ["adres pliku audio (opcjonalnie)", "mediaUrl"],
    ["adres pliku", "mediaUrl"],
    ["styl", "mediaType"],
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
    if (practical) return { type: "TEXT", practical: true };

    const typeKey = Object.keys(TYPE_MAP).find(
        (key) => normalizedType === key || normalizedType.startsWith(`${key} `)
    );
    return { type: TYPE_MAP[typeKey], practical: false };
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
        block.language = normalizeLanguage(fields.language, "java");
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

export function parseChatGptLesson(source) {
    const warnings = [];
    const errors = [];
    const steps = splitSteps(source);
    if (String(source || "").trim() && steps.length === 0) {
        errors.push("Nie znaleziono kroków. Każdy blok rozpocznij od nagłówka KROK 1, KROK 2 itd.");
    }
    if (steps.length > MAX_LESSON_BLOCKS) {
        errors.push(
            `Lekcja zawiera ${steps.length} bloków. Maksymalnie można zaimportować ${MAX_LESSON_BLOCKS}; podziel materiał na dwie lekcje.`
        );
    }

    const blocks = steps
        .map((step) => parseStep(step, warnings, errors))
        .filter(Boolean);

    return { blocks, warnings, errors };
}

export const CHAT_GPT_LESSON_PROMPT = `Jesteś metodykiem i nauczycielem. Przygotuj kompletną lekcję do importu w EduHub.

NAJWAŻNIEJSZA ZASADA LEKCJI
- Jedna lekcja rozwija jedną konkretną umiejętność i zawiera od 6 do maksymalnie 10 bloków.
- Najpierw zaplanuj lekcję wewnętrznie, ale nie pokazuj planu ani komentarzy. Zwróć tylko gotowe bloki.
- Zachowaj logiczny rytm: krótkie wyjaśnienie problemu, demonstracja jednego nowego pojęcia na innym przykładzie, samodzielna praktyka o rosnącej trudności, sprawdzenie zrozumienia i krótkie podsumowanie.
- Nie próbuj używać wszystkich dostępnych typów bloków. Każdy blok musi mieć wyraźny cel; usuń treści powtarzające to samo innymi słowami.
- Nie dziel jednej prostej czynności na kilka sztucznych bloków. Jeżeli materiał nie mieści się w 10 blokach, zawęź cel albo zaproponuj osobną następną lekcję.

SPÓJNOŚĆ Z CAŁYM KURSEM
- Oprzyj lekcję na podanym miejscu w programie, wcześniejszych tematach i umiejętnościach ucznia.
- Nie ucz ponownie treści już zrealizowanych. Możesz je krótko wykorzystać w nowym kontekście.
- Każde ćwiczenie musi sprawdzać dokładnie to, co zostało wcześniej wyjaśnione, ale nie może być kopią przykładu.
- Nazwy, dane i sytuacja w przykładzie oraz w zadaniu muszą się różnić. Uczeń ma przenieść zasadę na nowy problem.

ZANIM UTWORZYSZ LEKCJĘ
Najpierw sprawdź, czy użytkownik podał tryb wsparcia ucznia. Jeżeli go nie podał, nie generuj jeszcze lekcji. Zadaj tylko jedno krótkie pytanie:
„Jaki tryb wsparcia zastosować: 1. samodzielny, 2. mała podpowiedź, 3. prowadzony krok po kroku?”

Znaczenie trybów:
1. Samodzielny — uczeń otrzymuje przede wszystkim opis problemu, wymagania i kryteria ukończenia. Nie pokazuj gotowego rozwiązania, gotowego kodu, szczegółowego algorytmu ani kolejności wszystkich czynności. Kod startowy ma zawierać wyłącznie niezbędny szkielet albo może być pusty.
2. Mała podpowiedź — uczeń otrzymuje krótkie naprowadzenie na pojęcie, narzędzie lub pierwszy krok. Nie pokazuj kompletnego rozwiązania ani kodu, który wystarczy przepisać.
3. Prowadzony krok po kroku — można podzielić nowe i trudne zagadnienie na etapy, ale uczeń nadal sam wykonuje kluczowe fragmenty. Nie wklejaj gotowego rozwiązania zadania w teorii lub przykładzie kodu.

Jeżeli poziom został określony jako „średniozaawansowany” albo „zaawansowany”, automatycznie wybierz tryb 1 — samodzielny i nie zadawaj pytania o tryb. Jeżeli poziom jest „podstawowy” lub uczeń poznaje zagadnienie pierwszy raz, zapytaj o tryb, chyba że użytkownik wskazał go wprost.

NIE PODAWAJ ROZWIĄZANIA UCZNIOWI
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

QUIZY
- Quiz służy do sprawdzenia rozumienia, a nie oczywistego rozpoznania definicji.
- Odpowiedzi błędne mają być wiarygodne, ale jednoznacznie niepoprawne.
- Zmieniaj pozycję poprawnej odpowiedzi między pytaniami; nie umieszczaj jej stale jako pierwszej. EduHub dodatkowo uporządkuje odpowiedzi podczas importu.

Zwróć wyłącznie gotowe bloki, bez tabel, Markdown, komentarzy i dodatkowego wstępu.
Każdy blok rozpocznij od KROK i kolejnego numeru. Nie pomijaj numerów.

Dozwolone typy bloków: Tekst, Wskazówka, Ostrzeżenie, Informacja, Podsumowanie, Obraz, Film, Audio i wymowa, Przykład kodu, Zadanie, Quiz, Plik, Cytat, Separator.
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

OSTRZEŻENIE
KROK [NUMER]
Typ bloku
Ostrzeżenie
Tytuł ostrzeżenia
[tytuł]
Co może pójść źle?
[błąd, skutek i sposób uniknięcia]

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
[dokładny zwrot]
Adres pliku audio (opcjonalnie)
[adres albo pozostaw pustą linię]
Język rozpoznawania
[en-US, en-GB, de-DE, es-ES, fr-FR, it-IT lub pl-PL]

PRZYKŁAD KODU
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

PLIK — używaj tylko wtedy, gdy użytkownik podał prawdziwy adres pliku
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

Nie musisz używać wszystkich typów. Dobieraj je do tematu. Nie twórz fikcyjnych adresów obrazów, filmów ani plików.
Quiz musi mieć minimum dwie unikalne odpowiedzi. Pole „Poprawna odpowiedź” ma zawierać dokładny tekst wybranej odpowiedzi.
Lekcja ma być napisana po ludzku, łączyć teorię z samodzielną praktyką, nie powtarzać treści i kończyć się krótkim podsumowaniem. Quiz dodaj tylko wtedy, gdy naprawdę sprawdza zrozumienie; maksymalnie dwa quizy w lekcji.
Przed zwróceniem lekcji sprawdź każde zadanie: jeżeli uczeń może je wykonać przez skopiowanie wcześniejszego kodu albo instrukcji, przeprojektuj je tak, aby wymagało samodzielnego myślenia.
Przed zwróceniem wyniku policz bloki. Jeżeli jest ich więcej niż 10, połącz lub usuń słabsze elementy. Nigdy nie zwracaj KROK 11 ani wyższego.

Temat lekcji: [WPISZ TEMAT]
Przedmiot: [WPISZ PRZEDMIOT]
Klasa lub poziom: [WPISZ KLASĘ]
Numer i miejsce lekcji w kursie: [np. lekcja 4 z 27, etap 2]
Poziom trudności: [podstawowy, średniozaawansowany albo zaawansowany]
Tryb wsparcia: [samodzielny, mała podpowiedź, prowadzony krok po kroku albo „zapytaj mnie”]
Czas: [WPISZ CZAS, np. 45 minut]
Wcześniej zrealizowane tematy: [WPISZ TEMATY albo „brak”]
Dalszy temat po tej lekcji: [WPISZ NASTĘPNY TEMAT albo „brak danych”]
Dostępne wyposażenie: [WPISZ WYPOSAŻENIE]
Cel lekcji: [jedna obserwowalna umiejętność, którą uczeń ma wykonać samodzielnie]`;
