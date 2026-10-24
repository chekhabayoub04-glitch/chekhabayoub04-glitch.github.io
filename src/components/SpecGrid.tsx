"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { Car } from "@/lib/cars";
import { IconBolt, IconCalendar, IconEngine, IconFuel, IconGauge, IconGearbox, IconRoad, IconTimer } from "./Icons";

type Key = "engine" | "power" | "accel" | "topSpeed" | "gearbox" | "fuel" | "year" | "mileage";

const ICONS = { engine: IconEngine, power: IconBolt, accel: IconTimer, topSpeed: IconGauge, gearbox: IconGearbox, fuel: IconFuel, year: IconCalendar, mileage: IconRoad };

export function useSpecValue() {
  const t = useTranslations("specs");
  const tv = useTranslations("values");
  return (car: Car, k: Key): string => {
    switch (k) {
      case "engine": return car.engine;
      case "power": return t("powerValue", { hp: car.power_hp });
      case "accel": return t("accelValue", { s: car.accel_0_100 });
      case "topSpeed": return `${car.top_speed_kmh} km/h`;
      case "gearbox": return tv(`gearbox.${car.gearbox}`);
      case "fuel": return tv(`fuel.${car.fuel}`);
      case "year": return String(car.year);
      case "mileage": return t("km", { km: formatNumber(car.mileage_km) });
    }
  };
}

/** Icon spec row/grid used by the showroom stage, viewer and cards. */
export default function SpecGrid({ car, keys, className = "", compact = false }: { car: Car; keys: Key[]; className?: string; compact?: boolean }) {
  const t = useTranslations("specs");
  const value = useSpecValue();
  return (
    <dl className={`grid ${className}`}>
      {keys.map((k) => {
        const Icon = ICONS[k];
        return (
          <div key={k} className={`flex flex-col gap-1.5 ${compact ? "" : "border-line px-4 py-3 [&:not(:first-child)]:border-s"}`}>
            <dt className="flex items-center gap-2 text-xs text-mute">
              <Icon width={16} height={16} className="text-signal-hi" />
              {t(k)}
            </dt>
            <dd className="text-sm font-semibold" dir={k === "engine" || k === "topSpeed" ? "ltr" : undefined}>
              <span className={k === "engine" || k === "topSpeed" ? "block text-start rtl:text-end" : ""}>{value(car, k)}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
