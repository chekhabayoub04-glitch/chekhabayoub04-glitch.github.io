import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "~/site.config";
import { brands } from "@/lib/cars";
import Logo from "./Logo";
import { IconFacebook, IconInstagram, IconMail, IconPhone, IconPin, IconTikTok, IconWhatsApp } from "./Icons";
import { whatsappUrl } from "@/lib/contact";

const SOCIALS = [
  { key: "instagram", Icon: IconInstagram },
  { key: "facebook", Icon: IconFacebook },
  { key: "tiktok", Icon: IconTikTok },
] as const;

export default async function Footer() {
  const locale = (await getLocale()) as "ar" | "fr";
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tc = await getTranslations("contact");
  const { contact, address, socials } = siteConfig;

  return (
    <footer className="container-x relative border-t border-line bg-ink pb-28 pt-16 lg:pb-12">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-7 text-mute">{t("tagline")}</p>
          <div className="mt-6 flex gap-2">
            {SOCIALS.filter((s) => socials[s.key]).map(({ key, Icon }) => (
              <a key={key} href={socials[key]} target="_blank" rel="noopener noreferrer" aria-label={key} className="grid h-11 w-11 place-items-center border border-line text-mute transition-colors hover:border-bone hover:text-bone">
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="footer">
          <ul className="space-y-3 text-sm">
            {(["cars", "services", "about", "contact"] as const).map((k) => (
              <li key={k}>
                <Link href={{ pathname: "/", hash: k }} className="text-mute transition-colors hover:text-bone">
                  {tn(k)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="space-y-3 font-sans text-sm text-mute" dir="ltr">
          {brands.map((b) => (
            <li key={b} className="text-start rtl:text-end">{b}</li>
          ))}
        </ul>

        <ul className="space-y-4 text-sm">
          <li className="flex gap-3 text-mute">
            <IconPin className="shrink-0 text-signal-hi" />
            <span>
              {address.street[locale]}
              {locale === "ar" ? "، " : ", "}
              {address.city[locale]}
              <br />
              {address.wilaya[locale]}
            </span>
          </li>
          <li>
            <a href={contact.phoneHref} dir="ltr" className="flex gap-3 text-bone">
              <IconPhone className="shrink-0 text-signal-hi" />
              {contact.phone}
            </a>
          </li>
          <li>
            <a href={whatsappUrl(tc("waGeneric"))} target="_blank" rel="noopener noreferrer" className="flex gap-3 text-bone">
              <IconWhatsApp className="shrink-0 text-wa" />
              {tc("whatsapp")}
            </a>
          </li>
          <li>
            <a href={`mailto:${contact.email}`} className="flex gap-3 break-all text-bone">
              <IconMail className="shrink-0 text-signal-hi" />
              {contact.email}
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-mute md:flex-row md:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. {t("rights")}
        </p>
        <p>{t("notice")}</p>
      </div>
    </footer>
  );
}
