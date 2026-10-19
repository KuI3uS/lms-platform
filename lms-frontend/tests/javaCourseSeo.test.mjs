import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JAVA_COURSE_META_DESCRIPTION, JAVA_COURSE_TITLE, JAVA_COURSE_TOPICS, JAVA_COURSE_URL, serializeStructuredData } from "../src/utils/javaCourseSeo.js";

// Build first: these tests inspect the artifact that Vercel actually serves,
// rather than a separate description of what the page ought to contain.
const html = await readFile(new URL("../dist/java-backend-developer.html", import.meta.url), "utf8");
const schema = JSON.parse(html.match(/<script id="java-course-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test("course content and FAQ are readable in the initial HTML without JavaScript", () => {
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    for (const text of ["Kurs Java online od podstaw.", "Program kursu Java Backend Developer", "Czy ten kurs Java jest dla początkujących?", ...JAVA_COURSE_TOPICS.map(topic => topic.title)]) {
        assert.ok(html.includes(text), `Missing pre-rendered content: ${text}`);
    }
    assert.ok(!html.includes("<!--java-course-schema-->"));
    assert.match(html, /<noscript>/);
});

test("canonical, page description and social previews describe the same offer", () => {
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${JAVA_COURSE_URL}"`));
    assert.ok(html.includes(`<title>${JAVA_COURSE_TITLE}</title>`));
    assert.ok(html.includes(`name="description" content="${JAVA_COURSE_META_DESCRIPTION}"`));
    assert.ok(html.includes(`property="og:url" content="${JAVA_COURSE_URL}"`));
    assert.ok(!/\bnoindex\b/.test(html));
});

test("structured data describes visible topics and valid breadcrumb destinations without stale prices or fabricated reviews", () => {
    const graph = schema["@graph"];
    const course = graph.find(item => item["@type"] === "Course");
    assert.equal(course.name, "Java Backend Developer");
    assert.equal(course.url, JAVA_COURSE_URL);
    assert.deepEqual(course.teaches, JAVA_COURSE_TOPICS.map(topic => topic.title));
    assert.ok(graph.some(item => item["@id"] === course.provider["@id"]));
    assert.equal(new Set(graph.map(item => item["@id"])).size, graph.length);
    const breadcrumbs = graph.find(item => item["@type"] === "BreadcrumbList").itemListElement;
    assert.equal(breadcrumbs.length, 2);
    for (const crumb of breadcrumbs) assert.equal(new URL(crumb.item).origin, new URL(JAVA_COURSE_URL).origin);
    assert.equal(breadcrumbs.at(-1).item, JAVA_COURSE_URL);
    for (const key of ["offers", "aggregateRating", "review"]) assert.ok(!(key in course));
});

test("structured data cannot terminate its containing script element", () => {
    const text = "</script><script>alert(1)</script>";
    const serialized = serializeStructuredData({ name: text });
    assert.ok(!serialized.includes("<"));
    assert.equal(JSON.parse(serialized).name, text);
});

test("hosting serves the course document at its canonical path and allows its public data to be crawled", async () => {
    const hosting = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
    const route = hosting.rewrites.find(rule => rule.source === new URL(JAVA_COURSE_URL).pathname);
    assert.equal(route.destination, "/java-backend-developer.html");
    assert.ok(hosting.rewrites.indexOf(route) < hosting.rewrites.findIndex(rule => rule.source === "/(.*)"));
    const alias = hosting.redirects.find(rule => rule.source === route.destination);
    assert.equal(alias.destination, new URL(JAVA_COURSE_URL).pathname);
    assert.equal(alias.permanent, true);
    const robots = await readFile(new URL("../dist/robots.txt", import.meta.url), "utf8");
    assert.match(robots, /Allow: \/api\/public\/courses\/java-backend-developer/);
    const sitemap = await readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8");
    assert.ok(sitemap.includes(`<loc>${JAVA_COURSE_URL}</loc>`));
});
