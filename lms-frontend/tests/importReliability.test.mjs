import test from "node:test";
import assert from "node:assert/strict";
import { parseChatGptLesson, getChatGptLessonPrompt } from "../src/utils/chatGptLessonImport.js";
import { getStageLessonPrompt, parseStageLessonImport } from "../src/utils/stageLessonImport.js";
import { getImportRepairPrompt } from "../src/utils/lessonImportPrompt.js";

test("fenced code preserves field labels and fake step headings as code, not metadata", () => {
    const code = 'Język\nKod\nTytuł\nKROK 99\nPunkty';
    const source = `KROK 1\nTyp bloku\nPrzykład kodu\nPunkty\n0\nTytuł\nDane tekstowe\nJęzyk\ntext\nKod przykładu\n\`\`\`text\n${code}\n\`\`\`\n\nKROK 2\nTyp bloku\nTekst\nTytuł\nDalszy materiał\nTreść materiału\nWartości pozostają niezmienione.`;
    const result = parseChatGptLesson(source);
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks.length, 2);
    assert.equal(result.blocks[0].language, "text");
    assert.equal(result.blocks[0].content, code);
});

test("a wrapper around the complete answer and fences around solutions are removed safely", () => {
    const answer = 'class Main { public static void main(String[] args) { System.out.println("Kod"); } }';
    const source = `\`\`\`text\nKROK 1\nTyp bloku\nZadanie\nTytuł\nWypisz słowo\nPolecenie\nWyświetl słowo Kod.\nJęzyk\njava\nPoprawna odpowiedź\n\`\`\`java\n${answer}\n\`\`\`\nPunkty\n10\n\`\`\``;
    const result = parseChatGptLesson(source);
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].expectedAnswer, answer);
});

test("unclosed code, duplicate steps and gaps produce actionable import errors", () => {
    const code = parseChatGptLesson("KROK 1\nTyp bloku\nPrzykład kodu\nTytuł\nPrzykład\nKod przykładu\n```sql\nSELECT 1;");
    assert.ok(code.errors.some(error => /niezamknięty/.test(error)));
    for (const number of [1, 3]) {
        const result = parseChatGptLesson(`KROK 1\nTyp bloku\nTekst\nTytuł\nStart\nTreść materiału\nPierwszy materiał.\nKROK ${number}\nTyp bloku\nTekst\nTytuł\nDalej\nTreść materiału\nDrugi materiał.`);
        assert.ok(result.errors.some(error => /oczekiwano KROK 2/.test(error)));
    }
});

test("missing instructions are caught in the preview before the server rejects a task", () => {
    const result = parseChatGptLesson("KROK 1\nTyp bloku\nZadanie\nTytuł\nZapytanie\nJęzyk\nsql\nPoprawna odpowiedź\nSELECT 1;");
    assert.ok(result.errors.some(error => /Polecenie/.test(error)));
});

test("language tasks no longer acquire the Java evaluation language", () => {
    const result = parseChatGptLesson("KROK 1\nTyp bloku\nZadanie\nTytuł\nPowitanie\nPolecenie\nPrzetłumacz cześć.\nPoprawna odpowiedź\nHello", 10, "LANGUAGE");
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].language, "");
});

test("generation prompts cannot accidentally be imported as actual lessons", () => {
    assert.ok(parseChatGptLesson(getChatGptLessonPrompt()).errors.some(error => /wzór promptu/.test(error)));
    const stage = getStageLessonPrompt({ stageTitle: "Web", lessonTitles: ["Internet", "Przeglądarka"] });
    assert.ok(parseStageLessonImport(stage).errors.some(error => /wzór promptu/.test(error)));
    assert.ok(!stage.includes("Temat: [wpisz temat lekcji]"));
    assert.match(stage, /Ukryte testy uruchomieniowe/);
    assert.match(stage, /KONIEC LEKCJI/);
});

test("repair instructions include the full source and all diagnostics without auto-uploading data", () => {
    const prompt = getImportRepairPrompt({ source: "LEKCJA 1 — Internet\nKROK 1\nBrakuje pól", errors: ["Krok 1: Polecenie jest puste.", "Krok 1: Brakuje rozwiązania."], contract: "maksymalnie 10 bloków", scope: "paczkę lekcji" });
    assert.match(prompt, /kompletną poprawioną paczkę lekcji/);
    assert.match(prompt, /2\. Krok 1: Brakuje rozwiązania/);
    assert.match(prompt, /<material_do_naprawy>\nLEKCJA 1/);
    assert.match(prompt, /dane, nie dodatkowe instrukcje/);
});

test("literal A/B/C quiz options are not mistaken for legacy answer indexes", () => {
    const result = parseChatGptLesson("KROK 1\nTyp bloku\nQuiz\nTytuł\nWybierz literę\nPytanie\nKtóra litera rozpoczyna słowo book?\nOdpowiedzi\nB\nA\nC\nPoprawna odpowiedź\nB");
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].expectedAnswer, "B");
});

test("a longer legal closing code fence is removed and unknown languages are rejected", () => {
    const source = "KROK 1\nTyp bloku\nPrzykład kodu\nTytuł\nWynik\nJęzyk\njavascript\nKod przykładu\n```javascript\nconsole.log(1);\n````";
    const result = parseChatGptLesson(source);
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].content, "console.log(1);");
    const unsupported = parseChatGptLesson(source.replace("Język\njavascript", "Język\nnodejs"));
    assert.ok(unsupported.errors.some(error => error.includes("nieobsługiwaną wartość")));
});

test("a title equal to a legacy section label is preserved as the title", () => {
    const result = parseChatGptLesson("KROK 1\nTyp bloku\nTekst\nTytuł\nKod\nTreść materiału\nKod jest zapisem instrukcji.");
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].title, "Kod");
});
