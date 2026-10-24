import { frameUrl, type Hero } from "@/lib/video";

/**
 * Fixed backdrop behind the whole site: the hero film's final frame (the showroom interior),
 * so the scroll-driven opening lands seamlessly behind every following section.
 */
export default function FilmBackground({ hero }: { hero: Hero }) {
  const { desktop } = hero.frames;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frameUrl(desktop, desktop.count - 1)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-[1.07] object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_40%,rgba(10,10,11,.5)_78%,rgba(10,10,11,.85))]" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
