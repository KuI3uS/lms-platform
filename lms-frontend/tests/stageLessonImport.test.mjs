import assert from "node:assert/strict";
import test from "node:test";
import {
    getStageLessonPrompt,
    parseStageLessonImport
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
});
