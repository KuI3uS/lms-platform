import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const builtFile = name => readFile(new URL("../dist/" + name, import.meta.url));

test("all public and application HTML entries use the same SkiCode icons", async () => {
    for (const page of ["index.html", "app.html", "java-backend-developer.html"]) {
        const head = (await builtFile(page)).toString().split("</head>")[0];
        assert.match(head, /<link rel="icon" type="image\/png" sizes="96x96" href="\/favicon.png"/);
        assert.match(head, /<link rel="shortcut icon" type="image\/x-icon" href="\/favicon.ico"/);
        assert.match(head, /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png"/);
        assert.doesNotMatch(head, /href="\/(?:vite|react|favicon)\.svg"/);
    }
});

test("built PNG icons are real square images, not an application HTML fallback", async () => {
    for (const [name, size] of [["favicon.png", 96], ["apple-touch-icon.png", 180]]) {
        const png = await builtFile(name);
        assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.equal(png.toString("ascii", 12, 16), "IHDR");
        assert.equal(png.readUInt32BE(16), size);
        assert.equal(png.readUInt32BE(20), size);
    }
});

test("conventional favicon.ico includes valid small browser icon sizes", async () => {
    const ico = await builtFile("favicon.ico");
    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1);
    const count = ico.readUInt16LE(4);
    assert.equal(count, 3);
    const sizes = [];
    for (let i = 0; i < count; i++) {
        const entry = 6 + i * 16;
        const size = ico[entry] || 256;
        sizes.push(size);
        assert.equal(ico[entry + 1] || 256, size);
        const length = ico.readUInt32LE(entry + 8);
        const offset = ico.readUInt32LE(entry + 12);
        assert.ok(length > 0 && offset >= 6 + count * 16 && offset + length <= ico.length);
    }
    assert.deepEqual(sizes.sort((a, b) => a - b), [16, 32, 48]);
});

test("legacy favicon addresses redirect to the brand icon and crawlers may fetch it", async () => {
    const hosting = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
    for (const source of ["/vite.svg", "/favicon.svg"]) {
        const redirect = hosting.redirects.find(item => item.source === source);
        assert.equal(redirect?.destination, "/favicon.png");
        assert.equal(redirect?.permanent, true);
    }
    const robots = (await builtFile("robots.txt")).toString();
    assert.match(robots, /Allow: \/(?:\r?\n|$)/);
    assert.doesNotMatch(robots, /Disallow:\s*\/(?:favicon|apple-touch-icon)/i);
});
