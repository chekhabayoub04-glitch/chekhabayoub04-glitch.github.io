#!/usr/bin/env node
// Downloads the licensed stock photos listed in scripts/car-photos.json from Wikimedia Commons,
// optimizes them to WebP + AVIF and writes them (with author / license credit) into data/cars.json.
// Only freely licensed files (CC BY, CC BY-SA, CC0) are listed; the credit is shown under each photo on the site.
// Replace them with your own photos any time: see `npm run cars:images`.
// Usage: npm run cars:commons [-- --only <slug>]
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIST = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/car-photos.json"), "utf8"));
const DATA = path.join(ROOT, "data/cars.json");
const WIDTH = 1920; // a standard Commons thumbnail width
const UA = "MHD-AUTO-website/1.0 (image import script)";
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

function commonsUrl(title, width) {
  const name = title.replace(/^File:/, "").replace(/ /g, "_");
  const h = crypto.createHash("md5").update(name).digest("hex");
  const enc = encodeURIComponent(name);
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.slice(0, 2)}/${enc}/${width}px-${enc}`;
}

const download = (url) =>
  execFileSync("curl", ["-sS", "-f", "-L", "--retry", "6", "--retry-all-errors", "--retry-delay", "3", "-m", "180", "-A", UA, url], { maxBuffer: 1 << 28 });

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
for (const [slug, photos] of Object.entries(LIST)) {
  if (only && slug !== only) continue;
  const car = data.cars.find((c) => c.slug === slug);
  if (!car) continue;
  const dir = path.join(ROOT, "public/cars", slug);
  fs.mkdirSync(dir, { recursive: true });
  const stock = [];
  for (const p of photos) {
    const file = `${p.kind}.webp`;
    const out = path.join(dir, file);
    if (!fs.existsSync(out)) {
      let buf;
      try {
        buf = download(commonsUrl(p.title, WIDTH));
      } catch {
        buf = download(commonsUrl(p.title, 1280)); // smaller originals have no 1920 thumbnail
      }
      const img = sharp(buf).rotate().resize({ width: WIDTH, withoutEnlargement: true });
      await img.clone().webp({ quality: 80 }).toFile(out);
      await img.clone().avif({ quality: 55 }).toFile(out.replace(/\.webp$/, ".avif"));
      console.log(`✔ ${slug}/${file}`);
    }
    stock.push({
      src: `/cars/${slug}/${file}`,
      kind: p.kind,
      ...(p.focus ? { focus: p.focus } : {}),
      credit: { author: p.author, license: p.license, url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}` },
    });
  }
  // Keep the dealer's own photos (no credit) and video stills; replace previous stock entries.
  const own = car.images.filter((i) => !i.credit && !stock.some((s) => s.kind === i.kind && i.kind !== "gallery"));
  car.images = [...stock, ...own.filter((i) => fs.existsSync(path.join(ROOT, "public", i.src)))];
}
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");
console.log("✔ data/cars.json updated");
