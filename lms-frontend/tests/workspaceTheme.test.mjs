import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getWorkspaceTheme, WORKSPACE_BACKGROUNDS } from "../src/utils/workspaceTheme.js";

test("catalog, dashboard and complete course roadmaps use the light theme", () => {
    for (const path of ["/dashboard", "/courses", "/admin/courses", "/modules/42", "/modules/42/"]) {
        assert.equal(getWorkspaceTheme(path), "light", path);
    }
});

test("existing dark forms, lesson screens and results keep an explicit dark background", () => {
    for (const path of ["/results", "/exams", "/admin", "/admin/courses/42/edit", "/admin/lessons/5", "/lesson/9", "/lessons/42", "/checkout/42", "", "/modules"]) {
        assert.equal(getWorkspaceTheme(path), "dark", path);
    }
    for (const theme of Object.values(WORKSPACE_BACKGROUNDS)) assert.match(theme, /^#[0-9a-f]{6}$/i);
    assert.equal(WORKSPACE_BACKGROUNDS.dark, "#05070d");
});

test("the workspace always paints its background instead of depending on an invalid gradient color", async () => {
    const layout = await readFile(new URL("../src/Layout.jsx", import.meta.url), "utf8");
    assert.match(layout, /backgroundColor: WORKSPACE_BACKGROUNDS\[workspaceTheme\]/);
    assert.doesNotMatch(layout, /bg-\[radial-gradient/);
    const page = await readFile(new URL("../src/pages/ModulePage.jsx", import.meta.url), "utf8");
    assert.match(page, /course-roadmap[^"\n]*text-slate-900/);
    assert.match(page, /<CourseRoadmapSearch\s+appearance="light"/);
    assert.equal((page.match(/<CourseSectionHeading\s+appearance="light"/g) || []).length, 2);
});
