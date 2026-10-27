import test from "node:test";
import assert from "node:assert/strict";
import { getLessonBlockValidationError as validate } from "../src/utils/lessonBlockValidation.js";

const block = (type, fields = {}) => ({ type, title: "Krótki tytuł", ...fields });
const configBlock = (type, content) => block(type, { content: JSON.stringify(content) });
const vocabulary = items => ({ kind: "vocabulary", items });
const word = { term: "cat", translation: "kot" };
const dialog = {
    kind: "dialog",
    characters: [{ id: "a", name: "Mia" }, { id: "b", name: "Alex" }],
    studentCharacterId: "b",
    turns: [{ speakerId: "a", text: "Hello!" }, { speakerId: "b", text: "Hi!" }]
};

test("validation is pure and accepts every supported block type with its required fields", () => {
    const examples = [
        ...["THEORY", "CONTENT", "TEXT", "TIP", "WARNING", "INFO", "SUMMARY", "QUOTE", "EXAMPLE"]
            .map(type => block(type, { content: "Czytelny materiał." })),
        ...["IMAGE", "VIDEO", "PDF", "DOWNLOAD"]
            .map(type => block(type, { mediaUrl: "https://example.com/material" })),
        block("AUDIO", { content: "Good morning!" }),
        configBlock("DIALOG", dialog),
        ...["VOCABULARY", "WORD_LAB", "LISTENING"].map(type => configBlock(type, vocabulary([word]))),
        configBlock("SENTENCE_BUILDER", { kind: "sentence-builder", polishSentence: "Dzień dobry", words: ["Good", "morning"] }),
        block("QUIZ", { content: "Odpowiedź A\nOdpowiedź B", expectedAnswer: "Odpowiedź A" }),
        ...["TASK", "DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW", "OPEN_RESPONSE"].map(type => block(type, {
            instruction: "Wykonaj zadanie.", expectedAnswer: "Model rozwiązania", starterCode: "class Main {}"
        })),
        block("PRACTICAL_LAB", { instruction: "Cel i wymagania", content: "Weryfikacja i kryteria ukończenia" }),
        block("DIVIDER", { title: "" })
    ];
    for (const example of examples) {
        const before = JSON.stringify(example);
        Object.freeze(example);
        assert.equal(validate(example), "", example.type);
        assert.equal(JSON.stringify(example), before);
    }
});

test("invalid input and unsupported types yield a field-specific error, not an exception", () => {
    for (const value of [null, undefined, [], "Tekst", {}]) {
        assert.match(validate(value), /Pole „(?:Blok|Typ bloku)”:/);
    }
    assert.match(validate(block("UNKNOWN")), /Typ bloku/);
    assert.match(validate(block("TEXT", { title: 12, content: "Treść" })), /Tytuł/);
});

test("title validation retains the 2000-character limit and divider exception", () => {
    assert.match(validate(block("TEXT", { title: "  ", content: "Treść" })), /Pole „Tytuł”/);
    assert.equal(validate(block("TEXT", { title: "x".repeat(2000), content: "Treść" })), "");
    assert.match(validate(block("TEXT", { title: "x".repeat(2001), content: "Treść" })), /2001.*2000/);
    assert.equal(validate(block("DIVIDER", { title: "" })), "");
});

test("display blocks identify missing content and media without adding URL restrictions", () => {
    assert.match(validate(block("TEXT", { content: " \n " })), /Pole „Treść”/);
    for (const type of ["IMAGE", "VIDEO", "PDF", "DOWNLOAD"]) {
        assert.match(validate(block(type)), /Adres materiału/);
        assert.equal(validate(block(type, { mediaUrl: "/uploads/plik.pdf" })), "");
    }
    assert.match(validate(block("AUDIO")), /Zwrot do wypowiedzenia/);
});

test("task errors distinguish instruction, expected solution, self-assessment and source code", () => {
    assert.match(validate(block("TASK", { expectedAnswer: "SQL" })), /Pole „Polecenie”/);
    assert.match(validate(block("TASK", { instruction: "Zadanie" })), /Pole „Poprawna odpowiedź”/);
    for (const type of ["CODE_REVIEW", "OPEN_RESPONSE"]) {
        assert.match(validate(block(type, { instruction: "Zadanie" })), /Model odpowiedzi i kryteria samooceny/);
    }
    for (const type of ["DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW"]) {
        assert.match(validate(block(type, { instruction: "Zadanie", expectedAnswer: "Rozwiązanie" })), /Pole „Kod/);
    }
    assert.equal(validate(block("TASK", { instruction: "Napisz SQL", expectedAnswer: "SELECT * FROM urzadzenia;" })), "");
});

test("practical laboratories require both the goal and a verification plan", () => {
    assert.match(validate(block("PRACTICAL_LAB", { content: "Sprawdź" })), /Cel i wymagania/);
    assert.match(validate(block("PRACTICAL_LAB", { instruction: "Zbuduj" })), /Weryfikacja i kryteria ukończenia/);
});

test("quiz errors explain separate options, duplicates and full-answer matching", () => {
    assert.match(validate(block("QUIZ", { content: "Jedna opcja", expectedAnswer: "Jedna opcja" })), /przynajmniej dwóch/);
    assert.match(validate(block("QUIZ", { content: "Prawda\n**prawda**", expectedAnswer: "Prawda" })), /muszą być różne/);
    assert.match(validate(block("QUIZ", { content: "Opcja A\nOpcja B", expectedAnswer: "A" })), /pełną treść.*nie samą literę/);
    assert.equal(validate(block("QUIZ", { content: "Opcja A\r\nOpcja B", expectedAnswer: "Opcja B" })), "");
});

test("all interactive blocks reject malformed JSON, nulls and arrays safely", () => {
    for (const type of ["DIALOG", "VOCABULARY", "WORD_LAB", "LISTENING", "SENTENCE_BUILDER"]) {
        for (const content of ["{", "null", "[]", "", "\"tekst\""]) {
            assert.match(validate(block(type, { content })), /Treść interaktywnego bloku.*JSON/, `${type}: ${content}`);
        }
    }
});

test("dialog errors locate an incomplete utterance and preserve supported character defaults", () => {
    assert.match(validate(configBlock("DIALOG", { ...dialog, turns: [dialog.turns[0]] })), /Dialog.*dwie wypowiedzi/);
    assert.match(validate(configBlock("DIALOG", { ...dialog, turns: [dialog.turns[0], { text: " " }] })), /Wypowiedź 2/);
    assert.equal(validate(configBlock("DIALOG", { kind: "dialog", turns: dialog.turns })), "");
});

test("vocabulary-family errors locate incomplete raw items instead of filtering them away", () => {
    for (const type of ["VOCABULARY", "WORD_LAB", "LISTENING"]) {
        assert.match(validate(configBlock(type, vocabulary([]))), /od 1 do 20/);
        assert.match(validate(configBlock(type, vocabulary(Array.from({ length: 21 }, () => word)))), /od 1 do 20/);
        assert.match(validate(configBlock(type, vocabulary([word, { term: "dog", translation: "" }]))), /Pozycja 2/);
        assert.match(validate(configBlock(type, vocabulary([word, null]))), /Pozycja 2/);
        assert.equal(validate(configBlock(type, vocabulary(Array.from({ length: 20 }, () => word)))), "");
    }
});

test("sentence validation checks the original tile count without silently truncating it", () => {
    const sentence = { kind: "sentence-builder", polishSentence: "Dzień dobry", words: ["Good", "morning"] };
    assert.match(validate(configBlock("SENTENCE_BUILDER", { ...sentence, polishSentence: "" })), /Zdanie po polsku/);
    assert.match(validate(configBlock("SENTENCE_BUILDER", { ...sentence, words: ["Hello"] })), /od 2 do 6/);
    assert.match(validate(configBlock("SENTENCE_BUILDER", { ...sentence, words: Array.from({ length: 7 }, () => "word") })), /od 2 do 6/);
    assert.match(validate(configBlock("SENTENCE_BUILDER", { ...sentence, words: ["Good", ""] })), /Kafelek 2/);
    assert.match(validate(configBlock("SENTENCE_BUILDER", { ...sentence, words: ["Good", 7] })), /Kafelek 2/);
});
