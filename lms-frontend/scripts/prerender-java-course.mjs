import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import {
  getJavaCourseStructuredData,
  serializeStructuredData,
} from "../src/utils/javaCourseSeo.js";
import { getHomeStructuredData } from "../src/utils/homeSeo.js";

// Render the same public React pages as the browser. No API requests, session data,
// cached prices or copied marketing HTML are needed during deployment.
const root = fileURLToPath(new URL("../", import.meta.url));
const pages = [
  {
    file: "java-backend-developer.html",
    entry: "/src/prerender-java-course.jsx",
    render: "renderJavaCourse",
    schema: "java-course-schema",
    structuredData: getJavaCourseStructuredData,
  },
  {
    file: "home.html",
    entry: "/src/prerender-home.jsx",
    render: "renderHome",
    schema: "home-schema",
    structuredData: getHomeStructuredData,
  },
];
const server = await createServer({
  root,
  configFile: false,
  plugins: [react()],
  appType: "custom",
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  for (const page of pages) {
    const module = await server.ssrLoadModule(page.entry);
    const output = new URL("../dist/" + page.file, import.meta.url);
    const html = await readFile(output, "utf8");
    const rootMarker = '<div id="root"></div>';
    const schemaMarker = "<!--" + page.schema + "-->";
    if (!html.includes(rootMarker) || !html.includes(schemaMarker)) {
      throw new Error(
        "Missing HTML markers in " +
          page.file +
          "; refusing to publish an empty public page.",
      );
    }
    const rendered = html
      .replace(
        rootMarker,
        () => '<div id="root">' + module[page.render]() + "</div>",
      )
      .replace(
        schemaMarker,
        () =>
          '<script id="' +
          page.schema +
          '" type="application/ld+json">' +
          serializeStructuredData(page.structuredData()) +
          "</script>",
      );
    await writeFile(output, rendered);
    console.log(
      "Pre-rendered " + page.file + ": public content and structured data.",
    );
  }
} finally {
  await server.close();
}
