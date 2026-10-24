#!/usr/bin/env node
// Turns real photos dropped into public/cars/<slug>/ into optimized WebP + AVIF and wires them into data/cars.json.
//
//   public/cars/<slug>/exterior.jpg    → exterior.webp / .avif   (kind: exterior — main photo, front 3/4)
//   public/cars/<slug>/profile.jpg     → profile.webp / .avif    (kind: profile — pure side view)
//   public/cars/<slug>/rear.jpg        → rear.webp / .avif       (kind: rear)
//   public/cars/<slug>/interior.jpg    → interior.webp / .avif   (kind: interior)
//   public/cars/<slug>/gallery-1.jpg … → gallery-1.webp / .avif  (kind: gallery)
//
// Accepted inputs: .jpg .jpeg .png .heic .tif. Originals are moved to assets/cars-originals/<slug>/
// so they are not deployed. A photo you add replaces any stock photo of the same kind (and its credit).
// Usage: npm run cars:images
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARS_DIR = path.join(ROOT, "public/cars");
const ORIGINALS = path.join(ROOT, "assets/cars-originals");
const DATA = path.join(ROOT, "data/cars.json");
const MAX_WIDTH = 1920;
const INPUT = /\.(jpe?g|png|heic|heif|tiff?)$/i; // .webp files are treated as final outputs
const KINDS = [
  [/^exterior$/, "exterior"],
  [/^profile$/, "profile"],
  [/^rear$/, "rear"],
  [/^interior$/, "interior"],
  [/^gallery-\d+$/, "gallery"],
];

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
let changed = 0;

for (const car of data.cars) {
  const dir = path.join(CARS_DIR, car.slug);
  if (!fs.existsSync(dir)) continue;

  for (const file of fs.readdirSync(dir).sort()) {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    const kind = KINDS.find(([re]) => re.test(name))?.[1];
    if (!kind || !INPUT.test(file)) continue;

    const src = path.join(dir, file);
    const img = sharp(fs.readFileSync(src), { failOn: "none" }).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
    const webpName = `${name}.webp`;
    await img.clone().webp({ quality: 80 }).toFile(path.join(dir, webpName));
    await img.clone().avif({ quality: 55 }).toFile(path.join(dir, `${name}.avif`));

    fs.mkdirSync(path.join(ORIGINALS, car.slug), { recursive: true });
    fs.renameSync(src, path.join(ORIGINALS, car.slug, file));
    const url = `/cars/${car.slug}/${webpName}`;
    // Your own photo wins: drop any stock image of the same kind (except numbered gallery shots).
    if (kind !== "gallery") car.images = car.images.filter((i) => i.kind !== kind);
    car.images = car.images.filter((i) => i.src !== url);
    car.images.push({ src: url, kind });
    console.log(`✔ ${car.slug}/${webpName} (${kind})`);
    changed++;
  }
}

// Keep a stable order: exterior, profile, rear, interior, gallery-N.
const order = { exterior: 0, profile: 1, rear: 2, interior: 3, gallery: 4 };
for (const car of data.cars) car.images.sort((a, b) => order[a.kind] - order[b.kind] || a.src.localeCompare(b.src, undefined, { numeric: true }));
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");
console.log(changed ? `Done — ${changed} image(s) optimized.` : "No new photos found.");
