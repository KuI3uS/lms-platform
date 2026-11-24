import test from "node:test";
import assert from "node:assert/strict";
import { CODE_LANGUAGE_OPTIONS, getMonacoLanguage, normalizeCodeLanguage } from "../src/utils/codeLanguages.js";
import { parseStageLessonImport } from "../src/utils/stageLessonImport.js";

const properties = [
    "# Konfiguracja testowa",
    "spring.datasource.url=jdbc:h2:mem:test;MODE=MySQL",
    "spring.datasource.password=${DB_PASSWORD:}",
    "spring.config.import=optional:file:.env[.properties]",
    "message=Zażółć gęślą jaźń",
    "path=C:\\projekty\\edu-hub"
].join("\n");

test("properties is accepted as language metadata and uses Monaco's configuration-file mode", () => {
    assert.equal(CODE_LANGUAGE_OPTIONS.filter(option => option.value === "properties").length, 1);
    assert.equal(normalizeCodeLanguage("  PROPERTIES  "), "properties");
    assert.equal(getMonacoLanguage("properties"), "ini");
});

test("ninth-step properties examples and tasks import without changing configuration values or secret placeholders", () => {
    const introduction = Array.from({ length: 8 }, (_, index) => `KROK ${index + 1}
Typ bloku
Tekst
Tytuł
Wprowadzenie ${index + 1}
Treść materiału
Opis konfiguracji.`).join("\n\n");
    const example = `KROK 9
Typ bloku
Przykład kodu
Tytuł
Konfiguracja profilu testowego
Język
properties
Kod przykładu
\`\`\`properties
${properties}
\`\`\``;
    const task = `KROK 9
Typ bloku
Zadanie
Tytuł
Oddzielne sekrety
Polecenie
Skonfiguruj wartości przez zmienne środowiskowe.
Język
properties
Kod startowy
\`\`\`properties
${properties}
\`\`\`
Poprawna odpowiedź
\`\`\`properties
${properties}
\`\`\``;
    const result = parseStageLessonImport(`LEKCJA 1 — application-test
${introduction}
${example}
KONIEC LEKCJI

LEKCJA 2 — Profile aplikacji
${introduction}
KONIEC LEKCJI

LEKCJA 3 — Oddzielne secrets
${introduction}
${task}
KONIEC LEKCJI`);
    assert.deepEqual(result.errors, []);
    assert.equal(result.lessonCount, 3);
    assert.equal(result.blockCount, 26);
    assert.equal(result.lessons[0].blocks[8].language, "properties");
    assert.equal(result.lessons[0].blocks[8].content, properties);
    assert.equal(result.lessons[2].blocks[8].language, "properties");
    assert.equal(result.lessons[2].blocks[8].starterCode, properties);
    assert.equal(result.lessons[2].blocks[8].expectedAnswer, properties);
});
