import manifest from "~/assets/video/video-manifest.json";

export type VideoSource = { src: string; type: string; width: number; height: number; bytes: number };
export type FrameSequence = {
  base: string;
  pattern: string;
  indexPad: number;
  startIndex: number;
  count: number;
  fps: number;
  width: number;
  height: number;
};
export type Chapter = {
  id: string;
  section: string;
  label: string;
  sourceRange: { start: number; end: number };
  duration: number;
  aspectRatio: string;
  sources: VideoSource[];
  poster: { webp: string; avif: string; blur: string; width: number; height: number };
  scrub?: VideoSource;
  frames?: FrameSequence;
};

export type Hero = {
  duration: number;
  width: number;
  height: number;
  segments: { id: string; start: number }[];
  sources: VideoSource[];
  frames: { desktop: FrameSequence; mobile: FrameSequence };
  poster: { webp: string; avif: string; width: number; height: number };
};

export const chapters = manifest.chapters as Chapter[];
export const hero = manifest.hero as Hero;

export type Tour = { duration: number; frames: { desktop: FrameSequence; mobile: FrameSequence }; poster: { webp: string; avif: string } };
export const tour = manifest.tour as Tour;

export function getChapter(id: string): Chapter {
  const c = chapters.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown video chapter: ${id}`);
  return c;
}

export const chaptersFor = (section: string) => chapters.filter((c) => c.section === section);

/** Sources for one rendition height (smaller file first, as written by the pipeline). */
export const sourcesAt = (c: Chapter, height: number) => c.sources.filter((s) => s.height === height);

export const frameUrl = (f: FrameSequence, i: number) =>
  `${f.base}/${f.pattern.replace("{index}", String(f.startIndex + i).padStart(f.indexPad, "0"))}`;
