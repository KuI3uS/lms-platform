import assert from "node:assert/strict";
import test from "node:test";
import { CODE_LANGUAGE_OPTIONS } from "../src/utils/codeLanguages.js";
import { getChatGptLessonPrompt, getImportRepairPrompt } from "../src/utils/lessonImportPrompt.js";
import { getStageLessonPrompt } from "../src/utils/stageLessonImport.js";

test("single lesson and stage prompts share the editor language list including PHP", () => {
    const prompts = [
        getChatGptLessonPrompt(),
        getStageLessonPrompt({ stageTitle: "PHP od podstaw", lessonTitles: ["Pierwszy skrypt PHP"] })
    ];
    assert.ok(CODE_LANGUAGE_OPTIONS.some(option => option.value === "php"));
    for (const prompt of prompts) {
        assert.ok(prompt.includes(`Języki edytora i wzorca: ${CODE_LANGUAGE_OPTIONS.map(option => option.value).join(", ")}.`));
        assert.ok(prompt.includes("Język → php"));
        assert.ok(prompt.includes("nie wykonuje PHP"));
        assert.ok(prompt.includes("<?php"));
        assert.ok(prompt.includes("zmienne z $"));
        assert.match(prompt, /Tylko java ma Ukryte testy uruchomieniowe/);
    }
});

test("repair prompts preserve literal PHP code and the supported language contract", () => {
    const source = '<?php\n$imie = "Ala";\necho $imie;';
    const prompt = getImportRepairPrompt({ source, errors: [], contract: getChatGptLessonPrompt() });
    assert.ok(prompt.includes(source));
    assert.ok(prompt.includes("Język → php"));
});
