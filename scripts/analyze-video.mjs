#!/usr/bin/env node
// Smart reframe analysis: finds, over time, the vertical band of the portrait source that holds the subject
// (edge energy, biased toward the lower-middle where cars sit), smooths it, and writes keyframes to
// scripts/video-reframe.json. process-video.mjs uses them to cut a landscape (16:9) "film" that follows the cars.
// Usage: npm run video:analyze
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FFMPEG, FFPROBE } from "./bin.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/video-chapters.json"), "utf8"));
const SOURCE = path.join(ROOT, config.source);
const W = 144;
const H = 256;
const FPS = 4;
const ASPECT = 16 / 9;
const BAND = Math.round(W / ASPECT); // crop height in analysis pixels
const BIAS_CENTER = 0.6; // favour the lower-middle of the frame (cars), not the ceiling lights
const BIAS_STRENGTH = 0.9;

const probe = JSON.parse(spawnSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "json", SOURCE]).stdout);
const duration = Number(probe.format.duration);
const srcH = probe.streams.find((s) => s.height).height;

const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-i", SOURCE, "-vf", `fps=${FPS},scale=${W}:${H},format=gray,edgedetect=low=0.08:high=0.25`, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 1024 * 1024 * 512 });
const buf = r.stdout;
const frames = Math.floor(buf.length / (W * H));

const raw = [];
for (let f = 0; f < frames; f++) {
  const rows = new Float64Array(H);
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = 0; x < W; x++) s += buf[f * W * H + y * W + x];
    rows[y] = s;
  }
  let best = 0;
  let bestScore = -Infinity;
  let win = 0;
  for (let y = 0; y < BAND; y++) win += rows[y];
  for (let y = 0; y + BAND <= H; y++) {
    if (y > 0) win += rows[y + BAND - 1] - rows[y - 1];
    const centre = (y + BAND / 2) / H;
    const bias = 1 - BIAS_STRENGTH * Math.abs(centre - BIAS_CENTER);
    const score = win * bias;
    if (score > bestScore) (bestScore = score), (best = y);
  }
  raw.push((best + BAND / 2) / H); // normalised centre 0..1
}

// Smooth (±1 s moving average) then limit pan speed so the camera move feels deliberate.
const half = FPS;
const smooth = raw.map((_, i) => {
  const a = raw.slice(Math.max(0, i - half), i + half + 1);
  return a.reduce((x, y) => x + y, 0) / a.length;
});
const maxStep = 0.06 / FPS; // max 6% of frame height per second
for (let i = 1; i < smooth.length; i++) {
  const d = smooth[i] - smooth[i - 1];
  if (Math.abs(d) > maxStep) smooth[i] = smooth[i - 1] + Math.sign(d) * maxStep;
}

// Keyframes every 0.5 s, as centre ratio of the source height.
const keyframes = [];
for (let i = 0; i < smooth.length; i += FPS / 2) keyframes.push({ t: Number((i / FPS).toFixed(2)), y: Number(smooth[i].toFixed(4)) });
keyframes.push({ t: Number(duration.toFixed(2)), y: keyframes.at(-1).y });

const out = { generatedAt: new Date().toISOString(), aspect: "16:9", sourceHeight: srcH, bandRatio: BAND / H, keyframes };
fs.writeFileSync(path.join(ROOT, "scripts/video-reframe.json"), JSON.stringify(out, null, 1));
console.log(`✔ ${keyframes.length} reframe keyframes over ${duration.toFixed(1)}s → scripts/video-reframe.json`);
console.log(keyframes.filter((_, i) => i % 4 === 0).map((k) => `${k.t}s:${Math.round(k.y * 100)}%`).join(" "));
