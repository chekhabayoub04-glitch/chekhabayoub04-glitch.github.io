"use client";

import { useEffect, useRef, useState } from "react";
import { canAutoplayVideo, isDesktop } from "@/lib/motion";
import { sourcesAt, type Chapter } from "@/lib/video";

type Props = {
  chapter: Chapter;
  className?: string;
  /** Rendition heights by viewport: [desktop, mobile]. */
  heights?: [number, number];
  label?: string;
};

/**
 * Muted, inline, looping chapter clip. Mounts the <video> only when the connection allows it
 * (no Save-Data / 2G / reduced motion) and plays only while on screen. The poster stays underneath.
 */
export default function LoopVideo({ chapter, className = "", heights = [1024, 640], label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (canAutoplayVideo()) setHeight(isDesktop() ? heights[0] : heights[1]);
  }, [heights[0], heights[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "100px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [height]);

  if (height == null) return null;
  return (
    <video
      ref={ref}
      className={className}
      muted
      playsInline
      loop
      autoPlay
      preload="metadata"
      poster={chapter.poster.webp}
      aria-label={label}
      disablePictureInPicture
    >
      {sourcesAt(chapter, height).map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
