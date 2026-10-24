"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Site-wide text choreography, driven by markup:
 *  - `main h2` / `[data-split]`  → masked rise: letters in French, whole words in Arabic (keeps letters joined)
 *  - `.eyebrow`, `.index-tag`    → "decode" scramble (FR) / light wipe (AR)
 *  - `[data-reveal]`             → blur-to-sharp rise, batched as they enter
 *  - `[data-count]`              → numbers count up
 * Elements opt out with `data-no-split`. Does nothing under prefers-reduced-motion.
 */
export default function TextFX() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
    const ar = locale === "ar";
    const enter = (trigger: Element) => ({ trigger, start: "top 88%", once: true });
    const ctx = gsap.context(() => {});

    // Set up after the first paint settles (keeps splitting work out of the critical window).
    const setup = () => ctx.add(() => {
      gsap.utils.toArray<HTMLElement>("main h2:not([data-no-split]), [data-split]").forEach((el) => {
        const split = SplitText.create(el, { type: ar ? "words" : "words,chars", mask: "words", aria: "auto" });
        gsap.from(ar ? split.words : split.chars, {
          yPercent: 115,
          rotate: ar ? 0 : 8,
          opacity: 0,
          duration: 1.15,
          ease: "expo.out",
          stagger: ar ? 0.07 : 0.022,
          scrollTrigger: enter(el),
        });
      });

      gsap.utils.toArray<HTMLElement>("main .eyebrow, main .index-tag").forEach((el) => {
        if (ar || !el.textContent?.trim()) {
          gsap.from(el, { clipPath: "inset(0 0 0 100%)", duration: 1, ease: "power3.out", scrollTrigger: enter(el) });
          return;
        }
        gsap.to(el, {
          scrambleText: { text: el.textContent, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·", speed: 0.5, revealDelay: 0.15 },
          duration: 1.2,
          ease: "none",
          scrollTrigger: enter(el),
        });
      });

      const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(reveals, { opacity: 0, y: 36, filter: "blur(8px)" });
      ScrollTrigger.batch(reveals, {
        start: "top 90%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "expo.out", stagger: 0.09, clearProps: "filter" }),
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count);
        if (!Number.isFinite(to)) return;
        const o = { v: 0 };
        gsap.to(o, {
          v: to,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: enter(el),
          onUpdate: () => (el.textContent = String(Math.round(o.v))),
        });
      });
    });
    let id = 0;
    if (typeof window.requestIdleCallback === "function") id = window.requestIdleCallback(() => setup(), { timeout: 1500 });
    else id = window.setTimeout(setup, 600);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      window.cancelIdleCallback?.(id);
      window.clearTimeout(id);
      ctx.revert();
    };
  }, [pathname, locale]);

  return null;
}
