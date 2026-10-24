// Builds an ffmpeg crop filter that pans a 16:9 window over the portrait source, following scripts/video-reframe.json.
import fs from "node:fs";
import path from "node:path";

export function reframeFilter(root, { srcW = 576, srcH = 1024, offset = 0 } = {}) {
  const { keyframes } = JSON.parse(fs.readFileSync(path.join(root, "scripts/video-reframe.json"), "utf8"));
  const cropH = Math.round((srcW * 9) / 16 / 2) * 2;
  const top = (k) => Math.max(0, Math.min(srcH - cropH, k.y * srcH - cropH / 2)).toFixed(1);
  // Piecewise-linear y(t), nested from the last segment backwards. `offset` shifts t for trimmed clips.
  let expr = top(keyframes.at(-1));
  for (let i = keyframes.length - 2; i >= 0; i--) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    const ya = top(a);
    const yb = top(b);
    expr = `if(lt(t+${offset},${b.t}),${ya}+(${yb}-${ya})*(t+${offset}-${a.t})/${(b.t - a.t).toFixed(2)},${expr})`;
  }
  return `crop=${srcW}:${cropH}:0:'${expr.replace(/,/g, "\\,")}'`;
}
