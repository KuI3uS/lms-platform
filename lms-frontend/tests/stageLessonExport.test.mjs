import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exportLessonBlock, formatStageExport, stageExportFilename } from "../src/utils/stageLessonExport.js";
import { parseStageLessonImport } from "../src/utils/stageLessonImport.js";
import { parseChatGptLesson } from "../src/utils/chatGptLessonImport.js";
import { UI_MESSAGES } from "../src/utils/localization.js";
import messages from "../src/i18n/stageExportMessages.js";

const base = {
    title: "Opis", type: "TEXT", content: "Treść materiału\nLEKCJA 99 — przykład w materiale\nKROK 77\nKONIEC LEKCJI\n~~~\n```java\nSystem.out.println(1);\n```",
    description: "Pytanie", instruction: "Odpowiedz po analizie.", starterCode: "", expectedAnswer: "",
    hint: "Pierwsza wskazówka", detailedHint: "Druga wskazówka", solutionExplanation: "Wyjaśnienie",
    hiddenTests: "", language: "", mediaUrl: "", mediaType: "", published: false, points: 0
};
const block = (type, changes = {}) => ({ ...base, type, ...changes });
const stage = lessons => ({ version: 1, stageNumber: 2, stageTitle: "JDK, JVM i JRE", sectionTitle: "CZĘŚĆ I", courseTitle: "Java", contentLanguage: "pl", lessons });
const lesson = (title, blocks) => ({ title, published: false, freePreview: true, blocks });

test("vertical export round-trips every block type, private tests, publication and interactive JSON", () => {
    const vocabulary = JSON.stringify({ version: 1, kind: "vocabulary", items: [{ id: "stable-id", term: "house", translation: "dom", example: "My house.", alternatives: ["budynek"], audioUrl: "/voice.mp3" }], customSetting: true });
    const dialog = JSON.stringify({ version: 1, kind: "dialog", characters: [{id:"speaker-1",name:"Emma"},{id:"speaker-2",name:"Leo"}], studentCharacterId:"speaker-2", turns:[{id:"one",text:"Hello!",characterId:"speaker-1"},{id:"two",text:"Good morning.",characterId:"speaker-2",prompt:"Dzień dobry",acceptedAnswers:["Hi!"]}] });
    const list = [
        ...["TEXT","TIP","INFO","WARNING","SUMMARY","QUOTE"].map(type => block(type)),
        block("EXAMPLE",{language:"java",mediaType:"code"}),
        ...["IMAGE","VIDEO","PDF","DOWNLOAD"].map(type => block(type,{mediaUrl:"https://example.invalid/file",mediaType:"file"})),
        block("AUDIO",{content:"Good morning",language:"en-GB",mediaType:"audio"}),
        block("DIALOG",{content:dialog,language:"en-GB",mediaType:"dialog"}),
        ...["VOCABULARY","WORD_LAB","LISTENING"].map(type=>block(type,{content:vocabulary,language:"en-GB",mediaType:type.toLowerCase()})),
        block("SENTENCE_BUILDER",{content:JSON.stringify({kind:"sentence-builder",polishSentence:"Mam dom.",words:["I","have","a","house."],customSetting:true}),language:"en-GB"}),
        ...["TASK","DEBUGGING","PREDICT_OUTPUT","CODE_REVIEW","OPEN_RESPONSE"].map(type=>block(type,{starterCode:"public class Main {\n    // Kod\n}\n",expectedAnswer:"  wynik\n\n",hiddenTests:"<brak> => wynik\n1 => inny",language:type==="OPEN_RESPONSE"?"":"java",points:87})),
        block("PRACTICAL_LAB"),
        block("QUIZ",{content:"ticketcard\nTicketCard\nticket-card\nticket_card",expectedAnswer:"TicketCard",points:45}),
        block("DIVIDER",{title:"",content:"",mediaType:"dots"})
    ];
    const lessons = [lesson("Pierwsza",list.slice(0,10)),lesson("Druga",list.slice(10,20)),lesson("Trzecia",list.slice(20))];
    const output = formatStageExport(stage(lessons));
    assert.match(output,/KROK 1\nFormat bloku\nEDUHUB_BLOCK_V1\nTyp bloku\nTekst\nPunkty\n0\nOpublikowany\nfalse/);
    const parsed = parseStageLessonImport(output);
    assert.deepEqual(parsed.errors,[]);
    assert.equal(parsed.lessonCount,3);
    const actual = parsed.lessons.flatMap(item=>item.blocks);
    assert.equal(actual.length,list.length);
    actual.forEach((item,index)=>assert.deepEqual(item,list[index],"block "+index));
});

test("ChatGPT lesson-by-lesson code fences and a translated quiz stay importable", () => {
    const quiz = block("QUIZ",{title:"Pytanie",content:"Pierwsza odpowiedź\nDruga odpowiedź",expectedAnswer:"Pierwsza odpowiedź"});
    const fence = String.fromCharCode(96).repeat(4);
    const source = ["ETAP 2 — English stage", fence + "text", "LEKCJA 1 — First lesson", exportLessonBlock(quiz,1), "KONIEC LEKCJI", fence, fence + "text", "LEKCJA 2 — Second lesson", exportLessonBlock(block("TEXT"),1), "KONIEC LEKCJI", fence].join("\n\n");
    const translated = source.replaceAll("Pierwsza odpowiedź","First answer").replaceAll("Druga odpowiedź","Second answer");
    const parsed = parseStageLessonImport(translated);
    assert.deepEqual(parsed.errors,[]);
    assert.equal(parsed.lessonCount,2);
    assert.equal(parsed.lessons[0].blocks[0].expectedAnswer,"First answer");
    assert.equal(parsed.lessons[1].blocks[0].content,base.content);
});

test("accidental changes to technical code, hidden tests, points and visibility block import", () => {
    const source = exportLessonBlock(block("TASK",{language:"java",starterCode:"class Main {}",expectedAnswer:"true",hiddenTests:"<brak> => true",points:50}),1);
    for(const [from,to] of [["class Main","class Changed"],["<brak> => true","<brak> => false"],["Punkty\n50","Punkty\n51"],["Opublikowany\nfalse","Opublikowany\ntrue"]]) {
        const parsed = parseChatGptLesson(source.replace(from,to));
        assert.ok(parsed.errors.some(error=>error.includes("chronione pola techniczne")),from);
    }
    assert.deepEqual(parseChatGptLesson(source.replace("Pierwsza wskazówka","First hint")).errors,[]);
});

test("export includes empty and legacy lessons, does not mutate input, and does not silently truncate large stages", () => {
    const input = stage([lesson("Pusta",[]),{...lesson("Starsza",[]),theory:"Teoria\nLEKCJA 9 — treść",example:"CODE",content:"Treść",imageUrl:"/image.png"}]);
    const snapshot=JSON.stringify(input);
    const output=formatStageExport(input,{targetLanguage:"es"});
    assert.match(output,/LEKCJA 1 — Pusta/);
    for(const marker of ["Starszy materiał lekcji — teoria","Starszy materiał lekcji — przykład kodu","Starszy materiał lekcji — treść","Starszy materiał lekcji — obraz"]) assert.ok(output.includes(marker));
    assert.equal(JSON.stringify(input),snapshot);
    const large=stage(Array.from({length:51},(_,index)=>lesson("Lesson "+index,[block("TEXT")])));
    assert.match(formatStageExport(large),/LEKCJA 51 — Lesson 50/);
    assert.ok(parseStageLessonImport(formatStageExport(large)).errors.some(error=>error.includes("maksymalnie 50")));
});

test("interactive translation can change native explanations but not taught words or stable IDs", () => {
    const original = exportLessonBlock(block("VOCABULARY",{content:JSON.stringify({kind:"vocabulary",items:[{id:"term-1",term:"house",translation:"dom",example:"My house."}]}),language:"en-GB"}),1);
    assert.deepEqual(parseChatGptLesson(original.replace('"dom"','"home"')).errors,[]);
    for(const [from,to] of [['"house"','"casa"'],['"term-1"','"term-2"']]) {
        assert.ok(parseChatGptLesson(original.replace(from,to)).errors.some(error=>error.includes("chronione pola")));
    }
});

test("every new export control has both interface translations", () => {
    for(const [source,translations] of Object.entries(messages)) {
        assert.ok(translations.en?.trim(),source);
        assert.ok(translations.es?.trim(),source);
    }
    const source=readFileSync(new URL("../src/components/StageExportDialog.jsx",import.meta.url),"utf8");
    for(const match of source.matchAll(/\bt\("([^"\n]+)"/g)) assert.ok(UI_MESSAGES[match[1]],match[1]);
});

test("translation instructions request vertical separate lessons and protect programming and taught languages", () => {
    for(const targetLanguage of ["en","es"]) {
        const output=formatStageExport(stage([lesson("Pierwsza",[block("TEXT")])]),{targetLanguage});
        assert.match(output,/OSOBNYM bloku zwykłego tekstu/);
        assert.match(output,/etykieta i jej wartość pod spodem/);
        assert.match(output,/NIE tłumacz etykiet technicznych/);
        assert.match(output,/NIE tłumacz ćwiczonego języka/);
        assert.match(output,/Puste lekcje pozostaw puste/);
    }
    assert.throws(()=>formatStageExport(stage([]),{targetLanguage:"fr"}));
    assert.throws(()=>exportLessonBlock(block("UNKNOWN"),1));
    assert.match(stageExportFilename({...stage([]),stageTitle:"../Zażółć <script> /"},"es"),/^eduhub-etap-2-zazolc-script-pl-do-es\.txt$/);
});

test("the UI and API enforce administrator-only exports without using student-answer endpoints", () => {
    const source = readFileSync(new URL("../src/components/StageExportDialog.jsx",import.meta.url),"utf8");
    assert.match(source,/if \(!isAdmin\) return null/);
    assert.match(source,/if \(!isAdmin\) return undefined/);
    assert.match(source,/\/admin\/modules\/\$\{moduleId\}\/export/);
    assert.doesNotMatch(source,/my-results|task-attempts|\/users|fetchLearningStats/);
    assert.match(source,/AbortController/);
});
