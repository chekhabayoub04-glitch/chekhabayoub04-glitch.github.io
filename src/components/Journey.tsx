"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import type { Chapter } from "@/lib/video";
import LoopVideo from "./LoopVideo";
import { IconArrow } from "./Icons";

type Step = { title: string; text: string };

/** Pinned horizontal gallery: vertical scroll drives the track sideways (direction-aware). Native swipe under reduced motion. */
export default function Journey({ kicker, title, hint, steps, media, videoLabel }: { kicker: string; title: string; hint: string; steps: Step[]; media: Chapter[]; videoLabel: string }) {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setPinned(true);
  }, []);

  useEffect(() => {
    if (!pinned || !track.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const measure = () => setDistance(Math.max(0, track.current!.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track.current);
    return () => ro.disconnect();
  }, [pinned]);

  useEffect(() => {
    if (!pinned || !distance) return;
    const sign = document.dir === "rtl" ? 1 : -1;
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        gsap.set(track.current, { x: sign * self.progress * distance });
        if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
      },
    });
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [pinned, distance]);

  return (
    <section
      ref={outer}
      aria-labelledby="journey-title"
      className="relative border-t border-line"
      style={pinned && distance ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div className={pinned ? "sticky top-0 flex h-svh flex-col justify-center overflow-hidden" : "py-20"}>
        <ol
          ref={track}
          className={`flex w-max gap-4 px-[clamp(16px,4vw,56px)] will-change-transform lg:gap-6 ${pinned ? "" : "no-scrollbar w-full snap-x snap-mandatory overflow-x-auto"}`}
          data-lenis-prevent={pinned ? undefined : true}
        >
          <li className="flex w-[82vw] shrink-0 snap-start flex-col justify-center pe-6 sm:w-[60vw] lg:w-[34vw]">
            <p className="eyebrow">{kicker}</p>
            <h2 id="journey-title" className="mt-5 text-[clamp(36px,4.4vw,72px)] font-black leading-[1.05] ltr:font-display ltr:uppercase ltr:leading-[.95]">
              {title}
            </h2>
            <p className="mt-6 flex items-center gap-3 text-sm text-mute">
              {hint}
              <IconArrow width={18} height={18} className="text-signal-hi" />
            </p>
          </li>
          {steps.map((s, i) => {
            const ch = media[i % media.length];
            return (
              <li key={s.title} className="relative flex h-[min(72svh,640px)] w-[78vw] shrink-0 snap-start flex-col justify-end overflow-hidden border border-line sm:w-[46vw] lg:w-[30vw]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ch.poster.webp} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                <LoopVideo chapter={ch} heights={[640, 640]} label={videoLabel} className="absolute inset-0 -z-10 h-full w-full object-cover" />
                <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#0a0a0b_15%,rgba(10,10,11,.4)_55%,rgba(10,10,11,.15))]" />
                <div className="p-6 lg:p-8">
                  <p className="font-display text-[88px] font-black leading-none text-transparent [-webkit-text-stroke:1px_rgba(238,234,227,.5)]" dir="ltr">
                    <span className="block text-start rtl:text-end">0{i + 1}</span>
                  </p>
                  <h3 className="mt-3 text-2xl font-black ltr:font-display ltr:text-3xl ltr:uppercase">{s.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-7 text-bone/80">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {pinned && (
          <div className="container-x mt-8">
            <div className="h-px bg-white/10">
              <div ref={bar} className="h-full origin-left bg-signal rtl:origin-right" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
