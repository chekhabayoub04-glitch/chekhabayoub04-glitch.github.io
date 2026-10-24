import { getLocale, getTranslations } from "next-intl/server";
import { siteConfig } from "~/site.config";
import { mapsUrl } from "@/lib/contact";
import { IconClock, IconPin } from "./Icons";

export async function Stats() {
  const t = await getTranslations();
  const stats = t.raw("stats") as { value: string; label: string }[];
  return (
    <section aria-label="MHD AUTO" className="container-x">
      <dl className="grid grid-cols-2 gap-px border-y border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-2 bg-ink px-4 py-10 first:ps-0 lg:px-8 lg:py-14">
            <dt className="text-sm text-mute">{s.label}</dt>
            <dd className="font-display text-[clamp(52px,6vw,88px)] font-black leading-none" dir="ltr">
              <span className="block text-start rtl:text-end" data-count={/^\d+$/.test(s.value) ? s.value : undefined}>
                {s.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export async function About() {
  const locale = (await getLocale()) as "ar" | "fr";
  const t = await getTranslations("about");
  const { address, hours } = siteConfig;
  return (
    <section id="about" aria-labelledby="about-title" className="container-x scroll-mt-20 border-t border-line py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow">{t("kicker")}</p>
          <h2 id="about-title" className="mt-5 text-[clamp(34px,4.2vw,64px)] font-black leading-[1.08] ltr:font-display ltr:uppercase ltr:leading-[.95]">
            {t("title")}
          </h2>
          <p data-reveal className="mt-6 max-w-lg text-lg leading-9 text-mute">{t("text")}</p>

          <div data-reveal className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <IconClock width={18} height={18} className="text-signal-hi" />
                {t("hours")}
              </h3>
              <dl className="mt-4 space-y-2 text-sm">
                {hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-line pb-2">
                    <dt className="text-mute">{t(`days.${h.days}`)}</dt>
                    <dd dir="ltr">{h.open ? `${h.open} — ${h.close}` : t("closed")}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <IconPin width={18} height={18} className="text-signal-hi" />
                {t("address")}
              </h3>
              <address className="mt-4 text-sm not-italic leading-7 text-mute">
                {address.street[locale]}
                <br />
                {address.city[locale]} — {address.wilaya[locale]}
              </address>
              <a href={mapsUrl()} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-signal-hi underline-offset-4 hover:underline">
                {t("directions")}
              </a>
            </div>
          </div>
        </div>

        <div data-reveal className="relative min-h-[360px] overflow-hidden border border-line bg-surface">
          {address.mapsEmbedUrl ? (
            <iframe src={address.mapsEmbedUrl} title={t("address")} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full grayscale invert-[.92] contrast-[.9]" />
          ) : (
            <div className="hex-pattern absolute inset-0 grid place-items-center bg-[length:56px_97px] opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(10,10,11,.4),#131315)]" />
              <div className="relative flex flex-col items-center gap-4 px-6 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-signal text-white shadow-[0_0_0_10px_rgba(232,56,44,.18)]">
                  <IconPin width={26} height={26} />
                </span>
                <p className="text-sm text-mute">{t("mapPlaceholder")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
