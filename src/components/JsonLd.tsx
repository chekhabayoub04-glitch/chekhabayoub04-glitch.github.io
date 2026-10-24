import { siteConfig } from "~/site.config";
import { absoluteUrl } from "@/lib/contact";
import { localePath } from "@/lib/paths";
import { carName, carImage, description, type Car } from "@/lib/cars";

const DAY_MAP: Record<string, string[]> = {
  "sat-thu": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
  fri: ["Friday"],
};

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function dealerLd(locale: "ar" | "fr") {
  const { address, contact, socials, hours } = siteConfig;
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": absoluteUrl("/#dealer"),
    name: siteConfig.name,
    url: absoluteUrl(localePath(locale)),
    telephone: contact.phone,
    email: contact.email,
    image: absoluteUrl("/media/posters/ch1-exterior.webp"),
    priceRange: "DZD",
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street[locale],
      addressLocality: address.city[locale],
      addressRegion: address.wilaya[locale],
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: address.geo.lat, longitude: address.geo.lng },
    openingHoursSpecification: hours
      .filter((h) => h.open)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_MAP[h.days], opens: h.open, closes: h.close })),
    sameAs: Object.values(socials).filter(Boolean),
  };
}

export function carLd(car: Car, locale: "ar" | "fr", path: string) {
  return {
    "@context": "https://schema.org",
    "@type": ["Car", "Product"],
    name: `${carName(car)} ${car.trim} ${car.year}`,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    productionDate: String(car.year),
    color: car.color[locale],
    bodyType: car.body_type,
    fuelType: car.fuel,
    vehicleTransmission: car.gearbox,
    itemCondition: car.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileage_km, unitCode: "KMT" },
    vehicleEngine: { "@type": "EngineSpecification", name: car.engine, enginePower: { "@type": "QuantitativeValue", value: car.power_hp, unitCode: "BHP" } },
    speed: { "@type": "QuantitativeValue", maxValue: car.top_speed_kmh, unitCode: "KMH" },
    image: car.images.map((i) => absoluteUrl(i.src)),
    description: description(car, locale),
    url: absoluteUrl(path),
    offers: {
      "@type": "Offer",
      price: car.price_dzd,
      priceCurrency: siteConfig.currency,
      availability: "https://schema.org/InStock",
      seller: { "@id": absoluteUrl("/#dealer") },
      image: absoluteUrl(carImage(car, "exterior")?.src ?? ""),
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}
