import { getLocale, getTranslations } from "next-intl/server";
import { siteConfig } from "~/site.config";
import { tour } from "@/lib/video";
import ShowroomTour from "./ShowroomTour";
import type { SERVICE_ICONS } from "./Icons";

/** Server wrapper for the scroll-driven showroom tour (services + visit info). */
export default async function Tour() {
  const locale = (await getLocale()) as "fr" | "ar";
  const t = await getTranslations();
  const services = t.raw("services.items") as { key: keyof typeof SERVICE_ICONS; title: string; text: string }[];
  const { address, hours } = siteConfig;

  return (
    <ShowroomTour
      tour={tour}
      services={services}
      hours={hours.map((h) => ({ label: t(`about.days.${h.days}`), value: h.open ? `${h.open} — ${h.close}` : t("about.closed") }))}
      address={`${address.street[locale]}, ${address.city[locale]} — ${address.wilaya[locale]}`}
      copy={{
        index: t("tour.index"),
        kicker: t("tour.kicker"),
        title: t("tour.title"),
        intro: t("tour.intro"),
        servicesTitle: t("tour.servicesTitle"),
        steps: services.map((_, i) => t("tour.step", { n: i + 1, total: services.length })),
        visitTitle: t("tour.visitTitle"),
        visitText: t("tour.visitText"),
        cta: t("tour.cta"),
        hours: t("tour.hours"),
        address: t("tour.address"),
        caption: t("tour.caption"),
        videoLabel: t("a11y.videoLabel"),
      }}
    />
  );
}
