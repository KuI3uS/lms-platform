import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parse } = require("@babel/parser");
const pages = [
    "CourseCheckoutPage.jsx", "CoursesPage.jsx", "DashboardPage.jsx", "ModulePage.jsx",
    "LessonListPage.jsx", "ExamsPage.jsx", "ExamAttemptPage.jsx", "ResultsPage.jsx",
    "LearningCenterPage.jsx", "LanguageReviewPage.jsx"
];

function visit(node, callback) {
    if (!node || typeof node !== "object") return;
    if (node.type) callback(node);
    for (const [key, value] of Object.entries(node)) {
        if (["loc", "start", "end", "extra", "comments"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(child => visit(child, callback));
        else if (value && typeof value === "object") visit(value, callback);
    }
}

function parseFile(file) {
    return parse(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), { sourceType: "module", plugins: ["jsx"] });
}

function callsWithin(node, names) {
    const calls = [];
    visit(node, child => {
        if (child.type === "CallExpression" && child.callee.type === "Identifier" && names.includes(child.callee.name)) calls.push(child);
    });
    return calls;
}

function dataHooks(file) {
    return callsWithin(parseFile(file), ["useEffect", "useCallback"]).filter(hook => (
        callsWithin(hook.arguments[0], ["apiFetch", "fetchLearningStats"]).length > 0
    ));
}

test("translated labels cannot trigger data reloads; catalog locale is an explicit dependency", () => {
    let checked = 0;
    for (const page of pages) {
        for (const hook of dataHooks(`pages/${page}`)) {
            checked += 1;
            assert.equal(callsWithin(hook.arguments[0], ["t"]).length, 0, `${page}: store raw errors, translate them when rendering`);
            const dependencies = hook.arguments.at(-1);
            assert.equal(dependencies?.type, "ArrayExpression", page);
            assert.ok(!dependencies.elements.some(node => node?.type === "Identifier" && node.name === "t"), page);
        }
    }
    assert.ok(checked >= 6, "The test must cover the actual network hooks");
});

test("checkout initialisation depends only on course ID and errors translate at render time", () => {
    const hooks = dataHooks("pages/CourseCheckoutPage.jsx").filter(hook => (
        callsWithin(hook.arguments[0], ["setPurchaseType", "setSelectedDiscountPercent"]).length > 0
    ));
    assert.equal(hooks.length, 1);
    assert.deepEqual(hooks[0].arguments.at(-1).elements.map(node => node.name), ["courseId"]);
    const translations = callsWithin(parseFile("pages/CourseCheckoutPage.jsx"), ["t"]);
    assert.ok(translations.some(call => call.arguments[0]?.type === "Identifier" && call.arguments[0].name === "error"));
});

test("translated option labels keep explicit canonical values for form submissions", () => {
    for (const file of ["pages/AddCoursePage.jsx", "components/BlockManager/BlockForm/forms/DialogBlockForm.jsx", "components/BlockManager/BlockForm/forms/AudioBlockForm.jsx"]) {
        visit(parseFile(file), node => {
            if (node.type !== "JSXElement" || node.openingElement.name.name !== "option") return;
            if (!callsWithin(node.children, ["t"]).length) return;
            assert.ok(node.openingElement.attributes.some(attribute => attribute.type === "JSXAttribute" && attribute.name.name === "value"), file);
        });
    }
});

test("lesson content, answers, code and authored hints are not passed to the UI translator", () => {
    const contentFields = new Set(["content", "title", "instruction", "description", "starterCode", "expectedAnswer", "hint", "detailedHint", "translation", "term", "text", "words"]);
    const lessonObjects = new Set(["block", "lesson", "turn", "word", "item", "config"]);
    const folder = new URL("../src/pages/LessonPage/", import.meta.url);
    for (const file of readdirSync(folder).filter(name => name.endsWith(".jsx"))) {
        for (const call of callsWithin(parseFile(`pages/LessonPage/${file}`), ["t"])) {
            const source = call.arguments[0];
            if (source?.type !== "MemberExpression" && source?.type !== "OptionalMemberExpression") continue;
            assert.ok(!(lessonObjects.has(source.object.name) && contentFields.has(source.property.name)), `${file}: ${source.object.name}.${source.property.name}`);
        }
    }
});
