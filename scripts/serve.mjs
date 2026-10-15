// Tiny static server for the browser tests (serves dist/ on port 4173).
// No dependencies, so it runs the same on every machine and in CI.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = "dist";
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(ROOT, normalize(path === "/" ? "/index.html" : path).replace(/^(\.\.[/\\])+/, ""));
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`serving ${ROOT}/ on http://localhost:${PORT}`));
