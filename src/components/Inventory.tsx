"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useLocale, useTranslations } from "next-intl";
import { BODY_TYPES, CONDITIONS, FUELS, GEARBOXES, carName, type Car, type ImageKind } from "@/lib/cars";
import { formatDZD } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/motion";
import CarCard from "./CarCard";
import CarViewer from "./CarViewer";
import { IconFilter, IconSearch } from "./Icons";

type Sort = "recommended" | "priceAsc" | "priceDesc" | "yearDesc" | "mileageAsc";
type Filters = {
  q: string;
  body: string[];
  brand: string[];
  fuel: string[];
  gearbox: string[];
  condition: string[];
  yearMin: number | null;
  priceMax: number | null;
  sort: Sort;
};

const EMPTY: Filters = { q: "", body: [], brand: [], fuel: [], gearbox: [], condition: [], yearMin: null, priceMax: null, sort: "recommended" };
const SORTS: Sort[] = ["recommended", "priceAsc", "priceDesc", "yearDesc", "mileageAsc"];
const PRICE_STEPS = [4_000_000, 6_000_000, 9_000_000, 12_000_000];

// Defined at module level so chips keep keyboard focus across re-renders.
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="mb-3 text-xs font-semibold tracking-wide text-mute">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function apply(cars: Car[], f: Filters) {
  const q = f.q.trim().toLowerCase();
  const out = cars.filter(
    (c) =>
      (!q || `${carName(c)} ${c.trim} ${c.year}`.toLowerCase().includes(q)) &&
      (!f.body.length || f.body.includes(c.body_type)) &&
      (!f.brand.length || f.brand.includes(c.brand)) &&
      (!f.fuel.length || f.fuel.includes(c.fuel)) &&
      (!f.gearbox.length || f.gearbox.includes(c.gearbox)) &&
      (!f.condition.length || f.condition.includes(c.condition)) &&
      (f.yearMin == null || c.year >= f.yearMin) &&
      (f.priceMax == null || c.price_dzd <= f.priceMax),
  );
  const by: Record<Sort, (a: Car, b: Car) => number> = {
    recommended: (a, b) => Number(b.featured) - Number(a.featured) || Number(b.in_video) - Number(a.in_video),
    priceAsc: (a, b) => a.price_dzd - b.price_dzd,
    priceDesc: (a, b) => b.price_dzd - a.price_dzd,
    yearDesc: (a, b) => b.year - a.year,
    mileageAsc: (a, b) => a.mileage_km - b.mileage_km,
  };
  return [...out].sort(by[f.sort]);
}

export default function Inventory({ cars, headingLevel = "h2" }: { cars: Car[]; headingLevel?: "h1" | "h2" }) {
  const locale = useLocale();
  const t = useTranslations("inventory");
  const tv = useTranslations("values");
  const [f, setF] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [viewer, setViewer] = useState<{ car: Car; kind: ImageKind } | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const results = useMemo(() => apply(cars, f), [cars, f]);
  const brands = useMemo(() => [...new Set(cars.map((c) => c.brand))].sort(), [cars]);
  const years = useMemo(() => [...new Set(cars.map((c) => c.year))].sort((a, b) => b - a), [cars]);
  const count = (key: keyof Car, value: string) => cars.filter((c) => c[key] === value).length;

  const update = (patch: Partial<Filters>) => {
    if (grid.current && !prefersReducedMotion()) {
      gsap.registerPlugin(Flip);
      flipState.current = Flip.getState(grid.current.querySelectorAll("[data-flip-id]"));
    }
    setF((prev) => ({ ...prev, ...patch }));
  };
  const toggle = (key: "body" | "brand" | "fuel" | "gearbox" | "condition", v: string) =>
    update({ [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] });

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !grid.current) return;
    flipState.current = null;
    Flip.from(state, {
      targets: grid.current.querySelectorAll("[data-flip-id]"),
      duration: 0.6,
      ease: "power3.inOut",
      stagger: 0.02,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }),
    });
  }, [results]);

  const active = f.body.length + f.brand.length + f.fuel.length + f.gearbox.length + f.condition.length + (f.yearMin ? 1 : 0) + (f.priceMax ? 1 : 0) + (f.q ? 1 : 0);
  const Heading = headingLevel;

  return (
    <section id="cars" aria-labelledby="inventory-title" className="container-x scroll-mt-20 py-20 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{t("kicker")}</p>
          <Heading id="inventory-title" className="mt-4 text-[clamp(34px,4.4vw,64px)] font-black leading-tight ltr:font-display ltr:uppercase">
            {t("title", { count: cars.length })}
          </Heading>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button type="button" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} aria-controls="filters" className="btn btn-ghost min-h-12 flex-1 lg:hidden">
            <IconFilter width={18} height={18} />
            {showFilters ? t("hideFilters") : t("showFilters")}
            {active > 0 && <span className="bg-signal px-1.5 text-xs text-white">{active}</span>}
          </button>
          <label className="flex flex-1 items-center gap-2 text-sm text-mute sm:flex-none">
            <span className="sr-only sm:not-sr-only">{t("sort")}</span>
            <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })} className="field min-h-12 cursor-pointer">
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sortOptions.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside id="filters" className={`${showFilters ? "block" : "hidden"} space-y-5 lg:sticky lg:top-24 lg:block lg:self-start`} aria-label={t("filters")}>
          <label className="relative block">
            <span className="sr-only">{t("search")}</span>
            <IconSearch width={18} height={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
            <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder={t("search")} className="field ps-10" />
          </label>

          <Group label={t("type")}>
            {BODY_TYPES.filter((b) => count("body_type", b)).map((b) => (
              <button key={b} type="button" className="chip" aria-pressed={f.body.includes(b)} onClick={() => toggle("body", b)}>
                {tv(`body.${b}`)} <span className="text-xs opacity-60">{count("body_type", b)}</span>
              </button>
            ))}
          </Group>

          <Group label={t("brand")}>
            {brands.map((b) => (
              <button key={b} type="button" className="chip" dir="ltr" aria-pressed={f.brand.includes(b)} onClick={() => toggle("brand", b)}>
                {b} <span className="text-xs opacity-60">{count("brand", b)}</span>
              </button>
            ))}
          </Group>

          <Group label={t("condition")}>
            {CONDITIONS.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={f.condition.includes(c)} onClick={() => toggle("condition", c)}>
                {tv(`condition.${c}`)} <span className="text-xs opacity-60">{count("condition", c)}</span>
              </button>
            ))}
          </Group>

          <Group label={t("fuel")}>
            {FUELS.filter((x) => count("fuel", x)).map((x) => (
              <button key={x} type="button" className="chip" aria-pressed={f.fuel.includes(x)} onClick={() => toggle("fuel", x)}>
                {tv(`fuel.${x}`)}
              </button>
            ))}
          </Group>

          <Group label={t("gearbox")}>
            {GEARBOXES.map((x) => (
              <button key={x} type="button" className="chip" aria-pressed={f.gearbox.includes(x)} onClick={() => toggle("gearbox", x)}>
                {tv(`gearbox.${x}`)}
              </button>
            ))}
          </Group>

          <div className="grid grid-cols-2 gap-3 border-t border-line pt-5">
            <label className="text-xs font-semibold text-mute">
              {t("year")}
              <select value={f.yearMin ?? ""} onChange={(e) => update({ yearMin: e.target.value ? Number(e.target.value) : null })} className="field mt-2 cursor-pointer text-sm">
                <option value="">{t("any")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-mute">
              {t("price")}
              <select value={f.priceMax ?? ""} onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : null })} className="field mt-2 cursor-pointer text-sm">
                <option value="">{t("any")}</option>
                {PRICE_STEPS.map((p) => (
                  <option key={p} value={p}>
                    {formatDZD(p, locale)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {active > 0 && (
            <button type="button" onClick={() => update({ ...EMPTY, sort: f.sort })} className="text-sm font-semibold text-signal-hi underline-offset-4 hover:underline">
              {t("reset")}
            </button>
          )}
          <p className="text-xs leading-6 text-mute">{t("placeholderNote")}</p>
        </aside>

        <div>
          <p className="mb-4 text-sm text-mute" aria-live="polite">
            {t("results", { count: results.length })}
          </p>
          {results.length === 0 ? (
            <p className="border border-dashed border-line p-10 text-center leading-8 text-mute">{t("empty")}</p>
          ) : (
            <div ref={grid} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((c) => (
                <CarCard key={c.slug} car={c} onOpen={(car) => setViewer({ car, kind: "exterior" })} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CarViewer car={viewer?.car ?? null} initial={viewer?.kind ?? "exterior"} onClose={() => setViewer(null)} />
    </section>
  );
}
