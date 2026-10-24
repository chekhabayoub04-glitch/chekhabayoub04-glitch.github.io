import { siteConfig } from "~/site.config";

export const whatsappUrl = (text: string) => `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(text)}`;

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

export const mapsUrl = () => {
  const { lat, lng } = siteConfig.address.geo;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
