"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { carImage, carName, type Car, type ImageKind } from "@/lib/cars";
import { formatDZD } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/motion";
import CarViewer, { useCarWhatsapp } from "./CarViewer";
import SpecGrid from "./SpecGrid";
import { IconArrow, IconChevron, IconExpand, IconWhatsApp } from "./Icons";

/** One car at a time, full-bleed: real photo, giant model name, spec bar, thumbnails. */
export default function Showroom({ cars }: { cars: Car[] }) {
  const locale = useLocale();
  const t = useTranslations("showroom");
  const tv = useTranslations("values");
  const tViews = useTranslations("views");
  const wa = useCarWhatsapp();
  const [i, setI] = useState(0);
  const [viewer, setViewer] = useState<{ car: Car; kind: ImageKind } | null>(null);
  const dir = useRef(1);
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  const car = cars[i];
  const n = cars.length;
  const go = useCallback(
    (k: number, d: number) => {
      dir.current = d;
      setI((k + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (!stage.current) return;
    strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (prefersReducedMotion()) return;
    const rtl = document.dir === "rtl" ? -1 : 1;
    const q = gsap.utils.selector(stage.current);
    const tl = gsap.timeline();
    tl.fromTo(q("[data-photo]"), { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" }, 0)
      .fromTo(q("[data-name]"), { xPercent: 8 * dir.current * rtl, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.1, ease: "expo.out" }, 0.05)
      .fromTo(q("[data-info]"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.06 }, 0.15);
    return () => {
      tl.kill();
    };
  }, [i]);

  const onKey = (e: React.KeyboardEvent) => {
    const rtl = document.dir === "rtl";
    if (e.key === "ArrowRight") go(i + (rtl ? -1 : 1), rtl ? -1 : 1);
    if (e.key === "ArrowLeft") go(i + (rtl ? 1 : -1), rtl ? 1 : -1);
  };

  const photo = carImage(car, "exterior")!;

  return (
    <section id="showroom" aria-labelledby="showroom-title" className="relative overflow-hidden pt-24 lg:pt-32">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{t("kicker")}</p>
          <h2 id="showroom-title" className="mt-4 text-[clamp(40px,6vw,104px)] font-black leading-[1.02] ltr:font-display ltr:uppercase ltr:leading-[.9]">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-mute lg:text-base">{t("lede")}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl font-bold text-mute" dir="ltr">
            <span className="text-bone">{String(i + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          </span>
          <button type="button" onClick={() => go(i - 1, -1)} aria-label={t("prev")} className="grid h-14 w-14 place-items-center rounded-full border border-line transition-colors hover:border-bone">
            <IconChevron className="rotate-180 rtl:rotate-0" />
          </button>
          <button type="button" onClick={() => go(i + 1, 1)} aria-label={t("next")} className="grid h-14 w-14 place-items-center rounded-full border border-line transition-colors hover:border-bone">
            <IconChevron className="rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div ref={stage} role="group" aria-roledescription="carousel" aria-label={t("title")} tabIndex={0} onKeyDown={onKey} className="relative mt-8 outline-none">
        <p className="sr-only" aria-live="polite">
          {t("counter", { current: i + 1, total: n })}: {carName(car)}
        </p>

        <div className="relative overflow-hidden lg:h-[min(82svh,860px)] lg:min-h-[600px]">
          <div className="relative h-[54svh] min-h-[320px] lg:absolute lg:inset-0 lg:h-auto">
          {/* giant model name behind the car */}
          <p data-name aria-hidden dir="ltr" className="pointer-events-none absolute inset-x-0 top-[3%] z-[1] select-none whitespace-nowrap text-center font-display text-[clamp(88px,19vw,340px)] font-black uppercase leading-none tracking-tight text-white/80 mix-blend-overlay">
            {car.model}
          </p>

          <button type="button" onClick={() => setViewer({ car, kind: "exterior" })} aria-label={`${t("open")}: ${carName(car)}`} className="group absolute inset-0 cursor-zoom-in">
            <span data-photo className="absolute inset-0 block">
              <Image
                key={photo.src}
                src={photo.src}
                alt={`${carName(car)} ${car.year}`}
                fill
                sizes="100vw"
                className="object-cover brightness-[.82] [mask-image:radial-gradient(120%_95%_at_50%_45%,#000_55%,transparent_100%)]"
                style={{ objectPosition: photo.focus ?? "50% 55%" }}
              />
            </span>
            <span className="absolute end-[4%] top-[12%] z-[2] flex items-center gap-2 border border-bone/30 bg-ink/60 px-3 py-2 text-xs font-semibold backdrop-blur transition-colors group-hover:border-bone">
              <IconExpand width={14} height={14} />
              {t("open")}
            </span>
          </button>
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_top,#0a0a0b_2%,transparent_35%)] lg:bg-[linear-gradient(to_top,#0a0a0b_4%,rgba(10,10,11,.8)_32%,transparent_60%)]" />
          </div>

          {/* info */}
          <div className="container-x pointer-events-none relative z-[2] -mt-6 pb-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
            <div className="flex flex-wrap items-end justify-between gap-4" data-info>
              <div>
                <p className="text-sm font-semibold text-bone/70">
                  {car.brand} · {tv(`body.${car.body_type}`)} · {tv(`condition.${car.condition}`)}
                </p>
                <h3 className="mt-1 font-display text-[clamp(40px,5.4vw,88px)] font-black uppercase leading-[.9]" dir="ltr">
                  <span className="block text-start rtl:text-end">
                    {car.model} <span className="text-bone/50">{car.year}</span>
                  </span>
                </h3>
              </div>
              <div className="text-end">
                <p className="text-xs font-semibold text-bone/60" dir="ltr">
                  {car.trim}
                </p>
                <p className="font-display text-[clamp(32px,3.4vw,56px)] font-extrabold leading-none" dir="ltr">
                  {formatDZD(car.price_dzd, locale)}
                </p>
              </div>
            </div>
            <div data-info>
              <SpecGrid
                car={car}
                keys={["engine", "power", "accel", "topSpeed", "gearbox", "fuel"]}
                className="mt-6 grid-cols-2 border border-white/10 bg-ink/60 backdrop-blur-md sm:grid-cols-3 lg:grid-cols-6 [&>div:nth-child(n+3)]:border-t sm:[&>div:nth-child(n+3)]:border-t-0 sm:[&>div:nth-child(n+4)]:border-t lg:[&>div]:!border-t-0"
              />
            </div>
            <div data-info className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={`/cars/${car.slug}`} className="btn btn-primary">
                {t("details")}
                <IconArrow width={18} height={18} />
              </Link>
              <a href={wa(car)} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                <IconWhatsApp width={18} height={18} />
                {t("whatsapp")}
              </a>
              <div className="flex gap-2 sm:ms-auto">
                {(["profile", "rear", "interior"] as const)
                  .filter((k) => carImage(car, k))
                  .map((k) => (
                    <button key={k} type="button" onClick={() => setViewer({ car, kind: k })} className="chip flex-1 justify-center bg-ink/50 backdrop-blur sm:flex-none">
                      {tViews(k)}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div ref={strip} className="no-scrollbar container-x mt-6 flex gap-2 overflow-x-auto pb-2" data-lenis-prevent>
          {cars.map((c, k) => (
            <button
              key={c.slug}
              type="button"
              data-i={k}
              aria-pressed={k === i}
              aria-label={carName(c)}
              onClick={() => go(k, k > i ? 1 : -1)}
              className={`group w-[176px] shrink-0 border text-start transition-colors ${k === i ? "border-bone" : "border-line hover:border-mute"}`}
            >
              <span className="relative block aspect-[16/10] overflow-hidden">
                <Image src={carImage(c, "exterior")!.src} alt="" fill sizes="176px" className={`object-cover transition-[opacity,transform] duration-500 group-hover:scale-105 ${k === i ? "opacity-100" : "opacity-55 group-hover:opacity-90"}`} />
              </span>
              <span className={`block truncate px-2.5 py-2 text-xs font-semibold ${k === i ? "text-bone" : "text-mute group-hover:text-bone"}`} dir="ltr">
                {carName(c)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="container-x mt-10 pb-8 text-center">
        <Link href="/cars" className="btn btn-ghost">
          {t("viewAll")}
          <IconArrow width={18} height={18} />
        </Link>
      </div>

      <CarViewer car={viewer?.car ?? null} initial={viewer?.kind ?? "exterior"} onClose={() => setViewer(null)} />
    </section>
  );
}
