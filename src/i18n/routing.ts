import { defineRouting } from "next-intl/routing";
import { siteConfig } from "~/site.config";

export const routing = defineRouting({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "always", // every page has its locale in the path: /fr/… and /ar/… (the root serves the French home)
  localeDetection: false,
});
