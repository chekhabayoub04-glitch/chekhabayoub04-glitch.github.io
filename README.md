# MHD AUTO — showroom-dz

Cinematic, scroll-driven website for an Algerian car showroom.
Stack: Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · GSAP + ScrollTrigger + Flip · Lenis · next-intl (French default / Arabic RTL) · sharp · ffmpeg.

> **Placeholders:** every price, spec, mileage, phone number and address is a placeholder (search for `PLACEHOLDER`). Car photos are real, freely licensed stock photos of each model (Wikimedia Commons, credited under each photo) until you replace them with photos of your own cars.

## Where to put what

| What | Where |
|---|---|
| Source video (untouched original, never modified) | `assets/video/raw/source.mp4` |
| Video chapters (start/end, section) | `scripts/video-chapters.json` |
| Generated video outputs | `assets/video/{chapters,processed,frames,posters}` + `assets/video/video-manifest.json` — generated, do not edit by hand |
| Car data (10 cars) | `data/cars.json` |
| Car photos | `public/cars/<car-slug>/` — see **Car photos** |
| Stock photo list (Commons titles, authors, licenses) | `scripts/car-photos.json` |
| Brand name, phone, WhatsApp, email, address, wilaya, map, hours, socials | `site.config.ts` |
| All copy (Arabic / French) | `messages/ar.json`, `messages/fr.json` |
| Colors & fonts | `src/app/globals.css` (`@theme`) and `src/app/[locale]/layout.tsx` |
| Secrets | `.env.local` (copy from `.env.example`) |

## Commands

```bash
npm install
npm run dev               # http://localhost:3000  (French at /, Arabic at /ar)
npm run build && npm start

npm run video:analyze     # smart-reframe analysis (where the cars are, frame by frame) → scripts/video-reframe.json
npm run video:process     # source.mp4 → film (landscape + portrait), clips, frame sequences, posters, manifest
npm run video:process -- --only film       # re-cut only the full film
npm run cars:commons      # download the licensed stock photos listed in scripts/car-photos.json
npm run cars:images       # optimize your own photos dropped into public/cars/<slug>/
```

ffmpeg/ffprobe come from npm (`ffmpeg-static`, `@ffprobe-installer/ffprobe`) — nothing to install system-wide. Override with `FFMPEG_PATH` / `FFPROBE_PATH`.

## Video pipeline

**Hero film (cinematic opening):** `assets/video/raw/hero-landscape.mp4` (16:9). `npm run video:process -- --only hero` produces web encodes plus two 20 fps WebP frame sequences (1280px desktop, 854px mobile). On the home page the film is **scrubbed by the scroll wheel** on a canvas (cross-blended frames, coarse-first loading that starts on the first scroll), drifts with the cursor, and when it ends the scene dims and the MHD AUTO sign, the showroom name and the brand marks (Simple Icons, CC0) assemble. Choreography constants live at the top of `src/components/HeroCinema.tsx`; HUD shot names in `scripts/video-chapters.json → hero.segments` and `messages/*.json → film.chapters`. The film's last frame stays as the fixed backdrop behind the rest of the site.

**Showroom tour:** `assets/video/raw/showroom-landscape.mp4`. `npm run video:process -- --only tour` builds its frame sequences. On the home page (`#services`) it is scrubbed by the scroll wheel while panels take turns: the showroom intro, each service from `messages/*.json → services.items`, then visit info (hours/address from `site.config.ts`). See `src/components/ShowroomTour.tsx`.

**Showroom footage (phone):** `source.mp4` is a portrait 576×1024 phone video. To make it work full-screen on landscape screens:

1. `scripts/analyze-video.mjs` measures, 4× per second, where the detail is (edge energy, biased toward the lower-middle where cars sit), smooths it and writes pan keyframes to `scripts/video-reframe.json`.
2. `scripts/process-video.mjs` cuts:
   - **Chapters** from `scripts/video-chapters.json`: clips at 1024p/640p, posters (WebP + AVIF).
   - **Scrub chapters**: smart-reframed 960×540 WebP frame sequences (24 fps) for canvas scrubbing, plus an all-intra MP4.
   - `assets/video/video-manifest.json`, which the front-end reads (`src/lib/video.ts`).

`assets/video/*` is mirrored to `public/media` before `dev` and `build` (`scripts/sync-media.mjs`).

**Runtime:** the hero film is a fixed, full-screen background behind the whole site. It is fully visible in the hero (with a camera-style HUD and a clickable chapter timeline) and glows faintly behind every other section. Frame scrubbing runs only on desktop with a normal connection; phones get looping clips. Reduced motion, Save-Data and 2G get posters only.

## Car photos

Each car has up to five kinds of image: `exterior` (main, front ¾), `profile` (pure side view), `rear`, `interior`, `gallery-N`.

- **Stock photos (current):** real photos of each model from Wikimedia Commons under CC BY / CC BY-SA / CC0, listed in `scripts/car-photos.json`. The author and license are shown under each photo, as the licenses require. Re-download with `npm run cars:commons`.
- **Your own photos:** put `exterior.jpg`, `profile.jpg`, `rear.jpg`, `interior.jpg`, `gallery-1.jpg`… in `public/cars/<slug>/` and run `npm run cars:images`. Each one replaces the stock photo of the same kind (and its credit). Originals move to `assets/cars-originals/`, which is not deployed.

## Adding / editing cars

Edit `data/cars.json`. Fields: `id, slug, brand, model, trim, year, price_dzd, fuel (petrol|diesel|hybrid|electric), gearbox (manual|automatic), engine, power_hp, top_speed_kmh, accel_0_100, mileage_km, color {ar, fr, hex}, body_type (city|hatchback|sedan|suv|pickup), condition (new|used), featured, in_video, images[], description_ar, description_fr`.
For a new car, create `public/cars/<slug>/` with at least `exterior.jpg`, then run `npm run cars:images`.

## Text animation

`src/components/TextFX.tsx` drives all text motion from markup: every `main h2` (or `[data-split]`) rises letter by letter out of a mask (word by word in Arabic, to keep letters joined); `.eyebrow` / `.index-tag` labels "decode" (scramble) in French; `[data-reveal]` blocks rise from a blur; `[data-count]` numbers count up. The hero headline is split server-side and animated in pure CSS (no flash). Opt out with `data-no-split`. Everything is disabled under `prefers-reduced-motion`.

## Contact form

`POST /api/contact` validates the lead, e-mails it through [Resend](https://resend.com) when `RESEND_API_KEY` and `CONTACT_TO_EMAIL` are set, and returns a pre-filled WhatsApp link the visitor taps to confirm. Without the keys, the WhatsApp step still works (leads are logged in dev).

## SEO

Per-page metadata, OpenGraph, `hreflang` (fr / ar / x-default), JSON-LD (`AutoDealer`, `Car` + `Offer`, `BreadcrumbList`), `/sitemap.xml`, `/robots.txt`. Set the real domain in `NEXT_PUBLIC_SITE_URL`.

## Deploy on GitHub Pages (static)

The site is built as a static export (`output: "export"`): no server, no API route. The contact form opens a pre-filled WhatsApp message in the visitor's browser. `.github/workflows/pages.yml` builds and publishes `out/` on every push to `main`. The French home is also copied to the root (`scripts/post-export.mjs`).

## Deploy on Vercel

1. Push the project to GitHub (the raw video and `design/reference` are git-ignored; `assets/video` outputs are committed).
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo. Framework preset: **Next.js**; root directory: `showroom-dz` if the repo contains the parent folder.
3. **Environment variables:** `NEXT_PUBLIC_SITE_URL` (e.g. `https://mhd-auto.dz`), and optionally `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
4. Deploy. `prebuild` copies the media into `public/media` automatically.
5. **Domain:** Project → Settings → Domains → add your domain and follow the DNS instructions.

Before launch: replace placeholders in `site.config.ts` (phone, WhatsApp, address, `geo`, `mapsEmbedUrl`, hours, socials), prices/specs in `data/cars.json`, and car photos.

## Quality checks (local, mobile emulation)

Lighthouse mobile, production build: Home: Performance 90 · Accessibility 100 · Best Practices 100 · SEO 92. Car page: 91 · 100 · 100 · 92. SEO reaches 100 once the canonical domain matches the deployed host. CLS 0.
