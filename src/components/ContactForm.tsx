"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { carName, type Car } from "@/lib/cars";
import { IconWhatsApp } from "./Icons";
import { whatsappUrl } from "@/lib/contact";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok"; whatsapp: string } | { kind: "error" };

/** Lead / test-drive form → WhatsApp message to the showroom (no server needed). */
export default function ContactForm({ cars, defaultCar, compact = false }: { cars: Pick<Car, "slug" | "brand" | "model" | "year">[]; defaultCar?: string; compact?: boolean }) {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const today = new Date().toISOString().slice(0, 10);

  /** Static site: no server. The lead is composed in the browser and opened as a WhatsApp message to the showroom. */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setStatus({ kind: "sending" });
    const data = Object.fromEntries(new FormData(form));
    const clean = (v: FormDataEntryValue | undefined, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const selected = cars.find((c) => c.slug === clean(data.car, 80));
    const text = t("waLead", {
      name: clean(data.name, 80),
      phone: clean(data.phone, 20),
      car: selected ? `${selected.brand} ${selected.model} ${selected.year}` : "—",
      date: clean(data.date, 10) || "—",
      message: clean(data.message, 1000) || "—",
    });
    const url = whatsappUrl(text);
    form.reset();
    setStatus({ kind: "ok", whatsapp: url });
  }

  const label = "block text-xs font-semibold text-mute";

  return (
    <form onSubmit={onSubmit} noValidate={false} className="grid gap-4 sm:grid-cols-2">
      {/* honeypot */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className={label}>
        {t("name")} <span className="text-signal-hi">*</span>
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field mt-2" />
      </label>
      <label className={label}>
        {t("phone")} <span className="text-signal-hi">*</span>
        <input name="phone" required type="tel" inputMode="tel" pattern="[+0-9 ]{9,16}" autoComplete="tel" dir="ltr" placeholder="0555 00 00 00" className="field mt-2 text-start rtl:text-end" />
      </label>
      {!compact && (
        <label className={label}>
          {t("email")}
          <input name="email" type="email" autoComplete="email" dir="ltr" className="field mt-2 text-start rtl:text-end" />
        </label>
      )}
      <label className={label}>
        {t("car")}
        <select name="car" defaultValue={defaultCar ?? ""} className="field mt-2 cursor-pointer">
          <option value="">{t("carNone")}</option>
          {cars.map((c) => (
            <option key={c.slug} value={c.slug}>
              {carName(c)} {c.year}
            </option>
          ))}
        </select>
      </label>
      <label className={`${label} ${compact ? "" : "sm:col-span-2"}`}>
        {t("date")}
        <input name="date" type="date" min={today} className="field mt-2 [color-scheme:dark]" />
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("message")}
        <textarea name="message" rows={compact ? 3 : 4} maxLength={1000} className="field mt-2 resize-y" />
      </label>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-mute">{t("privacy")}</p>
        <button type="submit" disabled={status.kind === "sending"} className="btn btn-primary disabled:opacity-60">
          {status.kind === "sending" ? t("sending") : compact ? t("testDrive") : t("submit")}
        </button>
      </div>

      <div aria-live="polite" className="sm:col-span-2">
        {status.kind === "ok" && (
          <div className="flex flex-col gap-3 border border-wa/40 bg-wa/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">{t("success")}</p>
            <a href={status.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <IconWhatsApp width={18} height={18} />
              {t("confirmWa")}
            </a>
          </div>
        )}
        {status.kind === "error" && <p className="border border-signal/50 bg-signal/10 p-4 text-sm">{t("error")}</p>}
      </div>
    </form>
  );
}
