import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONTENT_LANGUAGES, contentLanguageOf, courseCatalogPath, courseLocaleCacheOwner, courseMatchesLanguage } from "../src/utils/courseContentLanguage.js";
import { translateUi } from "../src/utils/localization.js";
import messages from "../src/i18n/courseLocaleMessages.js";
import { getChatGptLessonPrompt } from "../src/utils/lessonImportPrompt.js";
import { getStageLessonPrompt } from "../src/utils/stageLessonImport.js";

test("legacy courses are Polish even if they teach English or Spanish", () => {
    assert.equal(contentLanguageOf({ category: "LANGUAGE", courseLanguage: "ENGLISH" }), "pl");
    assert.equal(courseMatchesLanguage({ courseLanguage: "SPANISH" }, "es"), false);
    assert.equal(courseMatchesLanguage({ contentLanguage: "es", courseLanguage: "ENGLISH" }, "es"), true);
    assert.deepEqual(CONTENT_LANGUAGES.map(item => item.value), ["pl", "en", "es"]);
});

test("student API paths request one language; all-language access must be explicit", () => {
    assert.equal(courseCatalogPath("/courses", "es"), "/courses?lang=es");
    assert.equal(courseCatalogPath("/courses/my", "en-GB"), "/courses/my?lang=en");
    assert.equal(courseCatalogPath("/courses?allLanguages=true", "en"), "/courses?lang=en");
    assert.equal(courseCatalogPath("/courses", "pl", { allLanguages: true }), "/courses?lang=pl&allLanguages=true");
});

test("catalog caches never mix users or languages", () => {
    const keys = ["student1", "student2"].flatMap(owner => CONTENT_LANGUAGES.map(item => courseLocaleCacheOwner(owner, item.value)));
    assert.equal(new Set(keys).size, 6);
    const source = readFileSync(new URL("../src/pages/DashboardPage.jsx", import.meta.url), "utf8");
    assert.match(source, /courseLocaleCacheOwner/);
    assert.match(source, /DashboardContent key=\{owner\}/);
});

test("new notices and controls have complete English and Spanish translations", () => {
    for (const [source, translations] of Object.entries(messages)) {
        for (const language of ["en", "es"]) {
            assert.ok(translations[language], `${language}: ${source}`);
            assert.notEqual(translateUi(source, language), source);
        }
    }
});

test("import prompts use course language, never administrator UI language", () => {
    for (const [contentLanguage, label] of [["pl", "polski"], ["en", "angielski"], ["es", "hiszpański"]]) {
        const prompt = getChatGptLessonPrompt(10, "PROGRAMMING", { contentLanguage });
        assert.ok(prompt.includes(`JĘZYK TREŚCI KURSU: ${label} (${contentLanguage})`));
        assert.ok(prompt.includes("NIE tłumacz technicznych etykiet importera"));
        const stage = getStageLessonPrompt({ contentLanguage, stageTitle: "Stage 1", lessonTitles: ["First lesson"] });
        assert.ok(stage.includes(`JĘZYK TREŚCI KURSU: ${label} (${contentLanguage})`));
        assert.ok(stage.includes("First lesson"));
    }
    const languagePrompt = getChatGptLessonPrompt(10, "LANGUAGE", { contentLanguage: "es" });
    assert.ok(languagePrompt.includes("Język poleceń i objaśnień: hiszpański (es)"));
    assert.ok(!languagePrompt.includes("Język interfejsu poleceń: polski"));
});
