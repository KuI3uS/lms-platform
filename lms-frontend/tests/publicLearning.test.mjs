import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isPythonAutomationCourse, PYTHON_COURSE_DESCRIPTION, PYTHON_COURSE_PATH } from "../src/utils/pythonCourseOffer.js";
import { getCourseDescription } from "../src/utils/javaCourseOffer.js";
import { INF03_QUESTIONS, INF03_PATH, gradeInf03Practice } from "../src/utils/inf03Practice.js";
import { getHomeLearningPaths } from "../src/utils/homeContent.js";
import { PYTHON_PAGE_TITLE, PYTHON_PAGE_DESCRIPTION, INF03_PAGE_TITLE, INF03_PAGE_DESCRIPTION } from "../src/utils/publicLearningSeo.js";

test("Python offer identifies the exact course and preserves an administrator's description", () => {
    for (const dash of ["-", "—", "–"]) assert.ok(isPythonAutomationCourse({ title: ` Python + AI ${dash} automatyzacje dla biznesu ` }));
    for (const name of ["Python", "Python + AI", "Python + AI - automatyzacje dla biznesu PRO", "Java"]) assert.equal(isPythonAutomationCourse({ name }), false);
    const course = { name: "Python + AI - automatyzacje dla biznesu" };
    assert.equal(getCourseDescription(course), PYTHON_COURSE_DESCRIPTION);
    assert.equal(getCourseDescription({ ...course, description: "Opis kursu zostanie uzupełniony wkrótce." }), PYTHON_COURSE_DESCRIPTION);
    assert.equal(getCourseDescription({ ...course, description: "Mój własny opis." }), "Mój własny opis.");
});

test("public Polish learning paths lead to public pages, not a protected catalogue", () => {
    const paths = getHomeLearningPaths("pl");
    assert.equal(paths.find(item => item.id === "python-ai").href, PYTHON_COURSE_PATH);
    assert.equal(paths.find(item => item.id === "inf03").href, INF03_PATH);
    for (const language of ["en", "es"]) assert.ok(!getHomeLearningPaths(language).some(item => ["python-ai", "inf03"].includes(item.id)));
});

test("INF.03 practice refuses incomplete or invalid answers and grades every original question", () => {
    assert.equal(new Set(INF03_QUESTIONS.map(item => item.id)).size, 6);
    assert.deepEqual(gradeInf03Practice({}), { complete: false, answered: 0, correct: 0, total: 6 });
    const answers = Object.fromEntries(INF03_QUESTIONS.map(item => [item.id, item.correct]));
    assert.deepEqual(gradeInf03Practice(answers), { complete: true, answered: 6, correct: 6, total: 6 });
    const first = INF03_QUESTIONS[0];
    for (const invalid of [-1, 4, "1", null, NaN, Infinity]) assert.equal(gradeInf03Practice({ ...answers, [first.id]: invalid }).complete, false);
    assert.equal(gradeInf03Practice({ ...answers, [first.id]: 0 }).correct, 5);
    for (const item of INF03_QUESTIONS) {
        assert.equal(item.options.length, 4);
        assert.equal(new Set(item.options).size, 4);
        assert.ok(item.explanation.length > 80);
    }
});

test("both promotional pages are rendered before JavaScript, with unique metadata and honest structured data", async () => {
    for (const [file, path, title, description, schemaId] of [
        ["python-ai-automatyzacje-dla-biznesu.html", PYTHON_COURSE_PATH, PYTHON_PAGE_TITLE, PYTHON_PAGE_DESCRIPTION, "python-course-schema"],
        ["testy-inf-03.html", INF03_PATH, INF03_PAGE_TITLE, INF03_PAGE_DESCRIPTION, "inf03-schema"],
    ]) {
        const html = await readFile(new URL("../dist/" + file, import.meta.url), "utf8");
        assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
        assert.ok(html.includes(`<title>${title}</title>`));
        assert.ok(html.includes(`name="description" content="${description}"`));
        assert.ok(html.includes(`rel="canonical" href="https://edu-hub.com.pl${path}"`));
        assert.ok(!html.includes('<div id="root"></div>'));
        const schema = JSON.parse(html.match(new RegExp(`<script id="${schemaId}" type="application/ld\\+json">([\\s\\S]*?)</script>`))[1]);
        for (const forbidden of ["aggregateRating", "reviewCount", "priceCurrency", "499", "offers"]) assert.ok(!JSON.stringify(schema).includes(forbidden));
    }
    const quiz = await readFile(new URL("../dist/testy-inf-03.html", import.meta.url), "utf8");
    assert.equal((quiz.match(/<fieldset/g) || []).length, 6);
    assert.equal((quiz.match(/type="radio"/g) || []).length, 24);
    assert.ok(quiz.includes("nie oficjalny arkusz CKE"));
    assert.ok(quiz.includes("Klucz odpowiedzi i wyjaśnienia"));
    const course = await readFile(new URL("../dist/python-ai-automatyzacje-dla-biznesu.html", import.meta.url), "utf8");
    assert.ok(!course.includes("499"), "Never freeze current commercial values in HTML");
    assert.ok(!course.includes('href="/checkout/'), "No checkout without a valid live course");
});

test("Vercel, sitemap and public links expose both destinations without opening private routes", async () => {
    const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
    const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
    const home = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
    for (const [path, file] of [[PYTHON_COURSE_PATH, "python-ai-automatyzacje-dla-biznesu.html"], [INF03_PATH, "testy-inf-03.html"]]) {
        assert.equal(config.rewrites.find(item => item.source === path).destination, "/" + file);
        assert.equal(config.redirects.find(item => item.source === "/" + file).destination, path);
        assert.ok(sitemap.includes("https://edu-hub.com.pl" + path));
        assert.ok(home.includes(`href="${path}`));
    }
    assert.ok(!sitemap.includes("/checkout/"));
    assert.ok(!sitemap.includes("/lesson/"));
});
