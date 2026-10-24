import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cars } from "@/lib/cars";
import Inventory from "@/components/Inventory";
import { alternates, localePath } from "@/lib/paths";
import ContactSection from "@/components/ContactSection";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";

const path = (locale: string) => localePath(locale, "/cars");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("carsTitle"),
    description: t("carsDescription"),
    alternates: alternates(locale, "/cars"),
    openGraph: { title: t("carsTitle"), description: t("carsDescription"), url: path(locale) },
  };
}

export default async function CarsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tn = await getTranslations("nav");
  return (
    <div className="veil pt-[72px]">
      <JsonLd data={breadcrumbLd([{ name: "MHD AUTO", path: localePath(locale) }, { name: tn("cars"), path: path(locale) }])} />
      <Inventory cars={cars} headingLevel="h1" />
      <ContactSection />
    </div>
  );
}
