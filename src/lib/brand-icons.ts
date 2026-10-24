// Monochrome brand marks (Simple Icons, CC0) for the brands sold at the showroom.
// Brands without a mark in Simple Icons (e.g. Mercedes-Benz, Chery) fall back to a wordmark.
import { siDacia, siFiat, siHyundai, siPeugeot, siRenault, siToyota, siVolkswagen } from "simple-icons";

const ICONS: Record<string, { path: string; title: string }> = {
  Dacia: siDacia,
  Fiat: siFiat,
  Hyundai: siHyundai,
  Peugeot: siPeugeot,
  Renault: siRenault,
  Toyota: siToyota,
  Volkswagen: siVolkswagen,
};

export const brandIcon = (brand: string) => ICONS[brand];
