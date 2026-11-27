import test from "node:test";
import assert from "node:assert/strict";
import { encodeLessonImport } from "../src/utils/encodedLessonImport.js";
import { apiResponseError, isImportMaterialError } from "../src/utils/apiResponseError.js";
import { apiFetch, setCsrfToken } from "../src/api/api.js";

test("a complete authoring package preserves Unicode, SQL test strings and newlines in transit", () => {
    const document = { publishLessons: true, lessons: Array.from({ length: 50 }, (_, id) => ({
        lessonId: id + 1, title: "Zażółć 🧪 " + id,
        blocks: Array.from({ length: 10 }, () => ({ content: 'assertThrows(() -> sort("desc;drop table"));\n<script>example</script>' }))
    })) };
    const envelope = encodeLessonImport(document);
    assert.equal(envelope.encoding, "base64-utf8");
    assert.deepEqual(JSON.parse(Buffer.from(envelope.payload, "base64").toString("utf8")), document);
    assert.equal(JSON.stringify(envelope).includes("desc;drop table"), false);
});

test("large Unicode documents are bounded by UTF-8 bytes before sending", () => {
    assert.throws(() => encodeLessonImport({ content: "ą".repeat(1600000) }), /3 MB/);
    const document = { content: "ą".repeat(250000) };
    assert.deepEqual(JSON.parse(Buffer.from(encodeLessonImport(document).payload, "base64").toString("utf8")), document);
});

test("a Render WAF page becomes a short diagnostic and is not offered as a lesson repair", () => {
    const body = '<!DOCTYPE html><html><title>Blocked</title><style>' + "x".repeat(220000)
        + '</style><p>Your request was blocked by this site\'s web application firewall (WAF).</p><p>Request ID: a6124f32bf810d2c</p></html>';
    const error = apiResponseError(new Response(body, { status: 403, headers: { "content-type": "text/html" } }), body);
    assert.equal(error.code, "HOSTING_FIREWALL_BLOCK");
    assert.equal(error.requestId, "a6124f32bf810d2c");
    assert.ok(error.message.length < 500);
    assert.equal(error.message.includes("<html"), false);
    assert.equal(isImportMaterialError(error), false);
});

test("validation errors retain their useful field diagnostic and remain repairable", () => {
    const body = JSON.stringify({ message: "Lekcja 3, krok 6: brak polecenia." });
    const error = apiResponseError(new Response(body, { status: 400 }), body);
    assert.equal(error.message, "Lekcja 3, krok 6: brak polecenia.");
    assert.equal(isImportMaterialError(error), true);
    assert.equal(isImportMaterialError({ status: 401 }), false);
    assert.equal(isImportMaterialError({ status: 500 }), false);
    assert.equal(isImportMaterialError({ status: 400, code: "UNEXPECTED_HTML_RESPONSE" }), false);
});

test("upstream HTML errors and request IDs in headers are kept out of material diagnostics", () => {
    const body = "<html><body>Bad gateway</body></html>";
    const error = apiResponseError(new Response(body, { status: 502, headers: { "cf-ray": "a6124f32bf810d2c-ARN" } }), body);
    assert.equal(error.code, "UNEXPECTED_HTML_RESPONSE");
    assert.match(error.message, /a6124f32bf810d2c-ARN/);
    assert.equal(isImportMaterialError(error), false);
});

test("API transport retains CSRF and the session on a WAF rejection", async t => {
    const originalFetch = globalThis.fetch;
    const originalStorage = globalThis.sessionStorage;
    const storage = new Map();
    globalThis.sessionStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
    t.after(() => { globalThis.fetch = originalFetch; globalThis.sessionStorage = originalStorage; });
    setCsrfToken("csrf-test-value");
    let sent;
    globalThis.fetch = async (url, options) => {
        sent = { url, options };
        return new Response('<html><title>Blocked</title>web application firewall</html>', { status: 403 });
    };
    await assert.rejects(apiFetch("/lesson-blocks/module/1/import-encoded", { method: "POST", body: "{}" }),
        error => error.code === "HOSTING_FIREWALL_BLOCK" && error.status === 403);
    assert.equal(sent.options.credentials, "include");
    assert.equal(sent.options.headers["X-EDUHUB-CSRF"], "csrf-test-value");
    assert.equal(storage.get("eduhub:csrf"), "csrf-test-value");
    globalThis.fetch = async () => new Response("<html>unexpected proxy page</html>");
    await assert.rejects(apiFetch("/me"), error => error.code === "UNEXPECTED_HTML_RESPONSE");
    globalThis.fetch = async () => new Response('{"blocksCreated":50}');
    assert.deepEqual(await apiFetch("/me"), { blocksCreated: 50 });
});
