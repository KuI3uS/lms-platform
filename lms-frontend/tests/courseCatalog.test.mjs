import test from "node:test";
import assert from "node:assert/strict";
import { courseBillingLabel, courseProgress, filterCoursesByName, formatCoursePrice, isPaidCourse, sortCoursesForLearning } from "../src/utils/courseCatalog.js";

test("course search matches Polish names and titles with AND tokens and preserves data", () => {
    const courses = [
        { id: 1, name: "Java", title: "Zażółć gęślą jaźń", canAccess: false, published: false },
        { id: 2, name: "Angielski", title: "Pierwsze słowa" },
        { id: 3, name: "Java Backend", title: "Kurs programowania" }
    ];
    assert.deepEqual(filterCoursesByName(courses, "ZAZOLC java"), [courses[0]]);
    assert.deepEqual(filterCoursesByName(courses, "  slowa\tANGIELSKI  "), [courses[1]]);
    assert.deepEqual(filterCoursesByName(courses, "java backend"), [courses[2]]);
    assert.deepEqual(filterCoursesByName(courses, "java brak"), []);
    assert.equal(filterCoursesByName(courses, "zazolc")[0], courses[0]);
    assert.equal(courses[0].canAccess, false);
    assert.equal(courses[0].published, false);
    assert.deepEqual(filterCoursesByName(courses, ""), courses);
    assert.deepEqual(filterCoursesByName(null, null), []);
});

test("search covers the complete catalog, including courses outside six suggestions", () => {
    const courses = Array.from({ length: 30 }, (_, id) => ({ id, title: `Kurs ${id}`, canAccess: true, lessonCount: 100 - id }));
    const result = sortCoursesForLearning(filterCoursesByName(courses, "Kurs 29")).slice(0, 6);
    assert.deepEqual(result.map(course => course.id), [29]);
});

test("paid classification respects explicit API flags and every billing mode", () => {
    assert.equal(isPaidCourse({ paid: false, price: 99 }), false);
    assert.equal(isPaidCourse({ paid: true, billingMode: "FREE" }), true);
    assert.equal(isPaidCourse({ billingMode: "FREE" }), false);
    for (const billingMode of ["ONE_TIME", "SUBSCRIPTION", "FLEXIBLE", "MONTHLY_OPTIONS"]) {
        assert.equal(isPaidCourse({ billingMode }), true);
    }
    assert.equal(isPaidCourse({ price: 30 }), true);
    assert.equal(isPaidCourse({ monthlyPrice: 89 }), true);
    assert.equal(isPaidCourse({}), false);
});

test("price labels distinguish free, one-time, monthly and mixed access options", () => {
    assert.equal(formatCoursePrice({ paid: false }), "Bezpłatnie");
    assert.match(formatCoursePrice({ paid: true, billingMode: "ONE_TIME", price: 149 }), /^149\s*zł$/);
    assert.match(formatCoursePrice({ paid: true, billingMode: "SUBSCRIPTION", monthlyPrice: 89 }), /^89\s*zł \/ mies\.$/);
    assert.match(formatCoursePrice({ paid: true, billingMode: "FLEXIBLE", price: 399, monthlyPrice: 89 }), /^od 89\s*zł$/);
    assert.match(formatCoursePrice({ paid: true, billingMode: "MONTHLY_OPTIONS", price: 30, monthlyPrice: 29 }), /^od 29\s*zł$/);
    assert.match(formatCoursePrice({ paid: true, billingMode: "MONTHLY_OPTIONS", price: 19, monthlyPrice: 29 }), /^od 19\s*zł$/);
    assert.match(formatCoursePrice({ paid: true, billingMode: "ONE_TIME", price: 29.5 }), /^29,50\s*zł$/);
    assert.equal(courseBillingLabel({ billingMode: "MONTHLY_OPTIONS" }), "30 dni lub abonament");
    assert.equal(courseBillingLabel({ billingMode: "FLEXIBLE" }), "Jednorazowo lub abonament");
});

test("progress stays within real bounds without changing source course data", () => {
    assert.equal(courseProgress(null), 0);
    assert.equal(courseProgress({ progress: -1 }), 0);
    assert.equal(courseProgress({ progress: 125 }), 100);
    assert.equal(courseProgress({ progress: "37" }), 37);
    assert.equal(courseProgress({ progress: "invalid" }), 0);
    const course = { progress: 125 };
    courseProgress(course);
    assert.equal(course.progress, 125);
});

test("learning order prefers accessible unfinished courses and never mutates or invents access", () => {
    const courses = [
        { id: 1, canAccess: false, progress: 90, lessonCount: 999 },
        { id: 2, canAccess: true, progress: 100, lessonCount: 800 },
        { id: 3, canAccess: true, progress: 0, lessonCount: 20 },
        { id: 4, canAccess: true, progress: 10, lessonCount: 10 },
        { id: 5, canAccess: true, progress: 50, lessonCount: 5 }
    ];
    const before = structuredClone(courses);
    const result = sortCoursesForLearning(courses);
    assert.deepEqual(result.map(course => course.id), [5, 4, 3, 2, 1]);
    assert.equal(result[0], courses[4]);
    assert.equal(result.at(-1).canAccess, false);
    assert.deepEqual(courses, before);
    assert.deepEqual(sortCoursesForLearning(null), []);
});
