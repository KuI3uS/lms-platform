import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  HOME_FAQ,
  LEARNING_PATHS,
  checkPracticeAnswer,
} from "../src/utils/homeContent.js";
import { HOME_TITLE, HOME_DESCRIPTION } from "../src/utils/homeSeo.js";

const home = await readFile(
  new URL("../dist/home.html", import.meta.url),
  "utf8",
);
const app = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);

test("homepage serves readable course information, exam paths and FAQ without executing JavaScript", () => {
  assert.equal((home.match(/<h1(?:\s|>)/g) || []).length, 1);
  for (const text of [
    "Naucz się Javy.",
    "Java Backend",
    ...HOME_FAQ.map((item) => item.question),
    ...LEARNING_PATHS.map((item) => item.title),
  ])
    assert.ok(home.includes(text), "Missing static content: " + text);
  assert.ok(!home.includes("<!--home-schema-->"));
  assert.ok(
    !app.includes('id="eh-hero-title"'),
    "Application fallback must not display the homepage on login or private routes.",
  );
  assert.ok(home.includes('href="/kurs/java-backend-developer"'));
  assert.ok(home.includes('href="/tutoring-booking"'));
});

const head = home.split("</head>")[0].replace(/\s+/g, " ");

test("homepage SEO and Google ownership verification survive the separate public entry", async () => {
  assert.ok(home.includes("<title>" + HOME_TITLE + "</title>"));
  assert.ok(
    head.includes('name="description" content="' + HOME_DESCRIPTION + '"'),
  );
  assert.equal((home.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(home.includes('rel="canonical" href="https://edu-hub.com.pl/"'));
  assert.ok(
    head.includes(
      'name="google-site-verification" content="UiMSNzO8HxYLUaANDdfJqXRIZF0FFiA_naDEvDkj1ho"',
    ),
  );
  assert.equal(
    (
      await readFile(
        new URL("../dist/googlefa09321f0af78030.html", import.meta.url),
        "utf8",
      )
    ).trim(),
    "google-site-verification: googlefa09321f0af78030.html",
  );
  const schema = JSON.parse(
    home.match(
      /<script id="home-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )[1],
  );
  assert.deepEqual(schema["@graph"].map((item) => item["@type"]).sort(), [
    "Organization",
    "WebPage",
    "WebSite",
  ]);
  assert.ok(!JSON.stringify(schema).includes("aggregateRating"));
});

test("canonical homepage uses the new public document while application routes retain their fallback", async () => {
  const config = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  assert.equal(
    config.rewrites.find((item) => item.source === "/").destination,
    "/home.html",
  );
  assert.equal(
    config.rewrites.find((item) => item.source === "/(.*)").destination,
    "/index.html",
  );
  assert.ok(
    config.rewrites.findIndex((item) => item.source === "/") <
      config.rewrites.findIndex((item) => item.source === "/(.*)"),
  );
  assert.equal(
    config.redirects.find((item) => item.source === "/home.html").destination,
    "/",
  );
});

test("demo checks an answer without running input as Java or SQL", () => {
  assert.equal(checkPracticeAnswer("java", ""), "empty");
  assert.equal(checkPracticeAnswer("java", " Cześć, Java "), "correct");
  assert.equal(checkPracticeAnswer("java", '"Cześć, Java"'), "correct");
  assert.equal(checkPracticeAnswer("java", "Cześć, java"), "retry");
  assert.equal(checkPracticeAnswer("java", "Cześć, jezyk"), "retry");
  assert.equal(checkPracticeAnswer("sql", " IMIE "), "correct");
  assert.equal(checkPracticeAnswer("sql", "uczniowie"), "retry");
  assert.equal(
    checkPracticeAnswer("sql", "imie; DROP TABLE uczniowie"),
    "retry",
  );
  assert.equal(checkPracticeAnswer("unknown", "anything"), "retry");
});
