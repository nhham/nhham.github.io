// Copies only the files the live site needs into dist/ (what GitHub Pages deploys).
import { cpSync, rmSync, mkdirSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const f of ["index.html", "styles.css", "src", "data", "assets"]) {
  cpSync(f, `dist/${f}`, { recursive: true });
}
console.log("built dist/");
