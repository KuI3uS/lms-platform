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
    ["najwazniejsze informacje", "summary"],
    ["po tej lekcji potrafisz", "skills"]
];

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
        const field = readField(line);
        if (field) {
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
        block.instruction = fields.question || fields.instruction || block.title;
        block.title = fields.question || block.title;
        block.content = answers.join("\n");
        block.expectedAnswer = answerIndex >= 0
            ? answers[answerIndex] || ""
            : fields.correctAnswer || "";
        block.detailedHint = fields.detailedHint || fields.solutionExplanation || "";
        if (answers.length < 2) {
            errors.push(`Krok ${step.number}: quiz wymaga co najmniej dwóch odpowiedzi zapisanych pod polem „Odpowiedzi — każda w nowym wierszu”.`);
        } else if (!block.expectedAnswer || !answers.includes(block.expectedAnswer)) {
            errors.push(`Krok ${step.number}: „Poprawna odpowiedź” musi być pełną treścią jednego z wierszy odpowiedzi.`);
        }
    }

    if (resolved.type === "TASK") {
        block.instruction = fields.instruction || fields.content;
        block.expectedAnswer = fields.correctAnswer || "";
        if (!block.expectedAnswer) {
            block.type = "TEXT";
            block.content = `Zadanie\n\n${block.instruction}`.trim();
            block.instruction = "";
            warnings.push(`Krok ${step.number}: zadanie bez poprawnej odpowiedzi zostanie zapisane jako materiał.`);
        }
    }

    if (resolved.type === "EXAMPLE") {
        block.language = fields.language || "java";
    }

    if (resolved.type === "IMAGE") block.mediaType = "image";
    if (resolved.type === "VIDEO") block.mediaType = "video";
    if (resolved.type === "PDF") block.mediaType = "file";
    if (resolved.type === "AUDIO") {
        block.mediaType = "audio";
        block.language = fields.language || "en-US";
    }
    if (resolved.type === "DIVIDER") {
        const dividerStyles = { gradient: "gradient", linia: "line", line: "line", kropki: "dots", dots: "dots" };
        block.mediaType = dividerStyles[normalize(fields.mediaType)] || "gradient";
    }

    if (resolved.type !== "DIVIDER" && !block.title?.trim()) {
        errors.push(`Krok ${step.number}: blok wymaga tytułu zgodnego z formularzem EduHub.`);
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

    const blocks = steps
        .map((step) => parseStep(step, warnings, errors))
        .filter(Boolean);

    return { blocks, warnings, errors };
}

export const CHAT_GPT_LESSON_PROMPT = `Jesteś metodykiem i nauczycielem. Przygotuj kompletną lekcję do importu w EduHub.

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

Zwróć wyłącznie gotowe bloki, bez tabel, Markdown, komentarzy i dodatkowego wstępu.
Każdy blok rozpocznij od KROK i kolejnego numeru. Nie pomijaj numerów.

Dozwolone typy bloków: Tekst, Wskazówka, Ostrzeżenie, Informacja, Podsumowanie, Obraz, Film, Audio i wymowa, Przykład kodu, Zadanie, Quiz, Plik, Cytat, Separator.
Używaj wyłącznie pól pokazanych poniżej. Nie zmieniaj ich nazw.

TEKST
KROK 1
Typ bloku
Tekst
Tytuł rozdziału
[tytuł]
Treść materiału
[pełne wyjaśnienie]

WSKAZÓWKA
KROK 2
Typ bloku
Wskazówka
Tytuł wskazówki
[tytuł]
Treść wskazówki
[krótka praktyczna porada]

OSTRZEŻENIE
KROK 3
Typ bloku
Ostrzeżenie
Tytuł ostrzeżenia
[tytuł]
Co może pójść źle?
[błąd, skutek i sposób uniknięcia]

INFORMACJA
KROK 4
Typ bloku
Informacja
Tytuł informacji
[tytuł]
Dodatkowy kontekst
[definicja lub informacja uzupełniająca]

PODSUMOWANIE
KROK 5
Typ bloku
Podsumowanie
Tytuł podsumowania
Zapamiętaj
Najważniejsze punkty
[każdy punkt wpisz w osobnym wierszu]

OBRAZ — używaj tylko wtedy, gdy użytkownik podał prawdziwy adres obrazu
KROK 6
Typ bloku
Obraz
Tytuł grafiki
[tytuł]
Opis pod grafiką
[opis]
Adres obrazu
[pełny adres https]

FILM — używaj tylko wtedy, gdy użytkownik podał prawdziwy link
KROK 7
Typ bloku
Film
Tytuł filmu
[tytuł]
Opis przed filmem
[opis]
Link do filmu
[YouTube lub bezpośredni adres wideo]

AUDIO I WYMOWA
KROK 8
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
KROK 9
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
KROK 10
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
[java, javascript, python albo csharp]
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
KROK 11
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
KROK 12
Typ bloku
Plik
Nazwa pliku
[nazwa]
Opis załącznika
[opis]
Adres pliku
[pełny adres https]

CYTAT
KROK 13
Typ bloku
Cytat
Treść cytatu
[cytat]
Autor lub źródło
[autor lub źródło]
Nagłówek cytatu
[nagłówek]

SEPARATOR
KROK 14
Typ bloku
Separator
Nazwa kolejnej części (opcjonalnie)
[nazwa albo pusta linia]
Styl
[Gradient, Linia albo Kropki]

Nie musisz używać wszystkich typów. Dobieraj je do tematu. Nie twórz fikcyjnych adresów obrazów, filmów ani plików.
Quiz musi mieć minimum dwie unikalne odpowiedzi. Pole „Poprawna odpowiedź” ma zawierać dokładny tekst wybranej odpowiedzi.
Lekcja ma być napisana po ludzku, prowadzić krok po kroku, łączyć teorię z praktyką, nie powtarzać treści i kończyć się quizem oraz podsumowaniem.
Przed zwróceniem lekcji sprawdź każde zadanie: jeżeli uczeń może je wykonać przez skopiowanie wcześniejszego kodu albo instrukcji, przeprojektuj je tak, aby wymagało samodzielnego myślenia.

Temat lekcji: [WPISZ TEMAT]
Przedmiot: [WPISZ PRZEDMIOT]
Klasa lub poziom: [WPISZ KLASĘ]
Poziom trudności: [podstawowy, średniozaawansowany albo zaawansowany]
Tryb wsparcia: [samodzielny, mała podpowiedź, prowadzony krok po kroku albo „zapytaj mnie”]
Czas: [WPISZ CZAS, np. 45 minut]
Wcześniej zrealizowane tematy: [WPISZ TEMATY albo „brak”]
Dostępne wyposażenie: [WPISZ WYPOSAŻENIE]
Cel lekcji: [WPISZ CEL]`;
