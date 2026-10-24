#!/usr/bin/env node
// After `next build` (static export): French is the default locale, so its home page is also served at the root.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
fs.copyFileSync(path.join(OUT, "fr/index.html"), path.join(OUT, "index.html"));
console.log("✔ out/index.html ← out/fr/index.html");
