import test from "node:test";
import assert from "node:assert/strict";
import { checkVocabularyAnswer, vocabularyHint } from "../src/utils/vocabularyPractice.js";

const item = { term: "cat", translation: "kot", acceptedAnswers: ["kotek"] };

test("a hint unlocks on the third failed answer, not earlier", () => {
    let failedAttempts = 0;
    for (const answer of ["pies", "dom", "ptak"]) {
        const attempt = checkVocabularyAnswer(item, answer, failedAttempts);
        assert.equal(attempt.accepted, false);
        failedAttempts = attempt.failedAttempts;
        assert.equal(Boolean(vocabularyHint(item.translation, failedAttempts)), failedAttempts === 3);
    }
    const hint = vocabularyHint(item.translation, failedAttempts);
    assert.ok(hint.includes("k__"));
    assert.ok(!hint.includes("kot"));
});

test("empty input is not a failed attempt and accepted alternatives still work", () => {
    assert.equal(checkVocabularyAnswer(item, "   ", 2), null);
    assert.equal(checkVocabularyAnswer(null, "kot", 2), null);
    const correct = checkVocabularyAnswer(item, "kotek", 3);
    assert.equal(correct.accepted, true);
    assert.equal(correct.failedAttempts, 3);
    assert.equal(vocabularyHint(item.translation, 0), null);
});

test("hint handles Polish letters and multiword answers without revealing them", () => {
    const hint = vocabularyHint("do widzenia", 3);
    assert.ok(hint.includes("Liczba liter lub cyfr: 10"));
    assert.ok(hint.includes("d_ ________"));
    assert.ok(!hint.includes("do widzenia"));
    assert.ok(vocabularyHint("żółw", 3).includes("ż___"));
    assert.equal(vocabularyHint("", 3), null);
    assert.ok(!vocabularyHint("P", 3).includes("„P”"));
});
