"use client";

import { useEffect, useRef, useState } from "react";

const SEEN = "mhd-intro-seen";
const SRC = { portrait: "/media/intro/intro-mobile.mp4", landscape: "/media/intro/intro-desktop.mp4" };
const START_TIMEOUT = 6000; // still nothing to show by then (very slow network): skip straight to the hero
const MAX_LENGTH = 15000;
const FADE = 1400; // fog swallows the last frame, then the fog itself clears onto the hero
const HANDOFF = 0.9; // seconds before the end: start the hand-off while the camera is still pushing in

// Runs before first paint: decides whether the intro plays, so returning visitors never see a black flash.
// "intro-on" pauses the hero's entrance animations until the film hands over. "?intro" forces it (testing, sharing).
const decide = `(function(){try{var d=document.documentElement,c=navigator.connection||{};
var off=!/[?&]intro/.test(location.search)&&(sessionStorage.getItem("${SEEN}")||location.hash)||c.saveData||/2g/.test(c.effectiveType||"")||matchMedia("(prefers-reduced-motion: reduce)").matches;
d.classList.add(off?"intro-off":"intro-on")}catch(e){document.documentElement.classList.add("intro-off")}})()`;

const load = `(function(){if(!document.documentElement.classList.contains("intro-on"))return;var v=document.querySelector("#intro video");
v.muted=true;v.src=matchMedia("(orientation: portrait)").matches?"${SRC.portrait}":"${SRC.landscape}";var p=v.play();p&&p.catch(function(){})})()`;

/** Opening film (black → headlights → dust → push through the fog), played once per session above the hero. */
export default function IntroFilm({ enter }: { enter: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"playing" | "tap" | "leaving" | "gone">("playing");

  useEffect(() => {
    const root = document.documentElement;
    const v = video.current;
    if (!v || !root.classList.contains("intro-on")) {
      setState("gone");
      return;
    }
    window.__lenis?.stop();
    window.scrollTo(0, 0);

    let done = false;
    const timers: number[] = [];
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {
        /* private mode: the intro simply plays again next visit */
      }
      window.scrollTo(0, 0);
      root.classList.remove("intro-on"); // hero headline starts rising as the fog clears
      setState("leaving");
      timers.push(window.setTimeout(() => {
        setState("gone");
        window.__lenis?.start();
        window.dispatchEvent(new Event("intro:done")); // hero frames start only once the fog has cleared, never mid-fade
      }, FADE));
    };

    // Autoplay refused (iPhone Low Power Mode, data saver): keep the black stage and let one tap start the film.
    const play = () => v.play().then(() => setState("playing"), () => setState("tap"));
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    let fallback = portrait; // portrait file missing → try the landscape one before giving up
    v.onerror = () => {
      if (!fallback) return finish();
      fallback = false;
      v.src = SRC.landscape;
      play();
    };
    v.onended = finish;
    v.ontimeupdate = () => v.duration - v.currentTime < HANDOFF && finish();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    v.onplaying = () => timers.push(window.setTimeout(finish, MAX_LENGTH));
    if (!v.getAttribute("src")) v.src = portrait ? SRC.portrait : SRC.landscape; // usually already set by the early script
    if (v.error) v.dispatchEvent(new Event("error"));
    play();
    timers.push(window.setTimeout(() => v.readyState < 2 && !v.paused && finish(), START_TIMEOUT));
    (window as Window & { __playIntro?: () => void }).__playIntro = () => void v.play().then(() => setState("playing"), finish);

    return () => {
      done = true;
      timers.forEach(clearTimeout);
      v.onerror = v.onended = v.onplaying = v.ontimeupdate = null;
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start();
    };
  }, []);

  if (state === "gone") return <script dangerouslySetInnerHTML={{ __html: decide }} suppressHydrationWarning />;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} suppressHydrationWarning />
      <div
        id="intro"
        className={`fixed inset-0 z-[90] touch-none overflow-hidden bg-black transition-opacity ease-in-out ${state === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"}`}
        style={{ transitionDuration: `${FADE * 0.6}ms`, transitionDelay: state === "leaving" ? `${FADE * 0.4}ms` : "0ms" }}
      >
        <video
          ref={video}
          aria-hidden
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] ease-in ${state === "leaving" ? "scale-[1.35]" : ""}`}
          style={{ transitionDuration: `${FADE}ms` }}
        />
        {/* Start the download before hydration: on phones the JS bundle would otherwise hold the film back ~1s */}
        <script dangerouslySetInnerHTML={{ __html: load }} suppressHydrationWarning />
        {/* Fog wipe: the push-in ends inside a cloud of the same smoke, which then thins out onto the hero */}
        <div
          className={`pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_55%,rgba(150,158,166,.9),rgba(40,44,48,.95)_70%,#0a0a0b)] transition-opacity ease-out ${state === "leaving" ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDuration: `${FADE * 0.45}ms` }}
        />
        {state === "tap" && (
          <button
            type="button"
            onClick={() => (window as Window & { __playIntro?: () => void }).__playIntro?.()}
            className="absolute inset-0 grid place-items-center"
          >
            <span className="flex flex-col items-center gap-5">
              <span dir="ltr" className="flex items-center gap-2 font-display text-5xl font-black text-white">
                MHD <span className="bg-signal px-2 py-0.5 text-base tracking-[.18em]">AUTO</span>
              </span>
              <span className="min-h-11 rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white">{enter}</span>
            </span>
          </button>
        )}
      </div>
    </>
  );
}
