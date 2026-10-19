import assert from "node:assert/strict";
import test from "node:test";
import {
    getStageLessonPrompt,
    parseStageLessonImport,
    matchStageLessons,
    normalizeStageLessonTitle
} from "../src/utils/stageLessonImport.js";

const packageText = `LEKCJA 1 — Tworzymy pierwsze repozytorium Git
KROK 1
Typ bloku
Tekst
Punkty
0
Tytuł rozdziału
Po co nam repozytorium
Treść materiału
Repozytorium zapisuje historię projektu.

KROK 2
Typ bloku
Quiz
Punkty
10
Pytanie
Co zapisuje repozytorium?
Odpowiedzi
Historię projektu
Hasło użytkownika
Poprawna odpowiedź
Historię projektu
KONIEC LEKCJI

LEKCJA 2
Tytuł lekcji
git status — sprawdzamy stan projektu
KROK 1
Typ bloku
Laboratorium praktyczne
Punkty
10
Tytuł
Sprawdź stan plików
Cel i wymagania
Uruchom polecenie w repozytorium.
Weryfikacja i kryteria ukończenia
Wynik pokazuje bieżącą gałąź i stan plików.
KONIEC LEKCJI`;

test("parses several complete lessons and resets KROK numbering per lesson", () => {
    const parsed = parseStageLessonImport(packageText, 10, "PROGRAMMING");

    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.lessonCount, 2);
    assert.equal(parsed.blockCount, 3);
    assert.deepEqual(parsed.lessons.map(lesson => lesson.title), [
        "Tworzymy pierwsze repozytorium Git",
        "git status — sprawdzamy stan projektu"
    ]);
    assert.deepEqual(parsed.lessons.map(lesson => lesson.blocks.length), [2, 1]);
    assert.equal(parsed.lessons[0].blocks[1].type, "QUIZ");
    assert.equal(parsed.lessons[1].blocks[0].type, "PRACTICAL_LAB");
});

test("reports duplicate titles and a lesson without blocks", () => {
    const parsed = parseStageLessonImport(`
LEKCJA 1 — Start
KROK 1
Typ bloku
Tekst
Tytuł
Wprowadzenie
Treść
Treść lekcji.

LEKCJA 2 — start
KONIEC LEKCJI
`);

    assert.ok(parsed.errors.some(error => error.includes("występuje w paczce więcej niż raz")));
    assert.ok(parsed.errors.some(error => error.includes("Nie znaleziono kroków")));
});

test("stage prompt contains current stage and all existing lesson titles", () => {
    const prompt = getStageLessonPrompt({
        maxBlocks: 10,
        variant: "PROGRAMMING",
        stageTitle: "Git i GitHub od pierwszego dnia",
        lessonTitles: ["Pierwsze repozytorium", "git status"]
    });

    assert.match(prompt, /Git i GitHub od pierwszego dnia/);
    assert.match(prompt, /1\. Pierwsze repozytorium/);
    assert.match(prompt, /2\. git status/);
    assert.match(prompt, /LEKCJA 1 —/);
    assert.match(prompt, /KONIEC LEKCJI/);
    assert.match(prompt, /maksymalnie 10 bloków/);
    assert.match(prompt, /WYŁĄCZNIE istniejące karty lekcji/);
    assert.match(prompt, /do 50 lekcji/);
});

function lessonText(number, blockCount = 10) {
    return `LEKCJA ${number} — Lekcja SQL ${number}\n` + Array.from({ length: blockCount }, (_, index) => `KROK ${index + 1}\nTyp bloku\nTekst\nTytuł\nMateriał ${index + 1}\nTreść\nWyjaśnienie i przykład SQL.\n`).join("\n") + "KONIEC LEKCJI\n";
}

test("accepts fifty lessons with ten blocks each, not ten lessons total", () => {
    const parsed = parseStageLessonImport(Array.from({ length: 50 }, (_, index) => lessonText(index + 1)).join("\n"));
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.lessonCount, 50);
    assert.equal(parsed.blockCount, 500);
    const existing = parsed.lessons.map((lesson, index) => ({ id: index + 10, title: lesson.title }));
    assert.equal(matchStageLessons(parsed.lessons, existing).matches.length, 50);
});

test("rejects fifty-one lessons or eleven blocks inside one lesson", () => {
    assert.ok(parseStageLessonImport(Array.from({ length: 51 }, (_, index) => lessonText(index + 1, 1)).join("\n")).errors.some(error => /maksymalnie 50 lekcji/.test(error)));
    assert.ok(parseStageLessonImport(lessonText(1, 11)).errors.length > 0);
});

test("matches existing cards by title, tolerating formatting but retaining SQL operators", () => {
    const matched = matchStageLessons([{ title: "  AS — nadawanie czytelnych nazw kolumnom " }, { title: "Operatory — =, <>, >, <, >=, <=" }], [
        { id: 12, title: "Operatory - =, <>, >, <, >=, <=", orderIndex: 8 },
        { id: 11, title: "AS - nadawanie czytelnych nazw kolumnom", orderIndex: 8 }
    ]);
    assert.deepEqual(matched.errors, []);
    assert.deepEqual(matched.matches.map(match => match.target.id), [11, 12]);
    assert.deepEqual(matched.matches.map(match => match.target.displayNumber), [2, 1]);
    assert.notEqual(normalizeStageLessonTitle("x > y"), normalizeStageLessonTitle("x < y"));
});

test("missing and ambiguous lesson names are errors, never new lesson plans", () => {
    const unmatched = matchStageLessons([{ title: "WHERE" }], [{ id: 1, title: "SELECT" }]);
    assert.equal(unmatched.matches.length, 0);
    assert.match(unmatched.errors[0], /nie istnieje/);
    const ambiguous = matchStageLessons([{ title: "AS — alias" }], [{ id: 1, title: "AS - alias" }, { id: 2, title: "AS — alias" }]);
    assert.equal(ambiguous.matches.length, 0);
    assert.match(ambiguous.errors[0], /kilku lekcji/);
});

test("a repeated target cannot import twice and a subset keeps original card IDs and positions", () => {
    const existing = [{ id: 7, title: "WHERE", blockCount: 2, published: false, publishedBlockCount: 2 }, { id: 8, title: "SELECT" }];
    const duplicated = matchStageLessons([{ title: "WHERE" }, { title: "where" }], existing);
    assert.equal(duplicated.errors.length, 1);
    const matched = matchStageLessons([{ title: "SELECT" }], existing);
    assert.equal(matched.matches[0].target.id, 8);
    assert.equal(matched.matches[0].target.displayNumber, 2);
    assert.equal(existing.length, 2);
});
