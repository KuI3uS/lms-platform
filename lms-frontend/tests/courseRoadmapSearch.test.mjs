import test from "node:test";
import assert from "node:assert/strict";
import { buildCourseSections } from "../src/utils/courseSections.js";
import { filterCourseRoadmap } from "../src/utils/courseRoadmapSearch.js";

function fixture() {
    return buildCourseSections([
        {
            id: 10,
            name: "Java — od zera",
            sectionTitle: "CZĘŚĆ I — Ścieżka początkującego",
            lessons: [
                { id: 1, title: "Pierwszy program", canAccess: true, completed: true, hasContent: true },
                { id: 2, title: "Zażółć gęślą jaźń", canAccess: false, completed: false, hasContent: false }
            ]
        },
        {
            id: 20,
            name: "Git i GitHub",
            lessons: [
                { id: 3, title: "Repozytorium lokalne" },
                { id: 4, title: "Wysyłamy zmiany przez push" }
            ]
        },
        {
            id: 30,
            name: "SQL – operatory",
            sectionTitle: "CZĘŚĆ II — Bazy danych",
            lessons: [{ id: 5, title: "Porównujemy wartości: <>, >= oraz <=" }]
        },
        { id: 40, name: "Pusty etap", lessons: [] }
    ]);
}

test("empty queries return the full indexed roadmap without changing references or metadata", () => {
    const sections = fixture();
    for (const query of ["", "  \t\n", null, undefined]) {
        const result = filterCourseRoadmap(sections, query);
        assert.equal(result.active, false);
        assert.equal(result.moduleCount, 4);
        assert.equal(result.lessonCount, 5);
        assert.notEqual(result.sections, sections);
        assert.equal(result.sections[0].firstModule, sections[0].entries[0].module);
        assert.equal(result.sections[0].entries[0].module, sections[0].entries[0].module);
        assert.equal(result.sections[0].entries[0].lessonEntries[1].lesson, sections[0].entries[0].module.lessons[1]);
        assert.equal(result.sections[0].entries[0].lessonEntries[1].lessonIndex, 1);
        assert.equal(result.sections[1].lessonCount, 1);
    }
});

test("Polish accents, case, Unicode forms, dashes and whitespace normalize consistently", () => {
    const sections = fixture();
    const result = filterCourseRoadmap(sections, "  ZAZOLC\u00a0 GESLA\t JAZN  ");
    assert.equal(result.lessonCount, 1);
    assert.equal(result.sections[0].entries[0].lessonEntries[0].lesson.id, 2);
    assert.equal(filterCourseRoadmap(sections, "zażółć gęślą jaźń").lessonCount, 1);
    assert.equal(filterCourseRoadmap(sections, "JAVA - OD ZERA").lessonCount, 2);
    assert.equal(filterCourseRoadmap(sections, "sql—operatory").lessonCount, 1);
    assert.equal(filterCourseRoadmap(sections, "ＪＡＶＡ").lessonCount, 2);
});

test("a matching section includes all its stages and lessons, including empty stages", () => {
    const result = filterCourseRoadmap(fixture(), "BAZY DANYCH");
    assert.equal(result.moduleCount, 2);
    assert.equal(result.lessonCount, 1);
    assert.deepEqual(result.sections[0].entries.map(entry => entry.moduleIndex), [2, 3]);
    assert.deepEqual(result.sections[0].entries[1].lessonEntries, []);
});

test("a matching stage includes all its lessons without unrelated stages", () => {
    const result = filterCourseRoadmap(fixture(), "git github");
    assert.equal(result.moduleCount, 1);
    assert.equal(result.lessonCount, 2);
    assert.equal(result.sections[0].entries[0].module.id, 20);
    assert.equal(result.sections[0].entries[0].moduleIndex, 1);
});

test("tokens match with AND across section, stage and lesson titles", () => {
    const result = filterCourseRoadmap(fixture(), "poczatkujacego github push");
    assert.equal(result.moduleCount, 1);
    assert.equal(result.lessonCount, 1);
    assert.equal(result.sections[0].entries[0].lessonEntries[0].lesson.id, 4);
    assert.equal(filterCourseRoadmap(fixture(), "poczatkujacego github brak").lessonCount, 0);
});

test("filtering preserves original lesson indices despite duplicated orderIndex values", () => {
    const lessons = Array.from({ length: 8 }, (_, index) => ({
        id: index + 1,
        title: index === 1 || index === 7 ? "Pasujący tytuł" : "Inna lekcja",
        orderIndex: 0
    }));
    const sections = buildCourseSections([{ id: 1, name: "Etap", lessons }]);
    const result = filterCourseRoadmap(sections, "pasujacy");
    assert.deepEqual(result.sections[0].entries[0].lessonEntries.map(entry => entry.lessonIndex), [1, 7]);
    assert.deepEqual(result.sections[0].entries[0].lessonEntries.map(entry => entry.lesson.id), [2, 8]);
    assert.equal(result.sections[0].entries[0].module.lessons, lessons);
});

test("filtered sections keep their original first module, global ranges and total lesson counts", () => {
    const sections = fixture();
    const before = structuredClone(sections);
    const result = filterCourseRoadmap(sections, "push");
    assert.equal(result.sections[0].firstModule, sections[0].entries[0].module);
    assert.equal(result.sections[0].entries[0].module, sections[0].entries[1].module);
    assert.deepEqual([
        result.sections[0].id,
        result.sections[0].title,
        result.sections[0].startStageNumber,
        result.sections[0].endStageNumber,
        result.sections[0].lessonCount
    ], [10, sections[0].title, 1, 2, 4]);
    assert.deepEqual(sections, before);
    assert.equal("firstModule" in sections[0], false);
    assert.equal("lessonEntries" in sections[0].entries[0], false);
});

test("lesson access, publication and progress flags are not changed by filtering", () => {
    const sections = fixture();
    const lesson = sections[0].entries[0].module.lessons[1];
    const result = filterCourseRoadmap(sections, "zazolc");
    const found = result.sections[0].entries[0].lessonEntries[0].lesson;
    assert.equal(found, lesson);
    assert.equal(found.canAccess, false);
    assert.equal(found.hasContent, false);
    assert.equal(found.completed, false);
});

test("SQL operators remain meaningful search tokens instead of being removed", () => {
    const sections = fixture();
    for (const operator of ["<>", ">=", "<="]) {
        const result = filterCourseRoadmap(sections, operator);
        assert.equal(result.moduleCount, 1);
        assert.equal(result.lessonCount, 1);
        assert.equal(result.sections[0].entries[0].lessonEntries[0].lesson.id, 5);
    }
    assert.equal(filterCourseRoadmap(sections, "<>").sections[0].entries[0].moduleIndex, 2);
    assert.equal(filterCourseRoadmap(sections, "!=").moduleCount, 0);
});

test("exact stage numbers work for 476 stages in 20 sections without renumbering", () => {
    const modules = Array.from({ length: 476 }, (_, moduleIndex) => ({
        id: 1000 + moduleIndex,
        name: `Temat ${moduleIndex + 1}`,
        sectionTitle: moduleIndex % 24 === 0 ? `CZĘŚĆ ${Math.floor(moduleIndex / 24) + 1}` : null,
        lessons: moduleIndex === 475 ? [] : [{ id: moduleIndex, title: `Lekcja ${moduleIndex + 1}` }]
    }));
    const sections = buildCourseSections(modules);
    assert.equal(sections.length, 20);
    for (const query of ["476", "etap 476", "ETAP #476", "etap# 476"]) {
        const result = filterCourseRoadmap(sections, query);
        assert.equal(result.active, true);
        assert.equal(result.moduleCount, 1);
        assert.equal(result.lessonCount, 0);
        assert.equal(result.sections[0].entries[0].module, modules[475]);
        assert.equal(result.sections[0].entries[0].moduleIndex, 475);
        assert.equal(result.sections[0].firstModule, modules[456]);
        assert.equal(result.sections[0].startStageNumber, 457);
        assert.equal(result.sections[0].endStageNumber, 476);
    }
    const firstStage = filterCourseRoadmap(sections, "1");
    assert.equal(firstStage.moduleCount, 1);
    assert.equal(firstStage.sections[0].entries[0].moduleIndex, 0);
    for (const query of ["0", "etap 0", "477", "999999999999999999999999999"]) {
        assert.equal(filterCourseRoadmap(sections, query).moduleCount, 0);
    }
});

test("missing data and unknown phrases return a safe empty view", () => {
    for (const sections of [undefined, null, []]) {
        assert.deepEqual(filterCourseRoadmap(sections, "git"), {
            active: true, sections: [], moduleCount: 0, lessonCount: 0
        });
    }
    assert.deepEqual(filterCourseRoadmap([{ id: 1, title: "Empty" }], "git").sections, []);
    const emptyStage = buildCourseSections([{ id: 1, name: "Pusty etap" }]);
    assert.equal(filterCourseRoadmap(emptyStage, "pusty").moduleCount, 1);
    assert.equal(filterCourseRoadmap(fixture(), "nieistniejace slowo").moduleCount, 0);
});
