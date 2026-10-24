// Resolves ffmpeg/ffprobe binaries bundled via npm (no system install needed).
// Override with FFMPEG_PATH / FFPROBE_PATH env vars to use a system install.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const FFMPEG = process.env.FFMPEG_PATH || require("ffmpeg-static");
export const FFPROBE = process.env.FFPROBE_PATH || require("@ffprobe-installer/ffprobe").path;
