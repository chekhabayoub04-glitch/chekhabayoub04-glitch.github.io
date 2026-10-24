#!/usr/bin/env node
// Mirrors web-ready video outputs (assets/video/*) into public/media so Next.js can serve them.
// Runs automatically before dev/build. The raw source is never copied.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets/video");
const DST = path.join(ROOT, "public/media");

fs.rmSync(DST, { recursive: true, force: true });
for (const dir of ["chapters", "processed", "frames", "posters"]) {
  fs.cpSync(path.join(SRC, dir), path.join(DST, dir), {
    recursive: true,
    filter: (p) => !p.endsWith(".gitkeep"),
  });
}
console.log("✔ media synced → public/media");
