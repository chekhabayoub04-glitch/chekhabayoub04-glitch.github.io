"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "~/site.config";
import { whatsappUrl } from "@/lib/contact";
import { IconPhone, IconWhatsApp, IconCalendar } from "./Icons";

/** Desktop: floating WhatsApp + call. Mobile: sticky bottom bar (call · WhatsApp · request). Appears after the hero. */
export default function FloatingContact() {
  const t = useTranslations("floating");
  const tc = useTranslations("contact");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wa = whatsappUrl(tc("waGeneric"));
  const hidden = visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0";
  const railHidden = visible ? "opacity-100" : "pointer-events-none opacity-0";

  return (
    <>
      <div className={`fixed end-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 transition-all duration-500 lg:flex ${railHidden}`}>
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={t("whatsapp")} className="grid h-11 w-11 place-items-center rounded-full bg-wa text-[#062b14] shadow-[0_10px_40px_-8px_rgba(37,211,102,.6)] transition-transform hover:scale-110">
          <IconWhatsApp width={22} height={22} />
        </a>
        <a href={siteConfig.contact.phoneHref} aria-label={t("call")} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-raised text-bone transition-transform hover:scale-110">
          <IconPhone width={18} height={18} />
        </a>
      </div>

      <div className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-all duration-500 lg:hidden ${hidden}`}>
        <a href={siteConfig.contact.phoneHref} className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold">
          <IconPhone className="text-signal-hi" />
          {t("call")}
        </a>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-16 flex-col items-center justify-center gap-1 bg-wa text-xs font-bold text-[#062b14]">
          <IconWhatsApp />
          {t("whatsapp")}
        </a>
        <Link href={{ pathname: "/", hash: "contact" }} className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold">
          <IconCalendar className="text-signal-hi" />
          {t("request")}
        </Link>
      </div>
    </>
  );
}
