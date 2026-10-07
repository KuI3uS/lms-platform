import test from "node:test";
import assert from "node:assert/strict";
import { cleanChatGptBlock, cleanChatGptText } from "../src/utils/chatGptReferences.js";
import { parseChatGptLesson } from "../src/utils/chatGptLessonImport.js";

const marker = ':chatgpt-content-reference{index="0"}';

test("removes copied ChatGPT reference markers without changing lesson formatting", () => {
    const source = `# Obraz ISO\n\n- Zamontuj obraz.${marker}\n- Sprawdź wynik.:chatgpt-content-reference{index='12'}\n\n    mount image.iso\n`;
    assert.equal(cleanChatGptText(source), "# Obraz ISO\n\n- Zamontuj obraz.\n- Sprawdź wynik.\n\n    mount image.iso\n");
    assert.equal(cleanChatGptText('Dysk\\:chatgpt-content-reference{index=1}.'), "Dysk.");
    assert.equal(cleanChatGptText('ISO:contentReference[oaicite:2]{index=0}.'), "ISO.");
    assert.equal(cleanChatGptText(cleanChatGptText(source)), cleanChatGptText(source));
});

test("ordinary braces, indexes, commands and URLs remain intact", () => {
    const source = 'const data = { index: "0" };\nhttps://example.com/file#reference\nmount -o loop image.iso /mnt/iso\n\n:chatgpt-content-reference without attributes';
    assert.equal(cleanChatGptText(source), source);
    assert.equal(cleanChatGptText(null), "");
});

test("legacy block cleanup preserves metadata and valid interactive JSON", () => {
    const block = {
        id: 5, type: "VOCABULARY", title: `Słowa${marker}`, points: 25, published: true,
        content: JSON.stringify({items: [{term: `cat\\${marker}`, translation: "kot"}]}),
        instruction: `Przypomnij słowo${marker}`, hint: `Zwierzę${marker}`
    };
    const clean = cleanChatGptBlock(block);
    assert.equal(clean.title, "Słowa");
    assert.equal(clean.instruction, "Przypomnij słowo");
    assert.equal(clean.hint, "Zwierzę");
    assert.deepEqual(JSON.parse(clean.content), {items: [{term: "cat", translation: "kot"}]});
    assert.equal(clean.id, 5);
    assert.equal(clean.points, 25);
    assert.equal(clean.published, true);
    assert.equal(block.title, `Słowa${marker}`);
});

test("import removes references from headings, answers, XP and summary content", () => {
    const source = `${marker}KROK 1\nTyp bloku\nQuiz\nPytanie\nCo montujemy?${marker}\nOdpowiedzi\nObraz ISO${marker}\nFolder\nPoprawna odpowiedź\nObraz ISO${marker}\nPunkty\n25${marker}\n\nKROK 2\nTyp bloku\nPodsumowanie\nTytuł\nZapamiętaj${marker}\nNajważniejsze punkty\nSprawdź obraz ISO.${marker}`;
    const result = parseChatGptLesson(source);
    assert.deepEqual(result.errors, []);
    assert.equal(result.blocks[0].title, "Co montujemy?");
    assert.equal(result.blocks[0].expectedAnswer, "Obraz ISO");
    assert.equal(result.blocks[0].points, 25);
    assert.equal(result.blocks[1].title, "Zapamiętaj");
    assert.equal(result.blocks[1].content, "Sprawdź obraz ISO.");
    assert.ok(!JSON.stringify(result.blocks).includes("chatgpt-content-reference"));
});
