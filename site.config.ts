// Central brand/contact config. All values are PLACEHOLDERS — replace before launch.
export const siteConfig = {
  name: "MHD AUTO",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://mhd-auto.example.com", // PLACEHOLDER
  defaultLocale: "fr" as const,
  locales: ["fr", "ar"] as const,
  contact: {
    phone: "+213 555 00 00 00", // PLACEHOLDER
    phoneHref: "tel:+213555000000", // PLACEHOLDER
    whatsapp: "213555000000", // PLACEHOLDER — international format, digits only
    email: "contact@mhd-auto.example.com", // PLACEHOLDER
  },
  address: {
    street: { ar: "طريق وطني رقم 5", fr: "Route Nationale N°5" }, // PLACEHOLDER
    city: { ar: "الجزائر", fr: "Alger" }, // PLACEHOLDER
    wilaya: { ar: "ولاية الجزائر (16)", fr: "Wilaya d'Alger (16)" }, // PLACEHOLDER
    postalCode: "16000", // PLACEHOLDER
    country: "DZ",
    geo: { lat: 36.7538, lng: 3.0588 }, // PLACEHOLDER
    mapsEmbedUrl: "", // PLACEHOLDER — Google Maps embed src
  },
  hours: [
    // PLACEHOLDER — 24h format
    { days: "sat-thu", open: "09:00", close: "18:00" },
    { days: "fri", open: null, close: null },
  ],
  socials: {
    facebook: "https://facebook.com/", // PLACEHOLDER
    instagram: "https://instagram.com/", // PLACEHOLDER
    tiktok: "https://tiktok.com/", // PLACEHOLDER
    youtube: "", // PLACEHOLDER
  },
  currency: "DZD",
} as const;

export type SiteConfig = typeof siteConfig;
export type Locale = (typeof siteConfig.locales)[number];
