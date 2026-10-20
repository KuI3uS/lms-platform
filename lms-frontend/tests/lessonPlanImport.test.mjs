import assert from "node:assert/strict";
import test from "node:test";
import { parseLessonPlan, previewLessonPlan, buildLessonPlanBatches } from "../src/utils/lessonPlanImport.js";

test("parses stages and semicolon-separated lesson titles", () => {
    const parsed = parseLessonPlan(`
# CZĘŚĆ I
## ETAP 16 — Operatory warunkowe
Lekcje: Kilka kryteriów naraz; AND w praktyce; OR w praktyce.

## ETAP 17 — switch
Lekcje: Pierwszy switch; case i break
`);

    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.stages.length, 2);
    assert.equal(parsed.lessonCount, 5);
    assert.deepEqual(parsed.stages[0], {
        stageNumber: 16,
        stageTitle: "Operatory warunkowe",
        lessonTitles: [
            "Kilka kryteriów naraz",
            "AND w praktyce",
            "OR w praktyce"
        ]
    });
});

test("an empty course can import a complete plan with missing stages", () => {
    const parsed = parseLessonPlan(Array.from({ length: 18 }, (_, index) => `ETAP ${index + 1} — Sieci komputerowe ${index + 1}\nLekcje: Temat A; Temat B; Temat C; Temat D; Projekt`).join("\n\n"));
    assert.equal(parsed.stages.length, 18);
    assert.equal(parsed.lessonCount, 90);
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(previewLessonPlan(parsed.stages, []), { stagesToCreate: 18, stagesToReuse: 0, errors: [] });
    assert.equal(buildLessonPlanBatches(parsed.stages).length, 1);
});

test("large plans have no total stage or lesson cap and are split into safe transactions", () => {
    const stages = Array.from({ length: 1201 }, (_, index) => ({ stageNumber: index + 1, stageTitle: `Etap ${index + 1}`, lessonTitles: Array.from({ length: 10 }, (_, lesson) => `Temat ${index + 1}/${lesson}`) }));
    const batches = buildLessonPlanBatches(stages);
    assert.equal(batches.flat().length, 1201);
    assert.equal(batches.flat().reduce((sum, stage) => sum + stage.lessonTitles.length, 0), 12010);
    assert.ok(batches.every(batch => batch.length <= 20 && batch.reduce((sum, stage) => sum + stage.lessonTitles.length, 0) <= 500));
});

test("one stage can exceed five hundred lesson titles without losing or duplicating any", () => {
    const titles = Array.from({ length: 1234 }, (_, index) => `Lekcja ${index + 1}`);
    const batches = buildLessonPlanBatches([{ stageNumber: 16, stageTitle: "Sieci", lessonTitles: titles }]);
    assert.equal(batches.length, 3);
    assert.deepEqual(batches.flat().flatMap(stage => stage.lessonTitles), titles);
    assert.ok(batches.flat().every(stage => stage.stageTitle === "Sieci" && stage.stageNumber === 16));
});

test("stage names, not old numeric positions, identify existing stages", () => {
    const preview = previewLessonPlan([{ stageNumber: 1, stageTitle: "Sieci — podstawy" }, { stageNumber: 2, stageTitle: "Nowy etap" }], [{ id: 1, name: "Java" }, { id: 2, name: "Sieci - podstawy" }]);
    assert.deepEqual(preview, { stagesToCreate: 1, stagesToReuse: 1, errors: [] });
    assert.ok(previewLessonPlan([{ stageNumber: 1, stageTitle: "" }], []).errors.length > 0);
});

test("full-plan validation catches duplicate stage names and overlong titles before batches are sent", () => {
    const parsed = parseLessonPlan(`ETAP 1 — Sieci — podstawy\nLekcje: Start\nETAP 2 — Sieci - podstawy\nLekcje: ${"x".repeat(256)}`);
    assert.ok(parsed.errors.some(error => /Nazwa etapu/.test(error)));
    assert.ok(parsed.errors.some(error => /tytuł lekcji/.test(error)));
});

test("reports duplicate stages and a stage without lessons", () => {
    const parsed = parseLessonPlan(`
## ETAP 2 — Pierwszy
Lekcje: Start
## ETAP 2 — Drugi
Opis bez listy lekcji
`);

    assert.deepEqual(parsed.errors, [
        "Etap 2 występuje w planie więcej niż raz.",
        "Etap 2 nie zawiera listy „Lekcje: ...”."
    ]);
});

test("removes ChatGPT references and duplicate titles", () => {
    const parsed = parseLessonPlan(`
## ETAP 476 — Koniec
Lekcje: Screening test; screening   test; Final feedback. :chatgpt-content-reference{index="1"}
`);

    assert.equal(parsed.errors.length, 0);
    assert.deepEqual(parsed.stages[0].lessonTitles, [
        "Screening test",
        "Final feedback"
    ]);
});
