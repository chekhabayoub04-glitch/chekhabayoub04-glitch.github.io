#!/usr/bin/env node
// Video pipeline: hero film (hero-landscape.mp4) + source.mp4 -> chapter clips, scrub versions,
// smart-reframed landscape WebP frame sequences, posters, manifest.
// The raw source is read-only. Run `npm run video:analyze` first (reframe keyframes).
// Usage: npm run video:process [-- --only ch2-golf | --only hero | --only tour]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FFMPEG, FFPROBE } from "./bin.mjs";
import { reframeFilter } from "./reframe.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO = path.join(ROOT, "assets/video");
const OUT = {
  chapters: path.join(VIDEO, "chapters"),
  processed: path.join(VIDEO, "processed"),
  frames: path.join(VIDEO, "frames"),
  posters: path.join(VIDEO, "posters"),
};
const PUBLIC_BASE = "/media"; // assets/video/* is mirrored to public/media by scripts/sync-media.mjs

const SETTINGS = {
  heights: [1024, 640], // source is 576x1024 — never upscale
  heroBudgetBytes: 3 * 1024 * 1024,
  frameFps: 24,
  frameQuality: 64,
  frameSize: [960, 540], // landscape scrub frames (smart-reframed)
  scrubCrf: 24,
};

const config = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/video-chapters.json"), "utf8"));
const SOURCE = path.join(ROOT, config.source);
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

function run(bin, args) {
  const r = spawnSync(bin, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(r.stderr.toString().split("\n").slice(-15).join("\n"));
    throw new Error(`${path.basename(bin)} failed`);
  }
  return r.stdout.toString();
}

function probe(file) {
  const j = JSON.parse(run(FFPROBE, ["-v", "error", "-show_format", "-show_streams", "-of", "json", file]));
  const v = j.streams.find((s) => s.codec_type === "video");
  return {
    width: v.width,
    height: v.height,
    duration: Number(Number(j.format.duration).toFixed(3)),
    bytes: Number(j.format.size),
  };
}

const rel = (abs) => path.relative(VIDEO, abs).split(path.sep).join("/");
const publicUrl = (abs) => `${PUBLIC_BASE}/${rel(abs)}`;
const ffIn = (ch) => ["-hide_banner", "-y", "-ss", String(ch.start), "-to", String(ch.end), "-i", SOURCE, "-an", "-sn", "-dn", "-map_metadata", "-1"];

function encodeMp4(ch, h, dst, budget) {
  const base = [...ffIn(ch), "-vf", `scale=-2:${h}:flags=lanczos`, "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
  run(FFMPEG, [...base, "-crf", h < 1024 ? "26" : "23", dst]);
  if (budget && fs.statSync(dst).size > budget) {
    // Over budget: cap the bitrate so the clip fits.
    const kbps = Math.floor(((budget * 8) / (ch.end - ch.start) / 1000) * 0.92);
    run(FFMPEG, [...base, "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, dst]);
  }
}

function encodeWebm(ch, h, dst) {
  run(FFMPEG, [...ffIn(ch), "-vf", `scale=-2:${h}:flags=lanczos`, "-c:v", "libvpx-vp9", "-crf", h < 1024 ? "41" : "38", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", dst]);
}

function encodeScrub(ch, dst) {
  // All-intra: every frame is a keyframe, so setting currentTime is instant in both directions.
  run(FFMPEG, [...ffIn(ch), "-c:v", "libx264", "-preset", "medium", "-crf", String(SETTINGS.scrubCrf), "-g", "1", "-keyint_min", "1", "-sc_threshold", "0", "-bf", "0", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst]);
}

// Smart-reframed 16:9 window, upscaled with denoise + light sharpening so the portrait source holds up full-screen.
const landscape = ([w, h], offset = 0) => `${reframeFilter(ROOT, { offset })},scale=${w}:${h}:flags=lanczos,hqdn3d=1.5:1.5:3:3,unsharp=5:5:0.7`;

function extractFrames(ch, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  run(FFMPEG, [...ffIn(ch), "-vf", `${landscape(SETTINGS.frameSize, ch.start)},fps=${SETTINGS.frameFps}`, "-c:v", "libwebp", "-quality", String(SETTINGS.frameQuality), "-compression_level", "6", path.join(dir, "f_%04d.webp")]);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".webp")).sort();
  const bytes = files.reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0);
  return { count: files.length, bytes };
}

async function makePosters(ch) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-ss", String(ch.start), "-i", SOURCE, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"], { maxBuffer: 64 * 1024 * 1024 });
  const img = sharp(r.stdout);
  const webp = path.join(OUT.posters, `${ch.id}.webp`);
  const avif = path.join(OUT.posters, `${ch.id}.avif`);
  const blur = path.join(OUT.posters, `${ch.id}-blur.webp`);
  await img.clone().webp({ quality: 78 }).toFile(webp);
  await img.clone().avif({ quality: 55 }).toFile(avif);
  // Tiny blurred backdrop for desktop blur-fill behind the 9:16 frame.
  await img.clone().resize({ width: 96 }).blur(6).webp({ quality: 50 }).toFile(blur);
  const meta = await sharp(webp).metadata();
  return {
    webp: publicUrl(webp),
    avif: publicUrl(avif),
    blur: publicUrl(blur),
    width: meta.width,
    height: meta.height,
    bytes: { webp: fs.statSync(webp).size, avif: fs.statSync(avif).size, blur: fs.statSync(blur).size },
  };
}

async function stillToPosters(png, name) {
  const img = sharp(png);
  const webp = path.join(OUT.posters, `${name}.webp`);
  const avif = path.join(OUT.posters, `${name}.avif`);
  await img.clone().webp({ quality: 80 }).toFile(webp);
  await img.clone().avif({ quality: 55 }).toFile(avif);
  const meta = await sharp(webp).metadata();
  return { webp: publicUrl(webp), avif: publicUrl(avif), width: meta.width, height: meta.height };
}

/** Scroll-scrub WebP frame sequences, desktop 1280px + mobile 854px (no fades: scrubs start and end on real frames). */
function scrubFrames(file, name, fps) {
  const frames = {};
  for (const [key, [w, h]] of Object.entries({ desktop: [1280, 720], mobile: [854, 480] })) {
    const fdir = path.join(OUT.frames, key === "desktop" ? name : `${name}-mobile`);
    fs.rmSync(fdir, { recursive: true, force: true });
    fs.mkdirSync(fdir, { recursive: true });
    run(FFMPEG, ["-hide_banner", "-y", "-i", file, "-an", "-vf", `fps=${fps},scale=${w}:${h}:flags=lanczos,unsharp=5:5:0.55`, "-c:v", "libwebp", "-quality", "64", "-compression_level", "6", path.join(fdir, "f_%04d.webp")]);
    const files = fs.readdirSync(fdir).filter((f) => f.endsWith(".webp"));
    const bytes = files.reduce((n, f) => n + fs.statSync(path.join(fdir, f)).size, 0);
    frames[key] = { base: publicUrl(fdir), pattern: "f_{index}.webp", indexPad: 4, startIndex: 1, count: files.length, fps, width: w, height: h, totalBytes: bytes };
    console.log(`  ${name} frames ${key}: ${files.length} × ${w}px = ${(bytes / 1048576).toFixed(1)}MB`);
  }
  return frames;
}

/** Showroom tour film: scroll-scrubbed only (frames + poster). */
async function makeTour(tour) {
  const file = path.join(ROOT, tour.file);
  const info = probe(file);
  const still = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-ss", String(tour.poster), "-i", file, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"], { maxBuffer: 64 * 1024 * 1024 }).stdout;
  return { duration: info.duration, width: info.width, height: info.height, frames: scrubFrames(file, "tour", tour.frameFps), poster: await stillToPosters(still, "tour") };
}

/** Hero film (scripts/video-chapters.json → hero): web encodes with baked fade in/out so the loop restarts from black, + poster. */
async function makeHero(hero) {
  const file = path.join(ROOT, hero.file);
  const info = probe(file);
  const dir = path.join(OUT.chapters, "hero");
  fs.mkdirSync(dir, { recursive: true });
  const fadeOut = (info.duration - hero.fade.out).toFixed(2);
  const vf = `scale=-2:720:flags=lanczos,fade=t=in:st=0:d=${hero.fade.in},fade=t=out:st=${fadeOut}:d=${hero.fade.out}`;
  const base = ["-hide_banner", "-y", "-i", file, "-an", "-sn", "-dn", "-map_metadata", "-1", "-vf", vf];
  const mp4 = path.join(dir, "hero-720.mp4");
  const webm = path.join(dir, "hero-720.webm");
  run(FFMPEG, [...base, "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  run(FFMPEG, [...base, "-c:v", "libvpx-vp9", "-crf", "33", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", webm]);
  const sources = [[webm, 'video/webm; codecs="vp9"'], [mp4, "video/mp4"]]
    .map(([f, type]) => ({ src: publicUrl(f), type, ...probe(f) }))
    .sort((x, y) => x.bytes - y.bytes);
  const still = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-ss", String(hero.poster), "-i", file, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"], { maxBuffer: 64 * 1024 * 1024 }).stdout;
  console.log(`  hero: ${sources.map((x) => `${x.type.split(";")[0]} ${(x.bytes / 1048576).toFixed(1)}MB`).join(", ")}`);

  return { duration: info.duration, width: info.width, height: info.height, segments: hero.segments, sources, frames: scrubFrames(file, "hero", hero.frameFps), poster: await stillToPosters(still, "hero") };
}

async function main() {
  for (const d of Object.values(OUT)) fs.mkdirSync(d, { recursive: true });
  const src = probe(SOURCE);
  const manifestPath = path.join(VIDEO, "video-manifest.json");
  const prev = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { chapters: [] };
  const chapters = [];
  let tour = prev.tour;
  if (config.tour && (!only || only === "tour")) {
    console.log("▸ tour");
    tour = await makeTour(config.tour);
  }
  let hero = prev.hero;
  if (config.hero && (!only || only === "hero")) {
    console.log("▸ hero");
    hero = await makeHero(config.hero);
  }

  for (const ch of config.chapters) {
    if (only && ch.id !== only) {
      const old = prev.chapters.find((c) => c.id === ch.id);
      if (old) chapters.push(old);
      continue;
    }
    console.log(`▸ ${ch.id} (${ch.start}s → ${ch.end}s)`);
    const dir = path.join(OUT.chapters, ch.id);
    fs.mkdirSync(dir, { recursive: true });
    const isHero = ch.section === "hero";
    const sources = [];
    for (const h of SETTINGS.heights) {
      const mp4 = path.join(dir, `${ch.id}-${h}.mp4`);
      const webm = path.join(dir, `${ch.id}-${h}.webm`);
      encodeMp4(ch, h, mp4, isHero ? SETTINGS.heroBudgetBytes : null);
      encodeWebm(ch, h, webm);
      const pair = [[webm, 'video/webm; codecs="vp9"'], [mp4, "video/mp4"]].map(([file, type]) => {
        const p = probe(file);
        return { src: publicUrl(file), type, width: p.width, height: p.height, bytes: p.bytes };
      });
      // Browsers take the first playable <source>: list the smaller file first.
      sources.push(...pair.sort((a, b) => a.bytes - b.bytes));
    }

    const entry = {
      id: ch.id,
      section: ch.section,
      label: ch.label,
      sourceRange: { start: ch.start, end: ch.end },
      duration: Number((ch.end - ch.start).toFixed(3)),
      orientation: "portrait",
      aspectRatio: `${src.width}/${src.height}`,
      sources,
      poster: await makePosters(ch),
    };

    if (ch.scrub) {
      const scrub = path.join(OUT.processed, `${ch.id}-scrub.mp4`);
      encodeScrub(ch, scrub);
      const p = probe(scrub);
      entry.scrub = { src: publicUrl(scrub), type: "video/mp4", width: p.width, height: p.height, bytes: p.bytes, allIntra: true };
      const fdir = path.join(OUT.frames, ch.id);
      const f = extractFrames(ch, fdir);
      entry.frames = {
        base: publicUrl(fdir),
        pattern: "f_{index}.webp",
        indexPad: 4,
        startIndex: 1,
        count: f.count,
        fps: SETTINGS.frameFps,
        width: SETTINGS.frameSize[0],
        height: SETTINGS.frameSize[1],
        totalBytes: f.bytes,
      };
    }
    chapters.push(entry);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    publicBase: PUBLIC_BASE,
    source: { file: config.source, ...src, audio: "stripped" },
    strategy: {
      orientation: "Hero: 16:9 film, object-cover on every screen. Chapters: source is 9:16 — mobile native portrait; desktop scrub frames smart-reframed to 16:9 (scripts/video-reframe.json).",
      maxHeight: SETTINGS.heights[0],
    },
    hero,
    tour,
    chapters: config.chapters.map((c) => chapters.find((x) => x.id === c.id)).filter(Boolean),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✔ manifest → ${path.relative(ROOT, manifestPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
