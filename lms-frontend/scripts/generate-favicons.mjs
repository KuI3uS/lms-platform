import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Run locally with ImageMagick installed when the existing SkiCode logo changes.
// Commit the generated assets: production builds need no image tooling.
const source = fileURLToPath(new URL("../src/assets/images/skicode-logo.png", import.meta.url));
const publicFile = name => fileURLToPath(new URL("../public/" + name, import.meta.url));

for (const [name, size] of [["favicon.png", 96], ["apple-touch-icon.png", 180]]) {
    execFileSync("magick", [source, "-resize", `${size}x${size}`, "-strip", "PNG32:" + publicFile(name)]);
}
execFileSync("magick", [source, "-strip", "-define", "icon:auto-resize=48,32,16", publicFile("favicon.ico")]);
console.log("Generated SkiCode favicons from the existing brand logo.");
