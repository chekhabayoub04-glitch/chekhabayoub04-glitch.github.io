"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { carName, type Car, type ImageKind } from "@/lib/cars";
import { formatDZD } from "@/lib/format";
import { absoluteUrl, whatsappUrl } from "@/lib/contact";
import { localePath } from "@/lib/paths";
import CarMedia from "./CarMedia";
import SpecGrid from "./SpecGrid";
import { IconArrow, IconClose, IconWhatsApp } from "./Icons";

export function useCarWhatsapp() {
  const locale = useLocale();
  const tc = useTranslations("contact");
  return (car: Car) =>
    whatsappUrl(
      tc("waCar", {
        car: `${carName(car)} ${car.trim} ${car.year}`,
        price: formatDZD(car.price_dzd, locale),
        url: absoluteUrl(localePath(locale, `/cars/${car.slug}`)),
      }),
    );
}

/** Modal quick view (native <dialog>: focus trap, Esc, inert background). */
export default function CarViewer({ car, initial, onClose }: { car: Car | null; initial: ImageKind; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const locale = useLocale();
  const t = useTranslations("showroom");
  const ta = useTranslations("a11y");
  const tv = useTranslations("values");
  const wa = useCarWhatsapp();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (car && !d.open) {
      d.showModal();
      window.__lenis?.stop();
    }
    if (!car && d.open) d.close();
    return () => window.__lenis?.start();
  }, [car]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="viewer-title"
      className="m-auto max-h-[92svh] w-[min(1180px,94vw)] overflow-y-auto border border-line bg-ink p-0 text-bone backdrop:bg-black/80 backdrop:backdrop-blur-sm open:animate-[fade-up_.4s_var(--ease-out-expo)]"
      data-lenis-prevent
    >
      {car && (
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.55fr_1fr] lg:gap-10 lg:p-8">
          <CarMedia key={`${car.slug}-${initial}`} car={car} initial={initial} />
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-mute">
                  {tv(`body.${car.body_type}`)} · {tv(`condition.${car.condition}`)} · {car.year}
                </p>
                <h2 id="viewer-title" className="mt-2 font-display text-4xl font-black uppercase leading-none" dir="ltr">
                  <span className="block text-start rtl:text-end">{carName(car)}</span>
                </h2>
                <p className="mt-1 font-sans text-sm text-mute" dir="ltr">
                  <span className="block text-start rtl:text-end">{car.trim}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label={ta("close")} className="grid h-11 w-11 shrink-0 place-items-center border border-line hover:border-bone">
                <IconClose />
              </button>
            </div>
            <p className="mt-5 font-display text-4xl font-extrabold text-bone" dir="ltr">
              <span className="block text-start rtl:text-end">{formatDZD(car.price_dzd, locale)}</span>
            </p>
            <SpecGrid car={car} keys={["engine", "power", "gearbox", "fuel", "year", "mileage"]} className="mt-6 grid-cols-2 gap-x-6 gap-y-5" compact />
            <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
              <Link href={`/cars/${car.slug}`} className="btn btn-primary flex-1">
                {t("details")}
                <IconArrow width={18} height={18} />
              </Link>
              <a href={wa(car)} target="_blank" rel="noopener noreferrer" className="btn btn-wa flex-1">
                <IconWhatsApp width={18} height={18} />
                {t("whatsapp")}
              </a>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
