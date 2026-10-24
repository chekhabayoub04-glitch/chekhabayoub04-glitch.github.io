"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { carImage, carName, type Car } from "@/lib/cars";
import { formatDZD, formatNumber } from "@/lib/format";
import { useCarWhatsapp } from "./CarViewer";
import { IconExpand, IconWhatsApp } from "./Icons";

/** Inventory card. Hover crossfades side → interior; clicking the image opens the quick viewer. */
export default function CarCard({ car, onOpen }: { car: Car; onOpen?: (car: Car) => void }) {
  const locale = useLocale();
  const t = useTranslations("inventory");
  const tv = useTranslations("values");
  const ts = useTranslations("specs");
  const tViews = useTranslations("views");
  const wa = useCarWhatsapp();
  const photo = carImage(car, "exterior")!;
  const interior = carImage(car, "interior");

  return (
    <article data-flip-id={car.slug} className="group flex flex-col border border-line bg-surface transition-colors hover:border-[#3a3a40]">
      <button
        type="button"
        onClick={() => onOpen?.(car)}
        aria-label={`${tViews("exterior")} / ${tViews("interior")}: ${carName(car)}`}
        className="relative aspect-[16/10] cursor-zoom-in overflow-hidden bg-raised"
      >
        <Image src={photo.src} alt={`${carName(car)} ${car.year}`} fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ objectPosition: photo.focus }} />
        {interior && (
          <Image src={interior.src} alt="" fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 100vw" className="object-cover opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
        )}
        <span className="absolute start-3 top-3 flex gap-1.5">
          <span className={`px-2 py-1 text-[11px] font-bold ${car.condition === "new" ? "bg-signal text-white" : "bg-bone text-ink"}`}>{tv(`condition.${car.condition}`)}</span>
          <span className="bg-ink/70 px-2 py-1 text-[11px] font-semibold backdrop-blur">{tv(`body.${car.body_type}`)}</span>
        </span>
        <span className="absolute bottom-3 end-3 grid h-9 w-9 place-items-center bg-ink/70 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <IconExpand width={16} height={16} />
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl font-extrabold uppercase leading-none" dir="ltr">
            <Link href={`/cars/${car.slug}`} className="hover:text-white">
              {carName(car)}
            </Link>
          </h3>
          <span className="font-display text-lg font-bold text-mute" dir="ltr">
            {car.year}
          </span>
        </div>
        <p className="mt-1 truncate font-sans text-xs text-mute" dir="ltr">
          <span className="block text-start rtl:text-end">{car.trim}</span>
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-mute">
          <li>{tv(`fuel.${car.fuel}`)}</li>
          <li aria-hidden>·</li>
          <li>{tv(`gearbox.${car.gearbox}`)}</li>
          <li aria-hidden>·</li>
          <li>{ts("powerValue", { hp: car.power_hp })}</li>
          <li aria-hidden>·</li>
          <li>{ts("km", { km: formatNumber(car.mileage_km) })}</li>
        </ul>
        <p className="mt-4 font-display text-[26px] font-extrabold leading-none" dir="ltr">
          <span className="block text-start rtl:text-end">{formatDZD(car.price_dzd, locale)}</span>
        </p>
        <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 pt-1">
          <Link href={`/cars/${car.slug}`} className="btn btn-primary min-h-11 px-3 text-sm">
            {t("details")}
          </Link>
          <a href={wa(car)} target="_blank" rel="noopener noreferrer" className="btn btn-wa min-h-11 px-3 text-sm">
            <IconWhatsApp width={16} height={16} />
            {t("whatsapp")}
          </a>
        </div>
      </div>
    </article>
  );
}
