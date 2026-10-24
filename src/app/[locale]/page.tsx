import { getTranslations, setRequestLocale } from "next-intl/server";
import { cars } from "@/lib/cars";
import { getChapter } from "@/lib/video";
import Hero from "@/components/Hero";
import Tour from "@/components/Tour";
import Showroom from "@/components/Showroom";
import Inventory from "@/components/Inventory";
import Journey from "@/components/Journey";
import { About, Stats } from "@/components/Sections";
import ContactSection from "@/components/ContactSection";
import { JsonLd, dealerLd } from "@/components/JsonLd";

export default async function Home({ params }: { params: Promise<{ locale: "ar" | "fr" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const featuredFirst = [...cars].sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <>
      <JsonLd data={dealerLd(locale)} />
      <Hero />
      <div className="veil">
        <Showroom cars={featuredFirst} />
      </div>
      <Tour />
      <div className="veil">
      <Stats />
      <Inventory cars={cars} />
      <Journey
        kicker={t("journey.kicker")}
        title={t("journey.title")}
        hint={t("journey.hint")}
        steps={t.raw("journey.steps") as { title: string; text: string }[]}
        media={["ch7-walkthrough", "ch2-golf", "ch5-suv", "ch6-interior", "ch1-exterior", "ch3-moto"].map(getChapter)}
        videoLabel={t("a11y.videoLabel")}
      />
      <About />
      <ContactSection />
      </div>
    </>
  );
}
