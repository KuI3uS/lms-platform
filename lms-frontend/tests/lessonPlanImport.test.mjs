import assert from "node:assert/strict";
import test from "node:test";
import { parseLessonPlan } from "../src/utils/lessonPlanImport.js";

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
