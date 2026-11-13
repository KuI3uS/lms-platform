import test from "node:test";
import assert from "node:assert/strict";
import messages from "../src/i18n/workspaceMessages.js";

const placeholders = text => [...text.matchAll(/\{([a-zA-Z][\w]*)\}/g)]
    .map(match => match[1]).sort();

test("workspace and lesson UI messages have complete English and Spanish translations", () => {
    assert.ok(Object.keys(messages).length > 100);
    for (const [source, translations] of Object.entries(messages)) {
        for (const language of ["en", "es"]) {
            assert.equal(typeof translations[language], "string", `${source}: ${language}`);
            assert.ok(translations[language].trim(), `${source}: ${language} is empty`);
            assert.deepEqual(placeholders(translations[language]), placeholders(source), `${source}: ${language} parameters`);
        }
    }
});

test("lesson navigation and checker explanations are translated without changing technical tokens", () => {
    assert.equal(messages["Lekcja {number} z {total}"].en, "Lesson {number} of {total}");
    assert.equal(messages["Lekcja {number} z {total}"].es, "Lección {number} de {total}");
    const phpExplanation = Object.entries(messages).find(([source]) => source.startsWith("porównujemy przesłany kod"))[1];
    for (const translation of Object.values(phpExplanation)) {
        assert.ok(translation.includes("<?php"));
        assert.ok(translation.includes("$"));
        assert.ok(translation.includes("XAMPP"));
    }
});
