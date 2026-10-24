export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { cars } from "@/lib/cars";
import { absoluteUrl } from "@/lib/contact";
import { localePath } from "@/lib/paths";

const pair = (path: string) => ({
  fr: absoluteUrl(localePath("fr", path || "/")),
  ar: absoluteUrl(localePath("ar", path || "/")),
});

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/cars", ...cars.map((c) => `/cars/${c.slug}`)];
  return paths.flatMap((p) => {
    const urls = pair(p);
    const entry = { lastModified: new Date(), alternates: { languages: urls } };
    return [
      { url: urls.fr, ...entry, priority: p ? 0.8 : 1 },
      { url: urls.ar, ...entry, priority: p ? 0.7 : 0.9 },
    ];
  });
}
