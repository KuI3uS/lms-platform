import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { getJavaCourseStructuredData, serializeStructuredData } from "../src/utils/javaCourseSeo.js";

// Render the same React page as the browser. No API requests, session data,
// cached prices or copied marketing HTML are needed during deployment.
const root = fileURLToPath(new URL("../", import.meta.url));
const output = new URL("../dist/java-backend-developer.html", import.meta.url);
const server = await createServer({
    root, configFile: false, plugins: [react()], appType: "custom",
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] }
});

try {
    const { renderJavaCourse } = await server.ssrLoadModule("/src/prerender-java-course.jsx");
    const html = await readFile(output, "utf8");
    const rootMarker = '<div id="root"></div>';
    const schemaMarker = "<!--java-course-schema-->";
    if (!html.includes(rootMarker) || !html.includes(schemaMarker)) {
        throw new Error("Missing course HTML markers; refusing to publish an empty course page.");
    }
    const rendered = html
        .replace(rootMarker, () => `<div id="root">${renderJavaCourse()}</div>`)
        .replace(schemaMarker, () => `<script id="java-course-schema" type="application/ld+json">${serializeStructuredData(getJavaCourseStructuredData())}</script>`);
    await writeFile(output, rendered);
    console.log("Pre-rendered Java course: content, curriculum, FAQ and structured data.");
} finally {
    await server.close();
}
