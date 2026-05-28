# CLAUDE.md — GutierrezByJanelle Website

Developer reference for this codebase. Keep this file updated as the project evolves.

---

## Design Context

Before any design or UI work, read both:

- [PRODUCT.md](../PRODUCT.md) — strategy: register (`brand`), users, brand personality (*intimate, refined, tasteful*), anti-references, 5 design principles.
- [DESIGN.md](../DESIGN.md) — visual system: tokens, typography rules, components, do's and don'ts. Creative North Star: **"The Modern Linen Envelope."**

Sidecar at [.impeccable/design.json](../.impeccable/design.json) carries tonal ramps, motion tokens, and self-contained component snippets for tooling.

**Non-negotiable visual rules** (full list in DESIGN.md §6):
- One accent only — **Powder Rose** (`#EFC8CE`), state-only, ≤10% of any screen.
- Two fonts only — **Square Peg** (cursive signature) and **Anybody** (weight 132, uppercase, tracked).
- No pure `#000` or `#FFF` (Card White is the one sanctioned white).
- Flat by default; shadows are Powder Rose-tinted state revelations, never gray.
- Layouts must survive longer Spanish strings — bilingual support is a constraint, not an afterthought.

---

## Stack

- **Next.js 14** — App Router, `output: standalone`, `reactStrictMode: true`; `transpilePackages: ['framer-motion']` configured to share the React instance and prevent SSR errors
- **TypeScript** — strict mode, baseUrl `.`, path alias `@/*`
- **Tailwind CSS** — CSS-variable tokens, no arbitrary values unless necessary
- **Docker** — multi-stage Dockerfile (dev and prod targets); `docker-compose` for local dev
- **clsx + tailwind-merge** — used together in a `cn()` helper for className composition
- **framer-motion ^11.3.0** — used for `StationeryHero` entrance stagger and per-card hover animations

---

## Architecture Principles (SOLID)

| Principle | How it applies here |
|-----------|---------------------|
| **SRP** | Data/content lives in `config/site.ts`. Layout shell in `app/layout.tsx`. Page views in `app/<route>/page.tsx`. UI primitives in `components/ui/`. |
| **OCP** | Components accept a `className` prop merged with `cn()` — style extensions without touching internals. |
| **LSP** | Custom link/button wrappers must be drop-in substitutes for their native counterparts (pass-through all native props). |
| **ISP** | Each component's prop interface is narrow and specific to its use (e.g., `InvestmentTier` for pricing cards, not a global config object). |
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
| Token | Value | Hex | Role |
|-------|-------|-----|------|
| `--background` | `30 45% 95%` | `#F8F2ED` | Paper Cream — page background, dominant warm surface |
| `--foreground` | `22 45% 15%` | `#372215` | Deep Ink — body text and headings (warm brown-black, never pure `#000`) |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card White — the only true white; reserved for the card layer |
| `--primary` | `30 38% 68%` | `#CCAD8E` | Warm Tan — primary button fills, brand color |
| `--secondary` | `0 0% 100%` | `#FFFFFF` | White (same as card) |
| `--muted` | `30 30% 90%` | `#EDE6DE` | Linen Mist — muted section surfaces, half-step deeper than background |
| `--muted-foreground` | `25 20% 35%` | `#6B5647` | Muted Bark — captions, descriptions, helper copy |
| `--accent` | `350 55% 86%` | `#EFC8CE` | Powder Rose — state accent (hover glow, savings badge, focus underline). Guest, not host: ≤10% of any screen |
| `--border` | `30 20% 82%` | `#DAD1C8` | Warm Thread — all borders. Never colored |
| `--ring` | `30 38% 55%` | `#B88C61` | Ring Tan — focus rings only; deepened tan meeting WCAG AA against Paper Cream |
| `--radius` | `0.5rem` | — | Card radius. `rounded-md` = 6px, `rounded-sm` = 4px |

To retheme the entire site, only the `:root` block in `app/globals.css` needs to change. Full visual spec (with named rules, component patterns, do's/don'ts) lives in [DESIGN.md](../DESIGN.md).

---

## Content Configuration Pattern

**All** site copy, navigation links, pricing tiers, review data, and gallery references live in `config/site.ts`.

```ts
// config/site.ts
export type NavItem        = { title: string; href: string };
export type Hero           = { headline: string; subheadline: string; cta?: { label: string; href: string } };
export type InvestmentTier = { id: string; name: string; description: string; features: string[]; discount?: number };
export type Review         = { id: string; text: string; author: string; role: string };
export type GalleryItem    = { id: string; src: string; alt: string };

export const siteConfig = {
  name: "GutierrezByJanelle",
  url: "https://www.gutierrezbyjanelle.com",
  mainNav: NavItem[],
  investments: InvestmentTier[],  // 5 tiers: individual, design-suite, sweet-suite, signature-suite, add-ons
  reviews: Review[],
  gallery: GalleryItem[],
  // ... hero, about, weddings, etsyStore, instagram
};
```

Components import `siteConfig` and nothing else — never hardcode display strings inside components.

---

## Typography

Two font roles, two fonts loaded via `next/font/google` in `app/layout.tsx`:

| Role | Font | CSS variable | Tailwind class | Usage |
|------|------|-------------|----------------|-------|
| **Print / body** | Anybody (variable) | `--font-anybody` | `font-anybody` | Default on `<body>` — all nav, paragraphs, cards, buttons. Weight 132, uppercase, letter-spacing 0.04em (set in `globals.css`). |
| **Cursive / accent** | Square Peg | `--font-squarepeg` | `font-squarepeg` | Hero headlines, key section headings, page titles, card/plan names, reviewer names. Normal case, weight 400. |

Both variables are applied to `<html>`. `font-anybody` is set on `<body>` as the default. The `globals.css` `@layer base` block applies weight/uppercase/tracking to `.font-anybody` and resets them on `.font-squarepeg` so uppercase does not cascade into accent headings.

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
  investment/
    page.tsx              ← /investment (public pricing tiers with discount badges)
  reviews/
    page.tsx              ← /reviews
  gallery/
    page.tsx              ← /gallery
  weddings/
    page.tsx              ← /weddings
  quote-calc/
    page.tsx              ← /quote-calc (password-gated internal tool)
    _components/          ← QuoteCalculator, BreakdownPanel, AssumptionsPanel, PasswordGate
  opengraph-image.tsx     ← /opengraph-image  (JSX ImageResponse, 1200×630)
  icon.tsx                ← /icon             (JSX ImageResponse, 32×32 favicon)
  sitemap.ts              ← /sitemap.xml      (auto-generated by Next.js)
  robots.ts               ← /robots.txt       (auto-generated by Next.js)
```

---

## Components

| File | Role |
|------|------|
| `components/site-header.tsx` | Sticky nav bar; reads `siteConfig.mainNav` and `siteConfig.name`; collapses to hamburger on mobile; closes sheet on nav-link click; highlights active route with accent underline via `usePathname` |
| `components/site-footer.tsx` | Bottom footer; reads `siteConfig.name` |
| `components/ui/button.tsx` | shadcn Button — 6 variants, 4 sizes |
| `components/ui/card.tsx` | shadcn Card with Header/Title/Description/Content/Footer |
| `components/ui/badge.tsx` | shadcn Badge — 4 variants |
| `components/ui/sheet.tsx` | Radix Dialog-based slide-in sheet (used by mobile nav) |
| `components/ui/price-card.tsx` | Accepts `InvestmentTier`; displays name/features/discount badge (Save X% shown when `discount` is set) |
| `components/ui/review-card.tsx` | Accepts `Review`; blockquote style |
| `components/ui/gallery-grid.tsx` | Responsive 1–3 col grid; renders real photos via `next/image` fill with hover overlay |
| `components/ui/stationery-hero.tsx` | Two portrait cards in a flex row with framer-motion entrance stagger and per-card hover lift/rotate; text column right-aligned on desktop |

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

## Quote Calculator — `/quote-calc`

Password-gated internal pricing tool at `/quote-calc`. Not in the sitemap or public nav.

### Pricing Formula (cost-plus model)

```
variable_cost = design_labor + production_labor + materials + revision_labor + packaging
price_before_discount = variable_cost × (1 + admin%) × (1 + target_profit%)
final_price = price_before_discount × (1 - combined_discount%)
```

**Per-item cost breakdown:**
- **Design labor** — `(design_time_min / 60) × hourly × (isReuse ? reuseFactor : 1)`
- **Production labor** — `(prod_time_min / 60) × hourly × qty` (physical only)
- **Materials** — `(sheet_cost × materialMultiplier / yield) × (1 + errorMargin%) × qty` (physical only)
- **Revision labor** — `(extraRevisions × revisionMin / 60) × hourly`
- **Packaging** — flat cost per physical order

**Material multipliers:** `fullColorFactor` and `customPaperFactor` apply to sheet cost when toggled.

**Combined discount** = package discount + vendor incentive (stacked, both shown separately).

**Shipping** is excluded — added manually per carrier quote.

### Architecture

| File | Role |
|------|------|
| `lib/quote-calc-logic.ts` | Core engine: `QuoteState`, `DEFAULTS`, `ITEM_CATALOG` (15 items), `PACKAGES` (4 tiers), `calcPackage()`, `calcAddOn()`, persistence helpers |
| `app/quote-calc/_components/QuoteCalculator.tsx` | Main UI: package selector, individual item dropdown, extras toggles, qty/mode controls |
| `app/quote-calc/_components/BreakdownPanel.tsx` | Detailed price breakdown: variable costs → markups → adjustments → your costs → margin |
| `app/quote-calc/_components/AssumptionsPanel.tsx` | Collapsible settings: cost structure, package discounts, extras, per-item table with time spinners |
| `app/quote-calc/_components/PasswordGate.tsx` | Simple password gate wrapping the calculator |

### Data model

All configurable values live in `QuoteState` (interface in `quote-calc-logic.ts`). Per-item fields follow the pattern `i{ItemKey}_{suffix}` where suffix is `_dt` (design time, minutes), `_pt` (production time/unit, minutes), `_sc` (sheet cost, $), `_y` (yield per sheet). Time values are stored as minutes internally, displayed as `Xh Ym` with dual number spinners.

Settings persist to `localStorage` and can be exported/imported as JSON files.

---

## Current Status

All public routes render with brand styling and full SEO metadata. Quote calculator fully functional with cost-plus pricing model.

**Complete:**
- 6 public routes: Home, Investment, Reviews, Gallery, Weddings, Quote Calculator
- Per-page SEO metadata on all routes
- Root layout metadata with `metadataBase`, OG, Twitter card, and icons
- `app/opengraph-image.tsx` — JSX-based 1200×630 OG image
- `app/icon.tsx` — JSX-based 32×32 monogram favicon
- `app/sitemap.ts` and `app/robots.ts`
- Quote calculator with cost-plus pricing, 4 packages, 15 item catalog, 6 add-ons
- Investment page: Individual item card above suites, "Optimized Value Suites" heading, discount badges, pill-shaped Etsy/Instagram buttons with icons
- Real gallery photos — 6 JPEGs in `public/gallery/`; `GalleryGrid` upgraded to `next/image` with hover overlay
- Homepage redesigned: fixed logo watermark (20% opacity), `StationeryHero` with two real invitation card images, frosted-glass About/CTA sections
- A11y: skip-to-content link, active nav underline, focus-visible rings, `prefers-reduced-motion` global CSS rule
- AI-generated renders feature surfaced in Sweet Suite and Signature Suite pricing tiers

**Still remaining:**
- Docker prod build verification (`docker build --target runner`)
- Lighthouse audit (target 90+ on all categories)

---

## How to Add a New Page

1. Create `app/<route>/page.tsx` with a default export.
2. Add the route to `siteConfig.mainNav` in `config/site.ts`.
3. Add any new data types/arrays to `siteConfig` and `config/site.ts`.
4. The shared header/footer render automatically via `app/layout.tsx`.
