// Quality checks that run on every PR (before the tests):
// 1. every JS file parses, 2. every file index.html links to exists,
// 3. the page has a title and a viewport tag (mobile).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

let failed = false;
const fail = (msg) => { console.error("✗ " + msg); failed = true; };

for (const f of readdirSync("src")) {
  if (!f.endsWith(".js")) continue;
  try { execFileSync(process.execPath, ["--check", `src/${f}`]); }
  catch { fail(`syntax error in src/${f}`); }
}

const html = readFileSync("index.html", "utf8");
for (const [, ref] of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
  const file = ref.split("?")[0]; // ignore cache-busting like styles.css?v=4
  if (!existsSync(file)) fail(`index.html links to missing file: ${file}`);
}
if (!/<title>.+<\/title>/.test(html)) fail("index.html has no <title>");
if (!html.includes('name="viewport"')) fail("index.html has no viewport meta tag");

if (failed) process.exit(1);
console.log("✓ checks passed");
