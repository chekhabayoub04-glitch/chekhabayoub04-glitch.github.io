#!/usr/bin/env node
// Intro film: assets/video/raw/intro-desktop.mp4 (16:9) [+ optional intro-mobile.mp4 (9:16)] -> web-ready H.264 in assets/video/intro.
// No 9:16 source? The portrait cut is derived from the 16:9 one: a wider centre crop (both headlights stay in frame)
// over a blurred, darkened fill of the same shot, feathered top and bottom so the seam disappears in the dark.
// Silent, faststart (plays while downloading), never upscaled.
// Usage: npm run intro:encode
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FFMPEG } from "./bin.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "assets/video/raw");
const OUT = path.join(ROOT, "assets/video/intro");
const TRIM = 0.4; // shave the first beat of pure black so the headlights arrive sooner
const H264 = ["-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"];

// Portrait from landscape: 1080x1920 canvas, foreground = centre 47% of the width scaled to 1080 wide.
const PORTRAIT_FROM_LANDSCAPE = [
  "[0:v]split[a][b]",
  "[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12:saturation=0.8[bg]",
  "[b]crop=iw*0.47:ih,scale=1080:-2,format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='255*min(1,min(Y,H-Y)/(H*0.18))'[fg]",
  "[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=30",
].join(";");

function encode(name, args) {
  const dst = path.join(OUT, `${name}.mp4`);
  const r = spawnSync(FFMPEG, ["-y", ...args, ...H264, dst], { stdio: ["ignore", "ignore", "pipe"] });
  if (r.status !== 0) {
    console.error(r.stderr.toString().slice(-2000));
    process.exit(1);
  }
  console.log(`✔ ${name}.mp4 (${(fs.statSync(dst).size / 1024 / 1024).toFixed(1)} MB)`);
}

const desktop = path.join(RAW, "intro-desktop.mp4");
const mobile = path.join(RAW, "intro-mobile.mp4");
if (!fs.existsSync(desktop)) {
  console.warn("… put the generated 16:9 clip at assets/video/raw/intro-desktop.mp4");
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });

encode("intro-desktop", ["-ss", String(TRIM), "-i", desktop, "-vf", "scale='min(1920,iw)':-2:flags=lanczos,fps=30", "-crf", "20"]);
if (fs.existsSync(mobile)) encode("intro-mobile", ["-ss", String(TRIM), "-i", mobile, "-vf", "scale='min(1080,iw)':-2:flags=lanczos,fps=30", "-crf", "23"]);
else encode("intro-mobile", ["-ss", String(TRIM), "-i", desktop, "-filter_complex", PORTRAIT_FROM_LANDSCAPE, "-crf", "23"]);
