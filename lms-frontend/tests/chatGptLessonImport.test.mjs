import test from "node:test";
import assert from "node:assert/strict";
import { getChatGptLessonPrompt, parseChatGptLesson } from "../src/utils/chatGptLessonImport.js";
import { getBlockBaseXp } from "../src/utils/lessonBlockRewards.js";

const lesson = `KROK 1
Typ bloku
Tekst
Tytuł rozdziału
Poznaj powitanie
Treść materiału
Hello oznacza cześć.

KROK 2
Typ bloku
Quiz
Pytanie
Co oznacza hello?
Odpowiedzi
cześć
do widzenia
Poprawna odpowiedź
cześć

KROK 3
Typ bloku
Podsumowanie
Tytuł podsumowania
Zapamiętaj
Najważniejsze punkty
Hello to powitanie.
`;

test("import assigns XP to exercises without confusing summary points with rewards", () => {
    const result = parseChatGptLesson(lesson);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.blocks.map(block => block.points), [0, 10, 0]);
    assert.equal(result.blocks[2].content, "Hello to powitanie.");
    assert.equal(result.blocks.reduce((total, block) => total + getBlockBaseXp(block), 0), 10);
});

test("import keeps configured rewards and accepts the XP field labels users paste", () => {
    for (const [field, value, expected] of [
        ["Punkty", "35", 35], ["Punkty (XP)", "25 XP", 25],
        ["Punkty XP", "18", 18], ["XP", "0", 0],
        ["Punkty", "2000", 1000], ["Punkty", "-5", 0]
    ]) {
        const result = parseChatGptLesson(lesson.replace("KROK 3", `${field}\n${value}\n\nKROK 3`));
        assert.deepEqual(result.errors, []);
        assert.equal(result.blocks[1].points, expected);
    }
    const invalid = parseChatGptLesson(lesson.replace("KROK 3", "Punkty\nnie wiem\n\nKROK 3"));
    assert.equal(invalid.blocks[1].points, 10);
    assert.ok(invalid.warnings.some(warning => warning.includes("Ustawiono 10 XP")));
});

test("language exercise imports also receive the default reward", () => {
    for (const [type, content] of [
        ["Audio i wymowa", "Zwrot do wypowiedzenia\nHello"],
        ["Dialog interaktywny", "Dialog\nEmma: Hello!\nLeo: Hi!"],
        ["Trening słówek", "Słówka\ncat | kot"],
        ["Laboratorium słów", "Słówka\ncat | kot"],
        ["Rozpoznawanie ze słuchu", "Słówka\ncat | kot"],
        ["Układanie zdania", "Zdanie po polsku\nDzień dobry\nPoprawne zdanie po angielsku\nGood morning"],
        ["Zadanie", "Polecenie\nPrzetłumacz cześć.\nPoprawna odpowiedź\nHello"]
    ]) {
        const result = parseChatGptLesson(`KROK 1\nTyp bloku\n${type}\nTytuł\nPowitanie\n${content}`, 20, "LANGUAGE");
        assert.deepEqual(result.errors, [], type);
        assert.equal(result.blocks[0].points, 10, type);
    }
});

test("a task without an answer becomes reading material without exercise XP", () => {
    const result = parseChatGptLesson("KROK 1\nTyp bloku\nZadanie\nTytuł\nSpróbuj sam\nPolecenie\nPrzywitaj kolegę.");
    assert.equal(result.blocks[0].type, "TEXT");
    assert.equal(result.blocks[0].points, 0);
});

test("reward preview matches existing zero-XP exercise defaults and excludes reading material", () => {
    assert.equal(getBlockBaseXp({type: "QUIZ", points: 0}), 10);
    assert.equal(getBlockBaseXp({type: "AUDIO", points: 25}), 25);
    assert.equal(getBlockBaseXp({type: "TASK", points: 2000}), 1000);
    assert.equal(getBlockBaseXp({type: "SUMMARY", points: 25}), 0);
});

test("both generator prompts explicitly include rewards in every block template", () => {
    for (const variant of ["PROGRAMMING", "LANGUAGE"]) {
        const prompt = getChatGptLessonPrompt(20, variant);
        const templates = prompt.split("KROK [NUMER]\n").slice(1);
        assert.ok(templates.length >= 10);
        for (const template of templates) {
            assert.match(template, /\nPunkty\n(?:0|10|\[liczba od 10 do 1000\])/, template.split("\n")[1]);
        }
        assert.ok(prompt.includes("Nie wpisuj 0 w ćwiczeniach."));
    }
});
