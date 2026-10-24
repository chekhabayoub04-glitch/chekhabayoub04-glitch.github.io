import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { carImage, carName, cars, description, getCar, similarCars } from "@/lib/cars";
import { formatDZD, formatNumber } from "@/lib/format";
import { absoluteUrl, whatsappUrl } from "@/lib/contact";
import { siteConfig } from "~/site.config";
import { alternates, localePath } from "@/lib/paths";
import CarMedia from "@/components/CarMedia";
import ContactForm from "@/components/ContactForm";
import CarCard from "@/components/CarCard";
import { JsonLd, breadcrumbLd, carLd } from "@/components/JsonLd";
import { IconArrow, IconPhone, IconWhatsApp } from "@/components/Icons";

type Params = Promise<{ locale: "ar" | "fr"; slug: string }>;

const carPath = (locale: string, slug: string) => localePath(locale, `/cars/${slug}`);

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => cars.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const car = getCar(slug);
  if (!car) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const tv = await getTranslations({ locale, namespace: "values" });
  const title = `${carName(car)} ${car.trim} ${car.year}`;
  const desc = t("carDescription", {
    car: carName(car),
    year: car.year,
    price: formatDZD(car.price_dzd, locale),
    fuel: tv(`fuel.${car.fuel}`),
    gearbox: tv(`gearbox.${car.gearbox}`),
    power: car.power_hp,
  });
  const img = carImage(car, "exterior")!.src;
  return {
    title,
    description: desc,
    alternates: alternates(locale, `/cars/${slug}`),
    openGraph: { type: "website", title, description: desc, url: carPath(locale, slug), images: [{ url: img, width: 1600, height: 900, alt: title }] },
  };
}

export default async function CarPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const car = getCar(slug);
  if (!car) notFound();

  const t = await getTranslations("detail");
  const ts = await getTranslations("specs");
  const tv = await getTranslations("values");
  const tc = await getTranslations("contact");
  const tn = await getTranslations("nav");
  const path = carPath(locale, slug);
  const price = formatDZD(car.price_dzd, locale);
  const wa = whatsappUrl(tc("waCar", { car: `${carName(car)} ${car.trim} ${car.year}`, price, url: absoluteUrl(path) }));

  const specs: [string, string, boolean?][] = [
    [ts("engine"), car.engine, true],
    [ts("power"), ts("powerValue", { hp: car.power_hp })],
    [ts("accel"), ts("accelValue", { s: car.accel_0_100 })],
    [ts("topSpeed"), `${car.top_speed_kmh} km/h`, true],
    [ts("gearbox"), tv(`gearbox.${car.gearbox}`)],
    [ts("fuel"), tv(`fuel.${car.fuel}`)],
    [ts("year"), String(car.year)],
    [ts("mileage"), ts("km", { km: formatNumber(car.mileage_km) })],
    [ts("color"), car.color[locale]],
    [ts("body"), tv(`body.${car.body_type}`)],
    [ts("condition"), tv(`condition.${car.condition}`)],
  ];

  return (
    <article className="veil pt-[72px]">
      <JsonLd data={carLd(car, locale, path)} />
      <JsonLd
        data={breadcrumbLd([
          { name: siteConfig.name, path: localePath(locale) },
          { name: tn("cars"), path: localePath(locale, "/cars") },
          { name: carName(car), path },
        ])}
      />

      <div className="container-x py-8 lg:py-12">
        <Link href="/cars" className="inline-flex items-center gap-2 text-sm text-mute transition-colors hover:text-bone">
          <IconArrow width={16} height={16} className="rotate-180" />
          {t("back")}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <CarMedia car={car} priority />

          <div className="flex flex-col">
            <p className="text-sm font-semibold text-mute">
              {tv(`body.${car.body_type}`)} · {tv(`condition.${car.condition}`)}
              {car.in_video && <span className="ms-2 bg-signal/15 px-2 py-0.5 text-xs text-signal-hi">{t("inVideo")}</span>}
            </p>
            <h1 className="mt-3 font-display text-[clamp(44px,5vw,76px)] font-black uppercase leading-[.9]" dir="ltr">
              <span className="block text-start rtl:text-end">
                {carName(car)} <span className="text-mute">{car.year}</span>
              </span>
            </h1>
            <p className="mt-2 font-sans text-mute" dir="ltr">
              <span className="block text-start rtl:text-end">{car.trim}</span>
            </p>
            <p className="mt-6 font-display text-5xl font-extrabold" dir="ltr">
              <span className="block text-start rtl:text-end">{price}</span>
            </p>
            <p className="mt-6 leading-8 text-bone/85">{description(car, locale)}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa flex-1">
                <IconWhatsApp width={18} height={18} />
                {tc("whatsapp")}
              </a>
              <a href={siteConfig.contact.phoneHref} className="btn btn-ghost flex-1">
                <IconPhone width={18} height={18} />
                {tc("call")}
              </a>
            </div>
            <a href="#reserve" className="btn btn-primary mt-3">
              {t("reserve")}
              <IconArrow width={18} height={18} />
            </a>
          </div>
        </div>

        <section aria-labelledby="specs-title" className="mt-16 grid gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_1.5fr]">
          <h2 id="specs-title" className="text-3xl font-black ltr:font-display ltr:uppercase">
            {t("specs")}
          </h2>
          <dl className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {specs.map(([k, v, ltr]) => (
              <div key={k} className="flex items-center justify-between gap-4 bg-ink px-4 py-4">
                <dt className="text-sm text-mute">{k}</dt>
                <dd className="text-sm font-semibold" dir={ltr ? "ltr" : undefined}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="reserve" aria-labelledby="reserve-title" className="mt-16 grid scroll-mt-24 gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <h2 id="reserve-title" className="text-3xl font-black ltr:font-display ltr:uppercase">
              {t("reserve")}
            </h2>
            <p className="mt-3 leading-8 text-mute">{t("reserveLede")}</p>
          </div>
          <div className="border border-line bg-surface p-5 sm:p-8">
            <ContactForm cars={cars.map(({ slug, brand, model, year }) => ({ slug, brand, model, year }))} defaultCar={car.slug} compact />
          </div>
        </section>

        <section aria-labelledby="similar-title" className="mt-16 border-t border-line pt-12">
          <h2 id="similar-title" className="text-3xl font-black ltr:font-display ltr:uppercase">
            {t("similar")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarCars(car).map((c) => (
              <CarCard key={c.slug} car={c} />
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
