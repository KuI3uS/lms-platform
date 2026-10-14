import test from "node:test";
import assert from "node:assert/strict";
import {
    buildCourseSections,
    courseSectionExpansionKey,
    readCourseSectionExpansion,
    saveCourseSectionExpansion
} from "../src/utils/courseSections.js";

test("a heading groups stages until the next heading, preserving global stage numbers", () => {
    const modules = [
        { id: 10, sectionTitle: "CZĘŚĆ I", lessons: [{ id: 1 }] },
        { id: 20, lessons: [{ id: 2 }, { id: 3 }] },
        { id: 30, sectionTitle: "CZĘŚĆ II", lessons: [] },
        { id: 40, sectionTitle: "  ", lessons: [{ id: 4 }] }
    ];
    const sections = buildCourseSections(modules);
    assert.deepEqual(sections.map(section => ({
        id: section.id, title: section.title,
        range: [section.startStageNumber, section.endStageNumber],
        lessonCount: section.lessonCount,
        indexes: section.entries.map(entry => entry.moduleIndex)
    })), [
        { id: 10, title: "CZĘŚĆ I", range: [1, 2], lessonCount: 3, indexes: [0, 1] },
        { id: 30, title: "CZĘŚĆ II", range: [3, 4], lessonCount: 1, indexes: [2, 3] }
    ]);
    assert.equal(sections[0].entries[1].module, modules[1]);
    assert.equal(modules[3].sectionTitle, "  ");
});

test("leading stages without headings and courses without headings remain accessible", () => {
    const sections = buildCourseSections([
        { id: 1 }, { id: 2 }, { id: 3, sectionTitle: "Nowa część" }, { id: 4 }
    ]);
    assert.deepEqual(sections.map(section => section.entries.map(entry => entry.module.id)), [[1, 2], [3, 4]]);
    assert.equal(sections[0].title, "");
    assert.equal(buildCourseSections([{ id: 1 }, { id: 2 }]).length, 1);
    assert.deepEqual(buildCourseSections([]), []);
});

test("400 stages form 20 collapsible parts with no missing or renumbered stages", () => {
    const modules = Array.from({ length: 400 }, (_, index) => ({
        id: index + 1,
        sectionTitle: index % 20 === 0 ? `CZĘŚĆ ${index / 20 + 1}` : null
    }));
    const sections = buildCourseSections(modules);
    assert.equal(sections.length, 20);
    assert.equal(sections[19].startStageNumber, 381);
    assert.equal(sections[19].endStageNumber, 400);
    assert.deepEqual(sections.flatMap(section => section.entries.map(entry => entry.module.id)), modules.map(module => module.id));
});

test("section preferences survive refresh and stay separate for users and courses", () => {
    const values = new Map();
    const storage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value)
    };
    const firstKey = courseSectionExpansionKey(1, 7, 10);
    const preferences = { [firstKey]: false, [courseSectionExpansionKey(1, 7, 30)]: true };
    saveCourseSectionExpansion(preferences, storage);
    assert.deepEqual(readCourseSectionExpansion(storage), preferences);
    assert.notEqual(firstKey, courseSectionExpansionKey(2, 7, 10));
    assert.notEqual(firstKey, courseSectionExpansionKey(1, 8, 10));
    assert.notEqual(firstKey, courseSectionExpansionKey(1, null, 10));
});

test("unavailable or invalid browser storage cannot break the roadmap", () => {
    const unavailable = { getItem() { throw new Error("Unavailable"); }, setItem() { throw new Error("Unavailable"); } };
    assert.deepEqual(readCourseSectionExpansion(unavailable), {});
    assert.doesNotThrow(() => saveCourseSectionExpansion({}, unavailable));
    for (const raw of ["invalid", "null", "[]", '"text"']) {
        assert.deepEqual(readCourseSectionExpansion({ getItem: () => raw }), {});
    }
    assert.deepEqual(readCourseSectionExpansion({ getItem: () => '{"one":false,"two":"false","three":true}' }), { one: false, three: true });
});
