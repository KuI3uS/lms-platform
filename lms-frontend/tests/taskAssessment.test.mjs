import assert from "node:assert/strict";
import test from "node:test";
import { isAssessmentUnavailable } from "../src/utils/taskAssessment.js";
import { readFileSync } from "node:fs";

test("only infrastructure errors are unassessed; compiler/test failures still count", () => {
    for (const type of ["RUNNER_UNAVAILABLE", "RUNNER_BUSY", "RUNNER_BUDGET_LIMIT"]) {
        assert.equal(isAssessmentUnavailable({ diagnostics: [{ type }] }), true);
    }
    for (const type of ["COMPILATION_ERROR", "HIDDEN_TEST_FAILED", "EXECUTION_TIMEOUT", "RUNTIME_ERROR"]) {
        assert.equal(isAssessmentUnavailable({ diagnostics: [{ type }] }), false);
    }
    assert.equal(isAssessmentUnavailable({ evaluationUnavailable: true }), true);
    assert.equal(isAssessmentUnavailable(null), false);
});

test("outage cannot erase a previous pass or unlock hints and model answers", () => {
    const page = readFileSync(new URL("../src/pages/LessonPage/LessonPage.jsx", import.meta.url), "utf8");
    const guard = page.indexOf("if (isAssessmentUnavailable(normalizedResponse)) return normalizedResponse;");
    assert.ok(guard > 0 && guard < page.indexOf("setBlocks(previous => previous.map(block => (", guard));
    const task = readFileSync(new URL("../src/pages/LessonPage/LessonTask.jsx", import.meta.url), "utf8");
    assert.match(task, /!unavailable && result\.attemptCount > 0/);
    assert.match(task, /!unavailable && result\.solutionPreview/);
    assert.match(task, /!unavailable && !result\.correct && result\.hint/);
});
