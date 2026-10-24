import { getTranslations } from "next-intl/server";
import { brands } from "@/lib/cars";
import { brandIcon } from "@/lib/brand-icons";
import { whatsappUrl } from "@/lib/contact";
import { hero } from "@/lib/video";
import HeroCinema from "./HeroCinema";

/** Server wrapper: gathers copy + data for the cinematic opening. */
export default async function Hero() {
  const t = await getTranslations();
  const segments = Object.fromEntries(hero.segments.map((s) => [s.id, t(`film.chapters.${s.id}`)]));

  return (
    <HeroCinema
      hero={hero}
      brands={brands.map((name) => ({ name, path: brandIcon(name)?.path }))}
      whatsapp={whatsappUrl(t("contact.waGeneric"))}
      copy={{
        eyebrow: t("hero.eyebrow"),
        line1: t("hero.line1"),
        line2: t("hero.line2"),
        glow: t("hero.glow"),
        lede: t("hero.lede"),
        ctaCars: t("hero.ctaCars"),
        ctaWhatsapp: t("hero.ctaWhatsapp"),
        rec: t("film.rec"),
        scroll: t("intro.scroll"),
        tagline: t("intro.tagline"),
        city: t("intro.city"),
        brandsTitle: t("intro.brands"),
        enter: t("intro.cta"),
        segments,
        videoLabel: t("a11y.videoLabel"),
      }}
    />
  );
}
