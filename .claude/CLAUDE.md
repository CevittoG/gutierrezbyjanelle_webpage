# CLAUDE.md — GutierrezByJanelle Website

Developer reference for this codebase. Keep this file updated as the project evolves.

---

## Stack

- **Next.js 14** — App Router, `output: standalone`, `reactStrictMode: true`
- **TypeScript** — strict mode, baseUrl `.`, path alias `@/*`
- **Tailwind CSS** — CSS-variable tokens, no arbitrary values unless necessary
- **Docker** — multi-stage Dockerfile (dev and prod targets); `docker-compose` for local dev
- **clsx + tailwind-merge** — used together in a `cn()` helper for className composition

---

## Architecture Principles (SOLID)

| Principle | How it applies here |
|-----------|---------------------|
| **SRP** | Data/content lives in `config/site.ts`. Layout shell in `app/layout.tsx`. Page views in `app/<route>/page.tsx`. UI primitives in `components/ui/`. |
| **OCP** | Components accept a `className` prop merged with `cn()` — style extensions without touching internals. |
| **LSP** | Custom link/button wrappers must be drop-in substitutes for their native counterparts (pass-through all native props). |
| **ISP** | Each component's prop interface is narrow and specific to its use (e.g., `PricePlan` for pricing cards, not a global config object). |
| **DIP** | Components depend on `siteConfig` from `config/site.ts`, not on hardcoded strings — swapping content never requires touching component code. |

---

## Design Token System

Tokens are CSS variables defined in `app/globals.css` under `:root`. Tailwind reads them via `tailwind.config.ts` and maps them to utility classes.

```
globals.css  →  tailwind.config.ts  →  Tailwind utilities
--background     background: "hsl(var(--background))"   bg-background
--foreground     foreground: "hsl(var(--foreground))"   text-foreground
--primary        primary.DEFAULT                        bg-primary / text-primary
--muted          muted.DEFAULT                          bg-muted / text-muted-foreground
--accent         accent.DEFAULT                         bg-accent / text-accent-foreground
--border         border                                  border-border
--radius         borderRadius.lg                         rounded-lg
```

**Current palette (Janelle's brand):**
| Token | Value | Role |
|-------|-------|------|
| `--background` | `42 40% 94%` | Warm cream |
| `--foreground` | `20 10% 12%` | Near-black warm |
| `--primary` | `30 35% 72%` | Tan |
| `--secondary` | `0 0% 100%` | White |
| `--muted` | `42 25% 88%` | Deeper cream |
| `--accent` | `350 60% 90%` | Light pink |

To retheme the entire site, only the `:root` block in `app/globals.css` needs to change.

---

## Content Configuration Pattern

**All** site copy, navigation links, pricing tiers, review data, and gallery references live in `config/site.ts`.

```ts
// config/site.ts
export type NavItem    = { title: string; href: string };
export type Hero       = { headline: string; subheadline: string; cta: { label: string; href: string } };
export type PricePlan  = { id: string; name: string; price: string; description: string; features: string[] };
export type Review     = { id: string; text: string; author: string; role: string };
export type GalleryItem = { id: string; src: string; alt: string };

export const siteConfig = {
  name: "GutierrezByJanelle",
  description: string,
  url: "https://www.gutierrezbyjanelle.com",  // production domain — used by metadata, sitemap, robots
  hero: Hero,
  mainNav: NavItem[],
  pricing: PricePlan[],
  reviews: Review[],
  gallery: GalleryItem[],
};
```

Components import `siteConfig` and nothing else — never hardcode display strings inside components.

---

## Typography

Two Google Fonts loaded via `next/font/google` in `app/layout.tsx`, exposed as CSS variables:

| Variable | Font | Tailwind class | Usage |
|----------|------|----------------|-------|
| `--font-cinzel` | Cinzel | `font-cinzel` | Body default — all standard text, nav, cards |
| `--font-shadows` | Shadows Into Light | `font-shadows` | Accent — site name in header, hero headline |

Both variables are applied to `<html>`. `font-cinzel` is set on `<body>` as the default. Apply `font-shadows` only to accent elements.

---

## className Composition

Use the `cn()` helper in `utils.ts` for all dynamic or merged class strings:

```ts
// utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Every component that accepts a `className` prop should use `cn(defaultClasses, className)`.

---

## Page Routing

App Router convention: one file per route.

```
app/
  layout.tsx              ← shared shell (SiteHeader + SiteFooter), root metadata
  page.tsx                ← /  (Home)
  pricing/
    page.tsx              ← /pricing
  reviews/
    page.tsx              ← /reviews
  gallery/
    page.tsx              ← /gallery
  opengraph-image.tsx     ← /opengraph-image  (JSX ImageResponse, 1200×630)
  icon.tsx                ← /icon             (JSX ImageResponse, 32×32 favicon)
  sitemap.ts              ← /sitemap.xml      (auto-generated by Next.js)
  robots.ts               ← /robots.txt       (auto-generated by Next.js)
```

---

## Components

| File | Role |
|------|------|
| `components/site-header.tsx` | Sticky nav bar; reads `siteConfig.mainNav` and `siteConfig.name`; collapses to hamburger on mobile |
| `components/site-footer.tsx` | Bottom footer; reads `siteConfig.name` |
| `components/ui/button.tsx` | shadcn Button — 6 variants, 4 sizes |
| `components/ui/card.tsx` | shadcn Card with Header/Title/Description/Content/Footer |
| `components/ui/badge.tsx` | shadcn Badge — 4 variants |
| `components/ui/sheet.tsx` | Radix Dialog-based slide-in sheet (used by mobile nav) |
| `components/ui/price-card.tsx` | Accepts `PricePlan`; displays name/price/features with checkmarks |
| `components/ui/review-card.tsx` | Accepts `Review`; blockquote style |
| `components/ui/gallery-grid.tsx` | Responsive 1–3 col grid; renders gradient placeholder tiles until real photos are added |

---

## Docker Workflow

**The app always runs inside Docker.** Never ask the developer to run `npm run dev`, `npm run build`, or `npm run start` directly — those commands are not available outside the container. The `docker-compose up` dev container has hot reload via volume-mounted source, so file edits are reflected immediately in the browser with no manual restart needed.

```bash
# Local development (hot reload, volume-mounted source)
docker-compose up

# Production image
docker build --target runner -t gutierrezbyjanelle .
docker run -p 3000:3000 gutierrezbyjanelle
```

The Dockerfile has four named stages: `base → deps → development → builder → runner`.  
`docker-compose.yml` targets the `development` stage.

---

## Current Status

Phases 1–4 complete (minus Docker prod build verification and Lighthouse audit). All four routes render with brand styling and full SEO metadata.

**Phase 4 done:**
- Per-page `export const metadata` on all 4 routes (title, description, openGraph, twitter)
- Root layout metadata with `metadataBase`, OG, Twitter card, and icons
- `app/opengraph-image.tsx` — JSX-based 1200×630 OG image (no static asset needed)
- `app/icon.tsx` — JSX-based 32×32 monogram favicon
- `app/sitemap.ts` — serves `/sitemap.xml` with all 4 routes
- `app/robots.ts` — serves `/robots.txt` allowing all crawlers

**Still remaining:**
- Docker prod build verification (`docker build --target runner`)
- Lighthouse audit (target 90+ on all categories)

**When real gallery photos are ready:**
1. Place images in `public/gallery/`
2. Update `siteConfig.gallery` entries with real `src` paths
3. Replace the placeholder `div` in `components/ui/gallery-grid.tsx` with `next/image`

---

## How to Add a New Page

1. Create `app/<route>/page.tsx` with a default export.
2. Add the route to `siteConfig.mainNav` in `config/site.ts`.
3. Add any new data types/arrays to `siteConfig` and `config/site.ts`.
4. The shared header/footer render automatically via `app/layout.tsx`.
