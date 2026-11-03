import test from "node:test";
import assert from "node:assert/strict";
import { parseChatGptLesson } from "../src/utils/chatGptLessonImport.js";
import { parseStageLessonImport } from "../src/utils/stageLessonImport.js";
import { getLessonBlockValidationError } from "../src/utils/lessonBlockValidation.js";

const ticketOptions = ["ticketcard", "ticket-card", "TicketCard", "ticket_card"];
const quiz = (options, correctAnswer) => `KROK 1
Typ bloku
Quiz
Pytanie
Która nazwa jest zgodna z poleceniem?
Odpowiedzi
${options.join("\n")}
Poprawna odpowiedź
${correctAnswer}`;

test("ticketcard variants are different options and every exact correct answer is retained", () => {
    for (const correctAnswer of ticketOptions) {
        const result = parseChatGptLesson(quiz(ticketOptions, correctAnswer));
        assert.deepEqual(result.errors, [], correctAnswer);
        assert.equal(result.blocks[0].expectedAnswer, correctAnswer);
        assert.deepEqual(result.blocks[0].content.split("\n").sort(), [...ticketOptions].sort());
        assert.equal(getLessonBlockValidationError(result.blocks[0]), "");
    }
});

test("the stage importer accepts all four ticketcard options without changing their spelling", () => {
    const source = ticketOptions.map((correct, index) => (
        `LEKCJA ${index + 1} — Nazwy ${index + 1}\n${quiz(ticketOptions, correct)}\nKONIEC LEKCJI`
    )).join("\n\n");
    const result = parseStageLessonImport(source);
    assert.deepEqual(result.errors, []);
    assert.equal(result.lessonCount, 4);
    assert.equal(result.blockCount, 4);
    assert.deepEqual(result.lessons.map(lesson => lesson.blocks[0].expectedAnswer), ticketOptions);
});

test("case, diacritics, punctuation and internal spaces remain meaningful option identity", () => {
    for (const options of [
        ["a", "A", "ą", "á"],
        ["laska", "łaska", "Laska", "Łaska"],
        ["Prawda", "**prawda**", "# Prawda", "prawda"],
        ["ticket card", "ticket  card", "ticket-card", "ticket_card"],
        ["x > y", "x < y", "x >= y", "x <= y"]
    ]) {
        for (const expectedAnswer of options) {
            const block = Object.freeze({ type: "QUIZ", title: "Wybierz zapis", content: options.join("\n"), expectedAnswer });
            assert.equal(getLessonBlockValidationError(block), "", expectedAnswer);
            const result = parseChatGptLesson(quiz(options, expectedAnswer));
            assert.deepEqual(result.errors, [], expectedAnswer);
            assert.equal(result.blocks[0].expectedAnswer, expectedAnswer);
        }
    }
});

test("actually identical options after trim are still blocked in all import paths", () => {
    for (const options of [["ticketcard", "ticketcard"], ["ticketcard", " ticketcard "], ["A", "A"], ["łaska", "łaska"]]) {
        const expectedAnswer = options[0];
        const block = { type: "QUIZ", title: "Duplikaty", content: options.join("\n"), expectedAnswer };
        assert.match(getLessonBlockValidationError(block), /muszą być różne/);
        assert.ok(parseChatGptLesson(quiz(options, expectedAnswer)).errors.some(error => /muszą być różne/.test(error)));
        const stage = parseStageLessonImport(`LEKCJA 1 — Nazwy\n${quiz(options, expectedAnswer)}\nKONIEC LEKCJI`);
        assert.ok(stage.errors.some(error => /muszą być różne/.test(error)));
    }
});

test("literal letters and non-ASCII letters are never normalized into another option", () => {
    for (const expectedAnswer of ["B", "A", "C", "D", "a", "ą"]) {
        const options = ["B", "A", "C", "D", "a", "ą"];
        const result = parseChatGptLesson(quiz(options, expectedAnswer));
        assert.deepEqual(result.errors, []);
        assert.equal(result.blocks[0].expectedAnswer, expectedAnswer);
    }
    for (const wrongAnswer of ["ą", "á", "**A**", "# A", "TICKETCARD"]) {
        const result = parseChatGptLesson(quiz(ticketOptions, wrongAnswer));
        assert.ok(result.errors.some(error => /Poprawna odpowiedź/.test(error)), wrongAnswer);
    }
    assert.match(getLessonBlockValidationError({ type: "QUIZ", title: "Nazwy", content: ticketOptions.join("\n"), expectedAnswer: "TICKETCARD" }), /Poprawna odpowiedź/);
});

test("unambiguous ASCII legacy indexes still resolve after exact matches are checked", () => {
    for (const [key, expected] of [["A", "Kot"], ["b", "Pies"], ["C", "Ryba"], ["d", "Ptak"]]) {
        const result = parseChatGptLesson(quiz(["Kot", "Pies", "Ryba", "Ptak"], key));
        assert.deepEqual(result.errors, []);
        assert.equal(result.blocks[0].expectedAnswer, expected);
    }
    const legacy = `KROK 1
Typ bloku
Quiz
Pytanie
Wybierz zwierzę.
Odpowiedź B
Pies
Odpowiedź D
Ptak
Poprawna odpowiedź
B`;
    const result = parseChatGptLesson(legacy);
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].expectedAnswer, "Pies");
    assert.ok(parseChatGptLesson(legacy.replace("Poprawna odpowiedź\nB", "Poprawna odpowiedź\nA")).errors.some(error => /Poprawna odpowiedź/.test(error)));
});
