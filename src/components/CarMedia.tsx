"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { carName, viewerImages, type Car, type ImageKind } from "@/lib/cars";

/** Tabbed image viewer: side / interior / showroom stills. Arrow keys move between tabs. */
export default function CarMedia({ car, initial = "exterior", priority = false }: { car: Car; initial?: ImageKind; priority?: boolean }) {
  const t = useTranslations("views");
  const td = useTranslations("detail");
  const images = viewerImages(car);
  const start = Math.max(0, images.findIndex((i) => i.kind === initial));
  const [active, setActive] = useState(start);
  const uid = useId();
  const img = images[active];

  const onKey = (e: React.KeyboardEvent) => {
    const rtl = document.dir === "rtl";
    const next = e.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const prev = e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    if (!next && !prev) return;
    e.preventDefault();
    const n = (active + (next ? 1 : -1) + images.length) % images.length;
    setActive(n);
    document.getElementById(`${uid}-tab-${n}`)?.focus();
  };

  return (
    <div>
      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${active}`}
        className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(80%_80%_at_50%_40%,#202024,#0a0a0b)]"
      >
        {images.map((im, i) => (
          <Image
            key={im.src}
            src={im.src}
            alt={`${carName(car)} — ${t(im.kind)}`}
            fill
            priority={priority && i === start}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className={`${im.kind === "gallery" ? "object-contain" : "object-cover"} transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
            style={{ objectPosition: im.focus }}
          />
        ))}
        <span className="absolute bottom-3 start-3 bg-ink/70 px-2.5 py-1 text-xs font-semibold backdrop-blur">{t(img.kind)}</span>
      </div>
      {img.credit && (
        <p className="mt-2 truncate text-[11px] text-mute">
          <a href={img.credit.url} target="_blank" rel="noopener noreferrer license" className="underline-offset-2 hover:text-bone hover:underline">
            {td("credit", { author: img.credit.author, license: img.credit.license })}
          </a>
        </p>
      )}

      <div role="tablist" aria-label={carName(car)} className="mt-3 grid grid-cols-4 gap-2" onKeyDown={onKey}>
        {images.map((im, i) => (
          <button
            key={im.src}
            id={`${uid}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${uid}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`group relative aspect-[16/10] overflow-hidden border text-start transition-colors ${i === active ? "border-bone" : "border-line hover:border-mute"}`}
          >
            <Image src={im.src} alt="" fill sizes="200px" className="object-cover opacity-80 transition-opacity group-hover:opacity-100" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent px-2 pb-1.5 pt-5 text-xs font-semibold">{t(im.kind)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
