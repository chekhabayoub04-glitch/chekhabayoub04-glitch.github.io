import { getTranslations } from "next-intl/server";
import { siteConfig } from "~/site.config";
import { cars } from "@/lib/cars";
import { whatsappUrl } from "@/lib/contact";
import ContactForm from "./ContactForm";
import { IconMail, IconPhone, IconWhatsApp } from "./Icons";

export default async function ContactSection() {
  const t = await getTranslations("contact");
  const { contact } = siteConfig;
  const channels = [
    { href: contact.phoneHref, label: t("call"), value: contact.phone, Icon: IconPhone, ltr: true },
    { href: whatsappUrl(t("waGeneric")), label: t("whatsapp"), value: contact.phone, Icon: IconWhatsApp, ltr: true, external: true },
    { href: `mailto:${contact.email}`, label: t("email_label"), value: contact.email, Icon: IconMail, ltr: true },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="grain relative isolate scroll-mt-20 overflow-hidden border-t border-line py-20 lg:py-28">
      <div aria-hidden className="hex-pattern absolute inset-x-0 top-0 -z-10 h-2/3 opacity-[.07] [mask-image:linear-gradient(#000,transparent)]" />
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div>
          <p className="eyebrow">{t("kicker")}</p>
          <h2 id="contact-title" className="mt-5 text-[clamp(34px,4.4vw,68px)] font-black leading-[1.06] ltr:font-display ltr:uppercase ltr:leading-[.95]">
            {t("title")}
          </h2>
          <p data-reveal className="mt-5 max-w-md leading-8 text-mute">{t("lede")}</p>
          <ul className="mt-10 space-y-2">
            {channels.map(({ href, label, value, Icon, external }) => (
              <li key={label} data-reveal>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center justify-between gap-4 border border-line p-4 transition-colors hover:border-bone"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <Icon className={label === t("whatsapp") ? "text-wa" : "text-signal-hi"} />
                    {label}
                  </span>
                  <span dir="ltr" className="truncate font-sans text-sm text-mute group-hover:text-bone">
                    {value}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal className="border border-line bg-surface/80 p-5 backdrop-blur sm:p-8">
          <ContactForm cars={cars.map(({ slug, brand, model, year }) => ({ slug, brand, model, year }))} />
        </div>
      </div>
    </section>
  );
}
