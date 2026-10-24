"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { siteConfig } from "~/site.config";
import Logo from "./Logo";
import { IconClose, IconMenu, IconPhone } from "./Icons";

const LINKS = [
  { key: "cars", hash: "cars" },
  { key: "services", hash: "services" },
  { key: "about", hash: "about" },
  { key: "contact", hash: "contact" },
] as const;

export function LangSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("a11y");
  return (
    <div role="group" aria-label={t("language")} dir="ltr" className="flex border border-line font-sans text-[13px]">
      {siteConfig.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className={`px-3 py-1.5 uppercase transition-colors ${l === locale ? "bg-bone text-ink" : "text-mute hover:text-bone"}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}

export default function Nav() {
  const t = useTranslations("nav");
  const ta = useTranslations("a11y");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled || open ? "border-b border-white/5 bg-ink/80 backdrop-blur-md" : "border-b border-transparent bg-gradient-to-b from-ink/80 to-transparent"
      }`}
    >
      <nav className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label={siteConfig.name} className="shrink-0">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-9 text-[15px] font-semibold text-mute lg:flex">
          {LINKS.map((l) => (
            <li key={l.key}>
              <Link href={{ pathname: "/", hash: l.hash }} className="transition-colors hover:text-bone">
                {t(l.key)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <LangSwitch />
          <a href={siteConfig.contact.phoneHref} dir="ltr" className="hidden items-center gap-2 font-sans text-sm tracking-wide text-bone xl:flex">
            <IconPhone width={16} height={16} className="text-signal-hi" />
            {siteConfig.contact.phone}
          </a>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center border border-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? ta("close") : ta("menu")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" hidden={!open} className="container-x h-[calc(100svh-72px)] border-t border-line bg-ink pb-10 pt-8 lg:hidden">
        <ul className="flex flex-col">
          {LINKS.map((l, i) => (
            <li key={l.key} className="border-b border-line">
              <Link
                href={{ pathname: "/", hash: l.hash }}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between py-5 text-3xl font-black"
              >
                {t(l.key)}
                <span className="font-display text-base text-mute">0{i + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
        <a href={siteConfig.contact.phoneHref} dir="ltr" className="mt-8 inline-flex items-center gap-3 font-sans text-lg">
          <IconPhone className="text-signal-hi" />
          {siteConfig.contact.phone}
        </a>
      </div>
    </header>
  );
}
