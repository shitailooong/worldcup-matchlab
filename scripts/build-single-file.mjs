import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");
const outputDir = join(root, "single-file");
const indexPath = join(distDir, "index.html");

let html = await readFile(indexPath, "utf8");

const stylesheetMatch = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/);
if (stylesheetMatch) {
  const cssPath = stylesheetMatch[1].replace(/^\.\//, "");
  const css = await readFile(join(distDir, cssPath), "utf8");
  html = html.replace(stylesheetMatch[0], () => `<style>\n${css}\n</style>`);
}

const moduleMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*><\/script>/);
if (moduleMatch) {
  const jsPath = moduleMatch[1].replace(/^\.\//, "");
  const js = await readFile(join(distDir, jsPath), "utf8");
  html = html.replace(moduleMatch[0], () => `<script type="module">\n${js}\n</script>`);
}

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, "index.html"), html);
console.log("Single-file build written to single-file/index.html");
