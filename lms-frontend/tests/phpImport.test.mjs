import test from "node:test";
import assert from "node:assert/strict";
import { CODE_LANGUAGE_OPTIONS, getMonacoLanguage, normalizeCodeLanguage } from "../src/utils/codeLanguages.js";
import { parseChatGptLesson } from "../src/utils/chatGptLessonImport.js";
import { parseStageLessonImport } from "../src/utils/stageLessonImport.js";

const phpCode = String.raw`<?php
$imie = "Ala";
$waluta = 'PLN';
$opis = "Zmienna \$imie zawiera: $imie";
$html = '<strong>KROK 99: Język i Kod</strong>';
echo $opis . " — " . $waluta;
?>`;
const starterCode = String.raw`<?php
$imie = "Ala";
// Uzupełnij kod.
?>`;
const fenced = code => `\`\`\`php\n${code}\n\`\`\``;
const example = language => `KROK 1
Typ bloku
Przykład kodu
Tytuł
Pierwszy skrypt
Język
${language}
Kod przykładu
${fenced(phpCode)}`;

test("PHP is available exactly once in the common editor options and uses Monaco PHP", () => {
    assert.deepEqual(CODE_LANGUAGE_OPTIONS.filter(option => option.value === "php"), [{ value: "php", label: "PHP" }]);
    assert.equal(normalizeCodeLanguage("  PHP  "), "php");
    assert.equal(getMonacoLanguage("PHP"), "php");
    assert.equal(getMonacoLanguage("text"), "plaintext");
    assert.equal(getMonacoLanguage("bash"), "shell");
    assert.equal(getMonacoLanguage("java"), "java");
    assert.equal(getMonacoLanguage(null), "plaintext");
    assert.equal(normalizeCodeLanguage("php8"), "");
});

test("the importer accepts every common code language token without a second whitelist", () => {
    for (const { value } of CODE_LANGUAGE_OPTIONS) {
        const result = parseChatGptLesson(example(value));
        assert.deepEqual(result.errors, [], value);
        assert.equal(result.blocks[0].language, value);
        assert.equal(result.blocks[0].content, phpCode);
    }
});

test("PHP example imports preserve opening tags, dollar variables, escaped strings and closing tags", () => {
    for (const language of ["php", "PHP"]) {
        const result = parseChatGptLesson(example(language));
        assert.deepEqual(result.errors, []);
        assert.equal(result.blocks[0].language, "php");
        assert.equal(result.blocks[0].content, phpCode);
        assert.ok(result.blocks[0].content.startsWith("<?php\n$imie"));
        assert.ok(result.blocks[0].content.endsWith("?>"));
    }
});

test("PHP tasks and debugging preserve both code fields and do not invent runtime tests", () => {
    for (const type of ["Zadanie", "Debugowanie"]) {
        const result = parseChatGptLesson(`KROK 1
Typ bloku
${type}
Tytuł
Wypisz dane
Polecenie
Przygotuj skrypt PHP i sprawdź działanie w XAMPP.
Język
php
Kod startowy
${fenced(starterCode)}
Poprawna odpowiedź
${fenced(phpCode)}
Punkty
20`);
        assert.deepEqual(result.errors, [], type);
        assert.equal(result.blocks[0].language, "php");
        assert.equal(result.blocks[0].starterCode, starterCode);
        assert.equal(result.blocks[0].expectedAnswer, phpCode);
        assert.equal(result.blocks[0].hiddenTests, "");
        assert.equal(result.blocks[0].points, 20);
    }
});

test("stage packages accept PHP blocks without splitting strings into fake steps", () => {
    const result = parseStageLessonImport(`LEKCJA 1 — Poznaj PHP
${example("php")}
KONIEC LEKCJI

LEKCJA 2 — Zmienne PHP
${example("PHP")}
KONIEC LEKCJI`);
    assert.deepEqual(result.errors, []);
    assert.equal(result.lessonCount, 2);
    assert.equal(result.blockCount, 2);
    assert.equal(result.lessons[0].blocks[0].content, phpCode);
    assert.equal(result.lessons[1].blocks[0].language, "php");
});

test("existing code aliases and strict unknown-language diagnostics remain supported", () => {
    for (const [alias, expected] of [["C#", "csharp"], ["shell", "bash"], ["yml", "yaml"], ["tekst", "text"]]) {
        const result = parseChatGptLesson(example(alias));
        assert.deepEqual(result.errors, []);
        assert.equal(result.blocks[0].language, expected);
    }
    assert.ok(parseChatGptLesson(example("php8" )).errors.some(error => error.includes("nieobsługiwaną wartość")));
});
