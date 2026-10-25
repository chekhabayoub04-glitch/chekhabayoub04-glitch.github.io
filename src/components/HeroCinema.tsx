"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { canAutoplayVideo, prefersReducedMotion } from "@/lib/motion";
import { createFramePlayer } from "@/lib/frames";
import { frameUrl, type Hero } from "@/lib/video";
import { IconArrow, IconWhatsApp } from "./Icons";

type Brand = { name: string; path?: string };
type Copy = {
  eyebrow: string;
  line1: string;
  line2: string;
  glow: string;
  lede: string;
  ctaCars: string;
  ctaWhatsapp: string;
  rec: string;
  scroll: string;
  tagline: string;
  city: string;
  brandsTitle: string;
  enter: string;
  segments: Record<string, string>;
  videoLabel: string;
};

// Scroll choreography (fractions of the pinned distance).
const VIDEO_FROM = 0.02;
const VIDEO_TO = 0.72;
const STEP = 0.09;
const delay = (s: number) => ({ animationDelay: `${s}s` });
const tc = (s: number) => `00:${String(Math.floor(s)).padStart(2, "0")}`;

function Words({ text, from }: { text: string; from: number }) {
  return text.split(/\s+/).map((w, i) => (
    <span key={i}>
      <span className="word" style={delay(from + i * STEP)}>
        {w}
      </span>{" "}
    </span>
  ));
}

/**
 * Cinematic opening: the hero film is scrubbed by the scroll wheel (canvas frame sequence) and drifts with the cursor;
 * when the film ends, the scene dims and the MHD AUTO sign, the showroom name and the brand marks assemble.
 */
export default function HeroCinema({ hero, brands, copy, whatsapp }: { hero: Hero; brands: Brand[]; copy: Copy; whatsapp: string }) {
  const outer = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drift = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const [seg, setSeg] = useState(0);
  const [scrub, setScrub] = useState(false);

  const seq = hero.frames;
  const lineCount = (t: string) => t.split(/\s+/).length;

  useEffect(() => {
    if (!prefersReducedMotion()) setScrub(true);
  }, []);

  // Scroll-driven film + overlays.
  useEffect(() => {
    if (!scrub || !outer.current || !canvas.current || !stage.current) return;
    gsap.registerPlugin(ScrollTrigger);
    // Full 1280px frames everywhere: phones crop the centre of a 16:9 film, so they need every pixel.
    const frames = seq.desktop;
    const urls = Array.from({ length: frames.count }, (_, i) => frameUrl(frames, i));
    const player = createFramePlayer(canvas.current, urls, { concurrency: canAutoplayVideo() ? 6 : 2, maxDpr: 2 });
    player.resize();
    // Defer the 200-frame download until the visitor shows intent (or the page is idle),
    // so the first paint (poster + headline) never competes with it.
    const kick = () => {
      player.start();
      off();
    };
    const intents = ["wheel", "touchstart", "keydown", "pointerdown", "scroll"] as const;
    const off = () => {
      intents.forEach((e) => window.removeEventListener(e, kick));
      window.removeEventListener("intro:done", kick);
    };
    // While the intro film plays it gets the whole connection; the frames follow once it hands over.
    if (document.documentElement.classList.contains("intro-on")) window.addEventListener("intro:done", kick);
    else intents.forEach((e) => window.addEventListener(e, kick, { once: true, passive: true }));
    const idle = window.setTimeout(
      () => !document.documentElement.classList.contains("intro-on") && ("requestIdleCallback" in window ? requestIdleCallback(kick) : kick()),
      3500,
    );
    const onResize = () => player.resize();
    window.addEventListener("resize", onResize);

    const q = gsap.utils.selector(stage.current);
    const proxy = { frame: 0 };
    const segStarts = hero.segments.map((s) => s.start);
    let lastSeg = 0;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: outer.current, start: "top top", end: "bottom bottom", scrub: 0.7 },
      onUpdate: () => {
        player.render(proxy.frame);
        const time = (proxy.frame / (frames.count - 1)) * hero.duration;
        if (fill.current) fill.current.style.transform = `scaleX(${time / hero.duration})`;
        if (clock.current) clock.current.textContent = `${tc(time)} / ${tc(hero.duration)}`;
        let k = 0;
        segStarts.forEach((s, i) => time >= s - 0.05 && (k = i));
        if (k !== lastSeg) setSeg((lastSeg = k));
      },
    });
    tl.to(proxy, { frame: frames.count - 1, duration: VIDEO_TO - VIDEO_FROM }, VIDEO_FROM)
      .to(q("[data-a]"), { opacity: 0, y: -60, filter: "blur(10px)", stagger: 0.01, duration: 0.1, ease: "power1.in" }, 0.04)
      .to(q("[data-cue]"), { opacity: 0, duration: 0.04 }, 0.02)
      .to(q("[data-dim]"), { opacity: 0.78, duration: 0.1 }, VIDEO_TO - 0.04)
      .to(q("[data-hud]"), { opacity: 0, duration: 0.06 }, VIDEO_TO)
      .fromTo(q("[data-logo]"), { opacity: 0, scale: 1.35, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.1, ease: "power3.out" }, VIDEO_TO + 0.02)
      .fromTo(q("[data-c]"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.06, stagger: 0.02, ease: "power2.out" }, VIDEO_TO + 0.08)
      .fromTo(q("[data-brand]"), { opacity: 0, y: 40, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.06, stagger: 0.012, ease: "back.out(1.6)" }, VIDEO_TO + 0.13)
      .fromTo(q("[data-enter]"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.05 }, 0.93)
      .to({}, { duration: 0.02 }, 0.98);
    player.render(0);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      off();
      clearTimeout(idle);
      player.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [scrub, seq, hero.duration, hero.segments]);

  // Cursor drift (desktop, fine pointer): the scene leans gently toward the mouse.
  useEffect(() => {
    if (!scrub || !window.matchMedia("(pointer: fine)").matches || !drift.current) return;
    const el = drift.current;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth) * 2 - 1;
      target.y = (e.clientY / innerHeight) * 2 - 1;
    };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      el.style.transform = `translate3d(${-cur.x * 22}px, ${-cur.y * 14}px, 0) scale(1.07) rotate(${cur.x * 0.35}deg)`;
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(outer.current!);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [scrub]);

  const seekTo = (start: number) => {
    const o = outer.current;
    if (!o) return;
    const p = VIDEO_FROM + (start / hero.duration) * (VIDEO_TO - VIDEO_FROM) + 0.005;
    const y = o.offsetTop + p * (o.offsetHeight - innerHeight);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const first = frameUrl(seq.desktop, 0);

  return (
    <section ref={outer} aria-labelledby="hero-title" className="relative h-[460svh] motion-reduce:h-auto">
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden motion-reduce:relative motion-reduce:h-auto">
        {/* Film */}
        <div ref={drift} aria-hidden className="absolute inset-0 will-change-transform [transform:scale(1.07)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={first} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <canvas ref={canvas} role="img" aria-label={copy.videoLabel} className="absolute inset-0 h-full w-full" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,11,.9)_0%,rgba(10,10,11,.35)_42%,rgba(10,10,11,0)_68%),linear-gradient(to_bottom,rgba(10,10,11,.6),transparent_22%)]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_45%,rgba(10,10,11,.6)_85%)]" />
        {/* Phones: the bright sign sits behind the headline — a deeper scrim keeps the text legible */}
        <div aria-hidden data-a className="absolute inset-0 bg-[linear-gradient(to_top,#0a0a0b_0%,rgba(10,10,11,.92)_40%,rgba(10,10,11,.6)_62%,rgba(10,10,11,.1)_82%)] lg:hidden" />
        <div aria-hidden data-dim className="absolute inset-0 bg-ink opacity-0" />
        <div aria-hidden className="grain absolute inset-0" />

        {/* HUD */}
        <div data-hud className="motion-reduce:hidden">
          {(["top-[88px] start-4 border-t border-s", "top-[88px] end-4 border-t border-e", "bottom-4 start-4 border-b border-s", "bottom-4 end-4 border-b border-e"] as const).map((c) => (
            <span key={c} aria-hidden className={`pointer-events-none absolute hidden h-6 w-6 border-bone/50 lg:block ${c}`} />
          ))}
          <div dir="ltr" className="absolute start-4 top-[84px] flex items-center gap-3 font-sans text-[11px] tracking-[.2em] text-bone/85 lg:start-10 lg:top-[100px]">
            <span className="flex items-center gap-2 bg-ink/50 px-2.5 py-1.5 backdrop-blur">
              <i className="h-[7px] w-[7px] animate-[pulse-dot_1.6s_ease-in-out_infinite] rounded-full bg-signal shadow-[0_0_10px_#e8382c]" />
              {copy.rec}
            </span>
            <span className="hidden sm:inline">
              {String(seg + 1).padStart(2, "0")} · <span className="font-ar tracking-normal">{copy.segments[hero.segments[seg].id]}</span>
            </span>
            <span ref={clock} className="tabular-nums text-bone/60">
              {tc(0)} / {tc(hero.duration)}
            </span>
          </div>
          <nav aria-label={copy.scroll} dir="ltr" className="absolute inset-x-4 bottom-6 hidden lg:inset-x-10 lg:block">
            <ol className="flex h-10 items-end">
              {hero.segments.map((s, i) => {
                const end = hero.segments[i + 1]?.start ?? hero.duration;
                return (
                  <li key={s.id} style={{ width: `${((end - s.start) / hero.duration) * 100}%` }} className="relative h-full">
                    <button
                      type="button"
                      onClick={() => seekTo(s.start)}
                      className={`absolute inset-0 flex flex-col justify-end border-s border-bone/25 ps-2 pb-3 text-start transition-colors ${i === seg ? "text-bone" : "text-bone/45 hover:text-bone/80"}`}
                    >
                      <span className="font-sans text-[10px] tracking-[.18em]">0{i + 1}</span>
                      <span className="truncate font-ar text-xs font-semibold">{copy.segments[s.id]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="h-[2px] bg-bone/15">
              <div ref={fill} className="h-full origin-left bg-signal" style={{ transform: "scaleX(0)" }} />
            </div>
          </nav>
        </div>

        {/* Act I — headline */}
        <div className="container-x absolute inset-x-0 bottom-0 pb-24 lg:pb-28 motion-reduce:relative motion-reduce:pt-[60svh]">
          <p data-a className="eyebrow fade-up" style={delay(0.1)}>
            {copy.eyebrow}
          </p>
          <h1
            id="hero-title"
            data-a
            className="mt-4 max-w-[19ch] text-[36px] font-black leading-[1.08] tracking-[-.01em] [text-shadow:0_2px_24px_rgba(0,0,0,.55)] sm:mt-5 sm:text-[clamp(42px,5.6vw,100px)] ltr:max-w-[22ch] ltr:font-display ltr:text-[42px] ltr:uppercase ltr:leading-[.95] ltr:sm:text-[clamp(46px,5.8vw,104px)] lg:[text-shadow:none]"
          >
            <Words text={copy.line1} from={0.2} /> <Words text={copy.line2} from={0.2 + lineCount(copy.line1) * STEP} />{" "}
            <span className="word" style={delay(0.2 + (lineCount(copy.line1) + lineCount(copy.line2)) * STEP)}>
              <em className="light-sweep not-italic">{copy.glow}</em>
              <span className="text-signal">.</span>
            </span>
          </h1>
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p data-a className="max-w-[40ch] text-[15px] leading-7 text-bone/90 sm:text-base sm:leading-8 lg:text-lg">
              {copy.lede}
            </p>
            <div data-a className="fade-up grid gap-3 sm:flex" style={delay(0.6)}>
              <Link href={{ pathname: "/", hash: "showroom" }} className="btn btn-primary px-7">
                {copy.ctaCars}
                <IconArrow width={18} height={18} />
              </Link>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost bg-ink/30 backdrop-blur">
                <IconWhatsApp width={18} height={18} className="text-wa" />
                {copy.ctaWhatsapp}
              </a>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div data-cue aria-hidden className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[11px] font-semibold tracking-[.2em] text-bone/70 lg:flex motion-reduce:hidden">
          <span className="relative h-10 w-6 rounded-full border border-bone/50">
            <i className="absolute left-1/2 top-2 h-2 w-[2px] -translate-x-1/2 animate-[scroll-dot_1.8s_ease-in-out_infinite] rounded bg-bone" />
          </span>
          <span className="whitespace-nowrap rtl:tracking-normal">{copy.scroll}</span>
        </div>

        {/* Act II — the sign, the name, the brands */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center motion-reduce:pointer-events-auto motion-reduce:relative motion-reduce:inset-auto motion-reduce:bg-ink/85 motion-reduce:py-24 [&_a]:pointer-events-auto">
          <div data-logo dir="ltr" className="flex items-center gap-[1.5vw] opacity-0 motion-reduce:opacity-100">
            <span className="font-display text-[clamp(84px,15vw,250px)] font-black leading-[.8] tracking-tight text-white [text-shadow:0_0_40px_rgba(221,230,240,.35),0_0_120px_rgba(221,230,240,.2)]">MHD</span>
            <span className="self-end bg-signal px-[.4em] py-[.12em] font-display text-[clamp(22px,3.6vw,60px)] font-extrabold tracking-[.18em] text-white shadow-[0_0_40px_rgba(212,46,36,.55)]">AUTO</span>
          </div>
          <p data-c className="mt-6 font-sans text-[clamp(12px,1.1vw,16px)] font-semibold uppercase tracking-[.5em] text-bone/85 opacity-0 motion-reduce:opacity-100 rtl:font-ar rtl:normal-case rtl:tracking-normal">
            {copy.tagline}
          </p>
          <p data-c className="mt-2 text-sm text-mute opacity-0 motion-reduce:opacity-100">{copy.city}</p>

          <p data-c className="mt-12 text-xs font-semibold tracking-[.25em] text-bone/60 opacity-0 motion-reduce:opacity-100 rtl:tracking-normal">
            {copy.brandsTitle}
          </p>
          <ul dir="ltr" className="mt-5 flex max-w-5xl flex-wrap justify-center gap-3 sm:gap-4">
            {brands.map((b) => (
              <li key={b.name} data-brand className="flex w-[72px] flex-col items-center gap-2 opacity-0 sm:w-[88px] motion-reduce:opacity-100">
                <span className="grid h-[60px] w-[60px] place-items-center rounded-full border border-bone/25 bg-ink/40 backdrop-blur-md sm:h-[76px] sm:w-[76px]">
                  {b.path ? (
                    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-bone sm:h-9 sm:w-9" role="img" aria-label={b.name}>
                      <path d={b.path} />
                    </svg>
                  ) : (
                    <span className="px-1 font-display text-[11px] font-extrabold uppercase leading-tight tracking-wide text-bone sm:text-[13px]">{b.name.split("-")[0]}</span>
                  )}
                </span>
                <span className="truncate text-[11px] text-bone/70">{b.name}</span>
              </li>
            ))}
          </ul>

          <Link data-enter href={{ pathname: "/", hash: "showroom" }} className="btn btn-primary mt-12 px-8 opacity-0 motion-reduce:opacity-100">
            {copy.enter}
            <IconArrow width={18} height={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
