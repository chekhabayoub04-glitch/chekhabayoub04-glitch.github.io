import type { Metadata } from "next";
import { siteConfig, type Locale } from "~/site.config";

/** Public path for a locale. Every locale is in the path: "/fr/cars", "/ar/cars". */
export function localePath(locale: string, path = "/") {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}/`;
}

/** canonical + hreflang alternates for a locale-independent path. */
export function alternates(locale: string, path = "/"): Metadata["alternates"] {
  const languages = Object.fromEntries(siteConfig.locales.map((l: Locale) => [l, localePath(l, path)]));
  return { canonical: localePath(locale, path), languages: { ...languages, "x-default": localePath(siteConfig.defaultLocale, path) } };
}
