import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = process.cwd();
const output = resolve(root, process.env.PAGES_DIR || "upstream/dist/pages");
const repository = process.env.GITHUB_REPOSITORY;
if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) throw new Error("GITHUB_REPOSITORY must be OWNER/REPO.");
const [owner, name] = repository.split("/");
const base = name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? "/" : `/${name}/`;
await cp(resolve(root, process.env.OVERLAY_FILE || "font-overlay.js"), join(output, "font-overlay.js"));

let pages = 0;
async function visit(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = await readFile(path, "utf8");
      if (html.includes(`${base}font-overlay.js`)) continue;
      if (!html.includes("</body>")) throw new Error(`No body close tag in ${path}`);
      await writeFile(path, html.replace("</body>", `  <script src="${base}font-overlay.js"></script>\n</body>`), "utf8");
      pages++;
    }
  }
}
await visit(output);
if (pages < 30) throw new Error(`Expected at least 30 localized website pages; injected ${pages}.`);
console.log(`Injected font overlay into ${pages} HTML pages with base ${base}`);

