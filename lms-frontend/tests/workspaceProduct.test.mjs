import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { translateUi, UI_MESSAGES } from "../src/utils/localization.js";
import messages from "../src/i18n/workspaceDesignMessages.js";

const source = file => readFileSync(new URL("../src/" + file, import.meta.url), "utf8");

test("workspace styles opt in without retheming the course roadmap or code editor", () => {
    const css = source("styles/workspace-product.css");
    assert.doesNotMatch(css, /(?:^|\})\s*(?:h[1-6]|button|input|main|body|\*)\b/);
    assert.doesNotMatch(css, /\.course-roadmap|\.monaco-editor|\.lesson-/);
    for (const file of ["pages/ModulePage.jsx", "pages/LessonPage/LessonPage.jsx"]) {
        assert.doesNotMatch(source(file), /product-page|workspace-product/);
    }
    assert.match(source("Layout.jsx"), /if \(isLessonPage\)/);
    assert.match(source("Layout.jsx"), /lg:w-60/);
    assert.match(source("components/Navbar.jsx"), /h-\[4\.5rem\]/);
});

test("navigation retains creator permissions, keyboard access and real course search", () => {
    const sidebar = source("components/WorkspaceSidebar.jsx");
    assert.match(sidebar, /role === "ADMIN" && <details/);
    assert.match(sidebar, /<summary>/);
    assert.match(source("Layout.jsx"), /event.key === "Escape"/);
    assert.match(source("Layout.jsx"), /id="workspace-content"/);
    assert.match(source("components/Navbar.jsx"), /event\.ctrlKey \|\| event\.metaKey/);
    assert.match(source("components/Navbar.jsx"), /\.monaco-editor/);
    assert.match(source("pages/CoursesPage.jsx"), /location\.state\?\.focusCourseSearch/);
    assert.match(source("pages/CoursesPage.jsx"), /searchInput\.current\?\.focus/);
});

test("new hub pages preserve course access, prices, locale separation and reward actions", () => {
    const catalog = source("pages/CoursesPage.jsx");
    assert.match(catalog, /course\.canAccess \|\| isAdmin \? `\/modules/);
    assert.match(catalog, /confirm\(/);
    assert.match(catalog, /courseMatchesLanguage\(course, catalogLanguage\)/);
    assert.match(catalog, /currency: "PLN"/);
    const results = source("pages/ResultsPage.jsx");
    assert.match(results, /apiFetch\("\/my-results"\)/);
    assert.match(results, /percentage\(result\) >= 50/);
    assert.match(results, /role="status"/);
    assert.match(results, /role="alert"/);
    assert.match(results, /<table/);
    assert.match(source("pages/LearningCenterPage.jsx"), /apiFetch\(path, \{ method: "POST" \}\)/);
});

test("all new interface labels have both translations, while authored course titles stay untouched", () => {
    for (const [label, entry] of Object.entries(messages)) {
        for (const locale of ["en", "es"]) {
            assert.ok(entry[locale]?.trim(), locale + ": " + label);
            assert.notEqual(translateUi(label, locale), label);
        }
    }
    for (const file of ["components/WorkspaceSidebar.jsx", "components/Navbar.jsx", "pages/DashboardPage.jsx", "pages/CoursesPage.jsx", "pages/ResultsPage.jsx", "pages/ExamsPage.jsx", "pages/LearningCenterPage.jsx", "pages/RedeemAccessCodePage.jsx", "pages/LanguageReviewPage.jsx", "pages/AdminPage.jsx"]) {
        for (const match of source(file).matchAll(/\bt\("([^"\n]+)"/g)) {
            assert.ok(UI_MESSAGES[match[1]], file + ": " + match[1]);
        }
    }
    assert.equal(translateUi("Mój niezmieniony tytuł kursu", "es"), "Mój niezmieniony tytuł kursu");
});
