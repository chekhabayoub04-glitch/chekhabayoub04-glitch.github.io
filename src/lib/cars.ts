import data from "~/data/cars.json";

export type Fuel = "petrol" | "diesel" | "hybrid" | "electric";
export type Gearbox = "manual" | "automatic";
export type BodyType = "city" | "hatchback" | "sedan" | "suv" | "pickup";
export type Condition = "new" | "used";
export type ImageKind = "exterior" | "profile" | "rear" | "interior" | "gallery";

/** `credit` is required for licensed photos (e.g. Wikimedia Commons CC BY / CC BY-SA). */
export type CarImage = {
  src: string;
  kind: ImageKind;
  focus?: string; // CSS object-position for wide crops
  credit?: { author: string; license: string; url: string };
};

export type Car = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  trim: string;
  year: number;
  price_dzd: number;
  fuel: Fuel;
  gearbox: Gearbox;
  engine: string;
  power_hp: number;
  top_speed_kmh: number;
  accel_0_100: number;
  mileage_km: number;
  color: { ar: string; fr: string; hex: string };
  body_type: BodyType;
  condition: Condition;
  featured: boolean;
  in_video: boolean;
  images: CarImage[];
  description_ar: string;
  description_fr: string;
};

export const cars = data.cars as Car[];

export const FUELS: Fuel[] = ["petrol", "diesel", "hybrid", "electric"];
export const GEARBOXES: Gearbox[] = ["manual", "automatic"];
export const BODY_TYPES: BodyType[] = ["city", "hatchback", "sedan", "suv", "pickup"];
export const CONDITIONS: Condition[] = ["new", "used"];

export const getCar = (slug: string) => cars.find((c) => c.slug === slug);
export const carName = (c: Pick<Car, "brand" | "model">) => `${c.brand} ${c.model}`;
export const brands = [...new Set(cars.map((c) => c.brand))].sort();

export const carImage = (car: Car, kind: ImageKind): CarImage | undefined => car.images.find((i) => i.kind === kind);

/** Images shown in viewers, in display order. */
export const viewerImages = (car: Car) => car.images;

export const description = (car: Car, locale: string) => (locale === "fr" ? car.description_fr : car.description_ar);

export function similarCars(car: Car, n = 3) {
  return cars
    .filter((c) => c.slug !== car.slug)
    .map((c) => ({ c, score: (c.body_type === car.body_type ? 2 : 0) + (Math.abs(c.price_dzd - car.price_dzd) < 3_000_000 ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.c);
}
