"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { canAutoplayVideo, prefersReducedMotion } from "@/lib/motion";
import { createFramePlayer } from "@/lib/frames";
import { frameUrl, type Tour } from "@/lib/video";
import { IconArrow, IconClock, IconPin, SERVICE_ICONS } from "./Icons";

type Service = { key: keyof typeof SERVICE_ICONS; title: string; text: string };
type Copy = {
  index: string;
  kicker: string;
  title: string;
  intro: string;
  servicesTitle: string;
  steps: string[];
  visitTitle: string;
  visitText: string;
  cta: string;
  hours: string;
  address: string;
  caption: string;
  videoLabel: string;
};

/**
 * Pinned showroom walk-through: the tour film is scrubbed by the scroll wheel while panels take turns —
 * the showroom, then each service, then visit info (hours, address, booking).
 */
export default function ShowroomTour({ tour, services, hours, address, copy }: { tour: Tour; services: Service[]; hours: { label: string; value: string }[]; address: string; copy: Copy }) {
  const outer = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [scrub, setScrub] = useState(false);

  useEffect(() => {
    if (!prefersReducedMotion()) setScrub(true);
  }, []);

  useEffect(() => {
    if (!scrub || !outer.current || !canvas.current || !stage.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const frames = tour.frames.desktop; // full resolution on phones too (they crop the centre)
    const urls = Array.from({ length: frames.count }, (_, i) => frameUrl(frames, i));
    const player = createFramePlayer(canvas.current, urls, { concurrency: canAutoplayVideo() ? 6 : 2, maxDpr: 2 });
    player.resize();
    const onResize = () => player.resize();
    window.addEventListener("resize", onResize);
    // Start downloading when the section is within two screens.
    const io = new IntersectionObserver(([e]) => e.isIntersecting && player.start(), { rootMargin: "200% 0px" });
    io.observe(outer.current);

    const q = gsap.utils.selector(stage.current);
    const proxy = { frame: 0 };
    const n = services.length;
    // Panel windows on the 0..1 timeline: intro, n services, visit.
    const slot = 0.8 / (n + 1);
    let last = -2;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: outer.current, start: "top top", end: "bottom bottom", scrub: 0.7 },
      onUpdate: () => {
        player.render(proxy.frame);
        const p = tl.progress();
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        const k = p < slot ? -1 : Math.min(n, Math.floor((p - slot) / slot));
        if (k !== last) setActive((last = k));
      },
    });
    tl.to(proxy, { frame: frames.count - 1, duration: 1 }, 0);
    const show = (sel: string, at: number, hold: number, final = false) => {
      tl.fromTo(q(sel), { opacity: 0, y: 50, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.05, stagger: 0.01, ease: "power2.out" }, at);
      if (!final) tl.to(q(sel), { opacity: 0, y: -40, filter: "blur(8px)", duration: 0.04, ease: "power1.in" }, at + hold);
    };
    // The intro is visible on arrival; it only leaves.
    tl.to(q("[data-p='intro']"), { opacity: 0, y: -40, filter: "blur(8px)", duration: 0.04, ease: "power1.in" }, slot - 0.03);
    // Each panel starts leaving just before the next arrives, so there is never an empty screen.
    services.forEach((_, i) => show(`[data-p='s${i}']`, slot * (i + 1), slot - 0.025));
    show("[data-p='visit']", slot * (n + 1), 0, true);
    tl.fromTo(q("[data-rail]"), { opacity: 0 }, { opacity: 1, duration: 0.03 }, slot - 0.02).to(q("[data-rail]"), { opacity: 0, duration: 0.03 }, slot * (n + 1) - 0.02);
    player.render(0);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      io.disconnect();
      player.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [scrub, tour, services]);

  const panel = "absolute inset-x-0 bottom-0 top-0 flex flex-col justify-center container-x motion-reduce:relative motion-reduce:py-16";
  const hidden = "opacity-0 motion-reduce:opacity-100";

  return (
    <section id="services" ref={outer} aria-labelledby="tour-title" className="relative h-[620svh] scroll-mt-0 motion-reduce:h-auto">
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden motion-reduce:relative motion-reduce:h-auto">
        {/* Film */}
        <div aria-hidden className="absolute inset-0 motion-reduce:fixed motion-reduce:-z-10">
          <picture>
            <source srcSet={tour.poster.avif} type="image/avif" />
            <img src={tour.poster.webp} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          </picture>
          <canvas ref={canvas} role="img" aria-label={copy.videoLabel} className="absolute inset-0 h-full w-full" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,10,11,.88),rgba(10,10,11,.35)_55%,rgba(10,10,11,.15))] rtl:bg-[linear-gradient(to_left,rgba(10,10,11,.88),rgba(10,10,11,.35)_55%,rgba(10,10,11,.15))]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,11,.85),transparent_35%),linear-gradient(to_bottom,rgba(10,10,11,.7),transparent_25%)]" />
        <div aria-hidden className="absolute inset-0 bg-ink/45 lg:hidden" />
        <div aria-hidden className="grain absolute inset-0" />

        {/* Intro */}
        <div data-p="intro" className={panel}>
          <div className="max-w-2xl pt-16">
            <p className="flex items-center gap-3 text-sm font-semibold text-mute">
              <span className="index-tag text-lg" dir="ltr">
                {`// ${copy.index}.`}
              </span>
              {copy.kicker}
            </p>
            <h2 id="tour-title" data-no-split className="mt-4 text-[clamp(44px,6.6vw,120px)] font-black leading-[1.02] ltr:font-display ltr:uppercase ltr:leading-[.9]">
              {copy.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-bone/85 lg:text-lg">{copy.intro}</p>
          </div>
        </div>

        {/* Services, one at a time */}
        {services.map((s, i) => {
          const Icon = SERVICE_ICONS[s.key];
          return (
            <div key={s.key} data-p={`s${i}`} className={`${panel} ${hidden}`}>
              <div className="max-w-2xl pt-16">
                <p className="text-xs font-semibold tracking-[.2em] text-mute rtl:tracking-normal">{copy.steps[i]}</p>
                <div className="mt-4 flex items-end gap-5">
                  <span className="font-display text-[clamp(110px,14vw,220px)] font-black leading-[.8] text-transparent [-webkit-text-stroke:1.5px_rgba(238,234,227,.55)]" dir="ltr">
                    0{i + 1}
                  </span>
                  <span className="mb-3 grid h-16 w-16 shrink-0 place-items-center border border-signal/60 bg-ink/50 text-signal-hi backdrop-blur">
                    <Icon width={30} height={30} />
                  </span>
                </div>
                <h3 className="mt-6 text-[clamp(32px,4vw,64px)] font-black leading-[1.05] ltr:font-display ltr:uppercase ltr:leading-[.95]">{s.title}</h3>
                <p className="mt-4 max-w-lg text-base leading-8 text-bone/85 lg:text-lg">{s.text}</p>
              </div>
            </div>
          );
        })}

        {/* Visit */}
        <div data-p="visit" className={`${panel} ${hidden}`}>
          <div className="max-w-2xl pt-16">
            <h3 className="text-[clamp(40px,5.6vw,100px)] font-black leading-[1.02] ltr:font-display ltr:uppercase ltr:leading-[.9]">{copy.visitTitle}</h3>
            <p className="mt-5 max-w-lg text-base leading-8 text-bone/85 lg:text-lg">{copy.visitText}</p>
            <div className="mt-8 grid max-w-xl gap-6 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold">
                  <IconClock width={18} height={18} className="text-signal-hi" />
                  {copy.hours}
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  {hours.map((h) => (
                    <div key={h.label} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                      <dt className="text-bone/70">{h.label}</dt>
                      <dd dir="ltr">{h.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-bold">
                  <IconPin width={18} height={18} className="text-signal-hi" />
                  {copy.address}
                </p>
                <p className="mt-3 text-sm leading-7 text-bone/80">{address}</p>
              </div>
            </div>
            <Link href={{ pathname: "/", hash: "contact" }} className="btn btn-primary mt-8">
              {copy.cta}
              <IconArrow width={18} height={18} />
            </Link>
          </div>
        </div>

        {/* Services rail */}
        <nav data-rail aria-label={copy.servicesTitle} className="absolute end-[7%] top-1/2 hidden w-64 -translate-y-1/2 opacity-0 lg:block motion-reduce:hidden">
          <p className="mb-4 text-xs font-semibold tracking-[.2em] text-mute rtl:tracking-normal">{copy.servicesTitle}</p>
          <ol className="space-y-1">
            {services.map((s, i) => (
              <li key={s.key} className={`flex items-center gap-3 border-s-2 py-2 ps-4 text-sm transition-colors duration-500 ${i === active ? "border-signal text-bone" : "border-white/15 text-bone/45"}`}>
                <span className="font-display font-bold" dir="ltr">
                  0{i + 1}
                </span>
                {s.title}
              </li>
            ))}
          </ol>
        </nav>

        {/* progress */}
        <div className="absolute inset-x-0 bottom-0 motion-reduce:hidden">
          <div className="container-x pb-3 font-sans text-[11px] tracking-[.18em] text-mute" dir="ltr">
            {copy.caption.toUpperCase()}
          </div>
          <div className="h-px bg-white/10">
            <div ref={bar} className="h-full origin-left bg-signal rtl:origin-right" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
