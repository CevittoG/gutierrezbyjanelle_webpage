# CLAUDE.md — GutierrezByJanelle Website

Developer reference for this codebase. Keep this file updated as the project evolves.

---

## Design Context

Before any design or UI work, read both:

- [PRODUCT.md](../PRODUCT.md) — strategy: register (`brand`), users, brand personality (*intimate, refined, tasteful*), anti-references, 5 design principles.
- [DESIGN.md](../DESIGN.md) — visual system: tokens, typography rules, components, do's and don'ts. Creative North Star: **"The Modern Linen Envelope."**

DESIGN.md's frontmatter carries the tokens (hex, type scale, radii, component recipes) for tooling. `.impeccable/critique/` holds past design critiques.

**Non-negotiable visual rules** (full list in DESIGN.md §6):
- Palette is **Sage Garden** (linen cream, olive ink, deep olive primary, sage). One accent only — **Chestnut** (`#815237`): wax seals, the Email CTA, eyebrows, links, active-nav underline.
- Two fonts only — **Square Peg** (cursive signature) and **Anybody** (weight 132, uppercase, tracked).
- No pure `#000` or `#FFF` (Card White is the one sanctioned white).
- Flat by default; shadows are soft olive-ink or accent-tinted, never neutral gray.
- Layouts must survive longer Spanish strings — bilingual support is a constraint, not an afterthought.

---

## Stack

- **Next.js 14** — App Router, `output: standalone`, `reactStrictMode: true`; `transpilePackages: ['framer-motion']` configured to share the React instance and prevent SSR errors
- **TypeScript** — strict mode, baseUrl `.`, path alias `@/*`
- **Tailwind CSS** — CSS-variable tokens, no arbitrary values unless necessary
- **Docker** — multi-stage Dockerfile (dev and prod targets); `docker-compose` for local dev
- **clsx + tailwind-merge** — used together in a `cn()` helper for className composition
- **framer-motion ^11.3.0** — used for `StationeryHero` entrance stagger and per-card hover animations
- **google-auth-library ~9.15** — service-account JWT signing for Sheets API; `googleapis` is intentionally excluded to stay within Render's 512 MB RAM limit

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

**Current palette (Janelle's brand — Sage Garden, "Linen, Re-inked"):**
| Token | Value | Hex | Role |
|-------|-------|-----|------|
| `--background` | `40 38% 95%` | `#F7F4ED` | Linen cream — page background |
| `--foreground` | `90 16% 16%` | `#292F22` | Olive ink — body text and headings (never pure `#000`) |
| `--card` / `--secondary` | `42 50% 98%` | — | Card linen — card layer |
| `--primary` | `88 20% 30%` | `#4E5C3D` | Deep olive — primary buttons, footer |
| `--muted` | `84 20% 89%` | — | Sage mist — muted section surfaces |
| `--muted-foreground` | `88 10% 32%` | — | Captions, helper copy |
| `--accent` | `22 40% 36%` | `#815237` | Chestnut — the one accent (seals, Email CTA, links, eyebrows). 6:1 on linen |
| `--accent-deep` / `--accent-light` | `20 42% 27%` / `26 48% 66%` | — | Accent hover + seal rim / seal highlight + link hover on olive |
| `--accent-soft` | `28 42% 89%` | — | Pale chestnut surface (`bg-accent-soft`) for chips/badges that carry ink text. Chestnut is an ink colour — never put text on a translucent `bg-accent/NN` wash |
| `--border` | `70 14% 80%` | — | All borders |
| `--ring` | `22 42% 32%` | — | Focus rings + eyebrow text |
| `--sage` | `95 16% 62%` | — | Stitched-edge dashes |
| `--radius` | `0.25rem` | — | Card radius (4px, near-square "pressed paper"). `rounded-md` = 3px, `rounded-sm` = 2px. Tailwind scale is capped in `tailwind.config.ts` so `rounded-xl`/`rounded-2xl` also resolve to 4px; images use `rounded-sm` (2px) |

The previous Paper Cream / Powder Rose palette survives only for the `/v1` Classic archive, as a `:root:has(.classic-root)` block in `app/globals.css`.

To retheme the entire site, only the `:root` block in `app/globals.css` needs to change. Full visual spec (with named rules, component patterns, do's/don'ts) lives in [DESIGN.md](../DESIGN.md).

---

## Content Configuration Pattern

**All** site copy, navigation links, pricing tiers, review data, and gallery references live in `config/site.ts`.

```ts
// config/site.ts
export type NavItem        = { title: string; href: string };
export type Hero           = { headline: string; subheadline: string; cta?: { label: string; href: string } };
export type InvestmentTier = { id: string; name: Bilingual; description: Bilingual; features: Bilingual[]; image?: { src: string; alt: Bilingual }; savingsLabel?: string };
export type Founder        = { name: string; photo?: string; alt: Bilingual };
export type Review         = { id: string; text: string; author: string; role: string };
export type GalleryTag     = "ceremony-programs" | "welcome-signs" | "drink-toppers" | "bar-signs" | "note-cards" | "shower-games" | "invitations" | "menus" | "place-cards";
export type GalleryTagDef  = { id: GalleryTag; title: Bilingual; description: Bilingual };
export type GalleryItem    = { id: string; src: string; alt: string; tags?: GalleryTag[]; orientation?: GalleryOrientation };

export const siteConfig = {
  name: "Gutiérrez by Janelle",   // brand name in prose — the single source of truth
  url: "https://www.gutierrezbyjanelle.com",
  mainNav: NavItem[],             // Home → About → Weddings → Events → Gallery → Reviews
  investments: InvestmentTier[],  // 4 tiers: diy-digital, sweet-suite, signature-suite, add-ons
  eventInvestments: InvestmentTier[], // 3 event collections
  founder: Founder,               // headshot shared by the home scroll + About page
  reviews: Review[],
  galleryTags: GalleryTagDef[],   // 9 tags: 6 with photos, 3 coming-soon (invitations, menus, place-cards)
  gallery: GalleryItem[],         // 18 photos across 7 populated tags
  // ... hero, about, weddings, events, etsyStore, instagram
};
```

Components import `siteConfig` and nothing else — never hardcode display strings inside components.

### Brand name

`siteConfig.name` is the **only** place the brand is spelled, as **"Gutiérrez by Janelle"** — accented and spaced. Every surface reads it (page titles, footer, OG image, printed quote, client portal, the home scroll's `aria-label`); never retype it in a component.

Deliberately **not** accented, because they are real-world identifiers or someone else's words:
the domain, the Etsy URL **and `etsyStore.name`** (mirrors the actual shop), the Zola slug, the
Instagram handle, `contactEmail`, package/Docker identifiers, and the client testimonials in
`reviews` (quoted verbatim).

### Email links

Build every `mailto:` with `mailtoHref(subject, body?)` from `lib/mailto.ts` — it reads
`siteConfig.contactEmail` and URL-encodes the subject/body. Live-site buttons pass the bilingual
`conceptCopy.mailSubject` (plus the suite name on "Ask about this suite"); the `/v1` archive uses
`t("cta.emailSubject")`, so every inquiry lands with a subject line.

### AI search visibility (GEO / AEO)

The site is written to be quoted by answer engines (ChatGPT, Gemini, Perplexity, Google AI
Overviews). Report, outreach list and pitches: the "AI Search Visibility" Claude Doc.

- **Facts live in `siteConfig`:** `locations` (Austin, TX + Long Island, NY), `serviceArea`,
  `languages`, `shipping`, `founder.name`, `description`. The footer, JSON-LD, `/faq` and
  `/llms.txt` all read them, so a move or a new city is one edit.
- **`/faq`** (`config/faq.ts` → `app/(site)/_components/faq.tsx`) holds every 40–60-word
  answer. The other pages keep their short, visual H2s on purpose; put new answer copy here
  rather than under their headings. Each H2 opens with its section `lead`, each question is an
  H3 with its answer always visible. `lib/answers.test.ts` fails if an English lead/answer leaves
  40–60 words or a Spanish one is missing. No prices.
- **JSON-LD:** `lib/structured-data.ts` (pure builders) + `components/structured-data.tsx`.
  `ProfessionalService` sitewide from `app/(site)/layout.tsx`; `FAQPage` on `/faq`. English only,
  no prices, no invented ratings.
- **robots.ts:** `*` plus one named group of AI agents (search, assistant and training bots, all
  allowed). A named group replaces `*` for that bot, so every group repeats `privatePaths`.
- The Spanish copy is client-rendered, so crawlers only see English; server-rendered `/es`
  routes are the open follow-up.

### Photos that don't exist yet

Two optional config fields let a photo be wired up before the file exists, without ever showing an
empty "coming soon" frame. Both follow the same **drop one file + uncomment one line** procedure,
and the component renders *no image area at all* while the line stays commented:

| Field | Enable by | Rendered by |
|---|---|---|
| `founder.photo` | drop `public/founder/janelle.jpg`, uncomment `photo:` | `FounderPortrait` → home scroll + `/about` |
| `InvestmentTier.image` | drop `public/suites/<tier>.jpeg`, uncomment that tier's `// image:` line | `PriceCard` → `/weddings` + `/events` |

All six tiers already carry their intended `// image:` line commented out.

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
  layout.tsx              ← root: fonts, LocaleProvider, skip link, <main>, root metadata (no header/footer)
  (site)/                 ← the live public site (route group — adds no URL segment)
    layout.tsx            ← SiteShell: header, footer, sticky mobile Email/Instagram bar
    site.css              ← site-only classes (seal, envelope, fan, stitch…); tokens live in globals.css
    _components/          ← SiteHome, SiteOccasion (weddings + events), SiteAbout, SiteGallery, SiteReviews, SuiteShowcase, ui
    page.tsx              ← /  (Home)
    about/ weddings/ events/ gallery/ reviews/   ← one page.tsx each (SEO metadata + the component)
    faq/                  ← /faq: footer-only link (never mainNav), FAQPage JSON-LD
  v1/                     ← "Classic" archive of the previous live site (noindex); SiteHeader basePath="/v1" + SiteFooter
  investment/
    page.tsx              ← redirects to /weddings#collections (back-compat only)
  quotes/
    page.tsx              ← /quotes        (gated home — studio dashboard, integrates the explorer)
    [id]/page.tsx         ← /quotes/[id]   (gated "Profile Overview" — per-quote admin detail)
    prices/page.tsx       ← /quotes/prices (gated read-only Price book)
    _components/          ← Dashboard
  quote/
    new/page.tsx          ← /quote/new     (gated quote builder; ?draft=<id> opens a quote for editing)
    new/_components/      ← QuoteBuilder and its parts
  quote-calc/
    page.tsx              ← redirects to /quotes (back-compat; /quote-calc/explorer* redirect too)
    _components/          ← PasswordGate, ClientInfoSection, ConfigBanner, MobileBreakdownSheet (shared by the gated pages)
    api/**                ← API route handlers stay here (fetched by absolute path)
    print/**              ← print view
  opengraph-image.tsx     ← /opengraph-image  (link-preview card, 1200×630; brand fonts fetched at build)
  icon.tsx                ← /icon             (64×64 chestnut-seal favicon)
                            both use lib/og-brand.ts — its hex palette mirrors globals.css; keep in sync
  sitemap.ts              ← /sitemap.xml      (auto-generated by Next.js; includes /faq)
  robots.ts               ← /robots.txt       (named AI-crawler group; see "AI search visibility")
  llms.txt/route.ts       ← /llms.txt         (Markdown brief for AI agents, built from siteConfig + config/faq.ts)
```

---

## Components

| File | Role |
|------|------|
| `app/(site)/_components/*` | The live site: `SiteShell` (header/footer/sticky CTA), page components, `SiteButton`/`CtaBlock`/`LogoMark` (logo SVG as a CSS mask inside a `.site-seal`), and `SuiteShowcase` — the "What's in a suite" fan: real piece proportions, fixed hover columns that zoom one piece, lightbox on click, swipe strip on phones |
| `components/site-header.tsx` | **`/v1` Classic archive only.** Sticky nav; `basePath` prop prefixes every nav link so browsing stays in the archive |
| `components/site-footer.tsx` | **`/v1` Classic archive only.** Bottom footer; reads `siteConfig.name` |
| `components/ui/button.tsx` | shadcn Button — 6 variants, 4 sizes |
| `components/ui/card.tsx` | shadcn Card with Header/Title/Description/Content/Footer |
| `components/ui/badge.tsx` | shadcn Badge — 4 variants |
| `components/ui/sheet.tsx` | Radix Dialog-based slide-in sheet (used by mobile nav) |
| `components/ui/dialog.tsx` | Radix Dialog-based centred modal (used by the dashboard's delete confirmation). Warm `bg-foreground/30` scrim — never `bg-black/80` |
| `components/ui/price-card.tsx` | Accepts `InvestmentTier`; renders name/description/features, the relative `savingsLabel` badge (✦ / ✦✦ / ✦✦✦ — **never a percentage**), and the optional `plan.image` showcase photo. No image field ⇒ no image area |
| `components/ui/review-card.tsx` | Accepts `Review`; blockquote style |
| `components/ui/gallery-grid.tsx` | Tag-filtered flat grid; `activeFilter` prop; `AnimatePresence` tile transitions; lightbox with keyboard nav; `GalleryEmptyState` for tags with no photos |
| `components/ui/stationery-hero.tsx` | Two portrait cards in a flex row with framer-motion entrance stagger and per-card hover lift/rotate; text column right-aligned on desktop. Takes an `actions: HeroAction[]` array (one button per entry, wraps on mobile) — the home hero passes Wedding pricing + Event pricing |
| `components/ui/founder-portrait.tsx` | Janelle's headshot from `siteConfig.founder`. Returns `null` while `photo` is unset, so callers must lay out for its absence (the home founder scene collapses to one centred column) |
| `components/ui/marquee-ticker.tsx` | Slow CSS horizontal ticker, duplicated track for a seamless loop, pauses on hover, reduced-motion aware. Renders the à-la-carte item list on `/weddings` + `/events` |

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

`.env` points local dev at the **real** Google Sheet. To test the gated quote tools, use the
`quote-tools-offline` preview config in `.claude/launch.json` (throwaway local password, a
nonexistent Sheet ID) — never sign in against the real credentials from an agent session.

---

## Quote Builder — `/quotes`, `/quote/new`, `/q/[token]`

Password-gated internal tools (dashboard, builder, Price book, Profile Overview) plus the public,
tokenized client page. Not in the sitemap or public nav. Plain-language model:
[docs/QUOTE_CALC_MODEL.md](../docs/QUOTE_CALC_MODEL.md). Design history, every decision and the
implementation notes: [docs/quote-builder-redesign.md](../docs/quote-builder-redesign.md) (§15).

### Principles (don't break these)

1. **Prices come from the price book; costs only warn.** The Sheet's `Products` / `Options` /
   `Packages` / `Settings` tabs hold the data, `lib/quote-engine.ts` holds the rules, the builder
   handles composition. No price editing in the app.
2. **A saved quote is a document.** Lines store resolved names and prices, so
   `computeTotals(config)` depends on the saved config **only** (asserted in tests). The price book
   is read when a line is added or a refresh is applied, never to compute a total.
3. **Percentages mean what they say.** Suite savings and the discount are true % of their base.
4. **No cost data on client surfaces.** `/q/[token]` and print render only `buildPublicQuote()`
   output: never `listUnitPrice`, `est`, health, `productId`, option `estCost`, `legacy` or notes.
5. **Money never moves on a quote that exists.** Any rule change must be proven with fixtures
   against saved configs before it ships.

### Pricing (engine v2, `lib/quote-engine.ts`)

```
printed line  = qty × (unit + per-piece options) + percent options + flat options
                + designFee × (reuseDesign ? reuseDesignPct% : 1)
digital line  = unitPrice (the digitalPrice) + percent/flat options      # qty unused, no design fee
custom line   = qty × unitPrice
group savings = bundlePct% × group subtotal
services      = extraRevisions × revisionRoundPrice + license? licenseFee + anyPhysical? packagingFee
base          = items − suite savings + services
discount      = one discount: pct% × base, or min($, base); a reason + optional client label
rush          = rush? rushPct% × (base − discount)
total         = base − discount + rush + adjustment + (shipping ?? 0)      # deposit is display-only
```

Every component is rounded to cents (`lib/money.ts round2`) **except on quotes converted from the
old calculator** (`config.legacy` present): those skip rounding so their totals equal the old
engine's, and every surface shows them in whole dollars (`PublicQuote.wholeDollars`). Client money
uses `formatMoney` (cents only when not a whole dollar).

Invariants (all in `lib/quote-engine.test.ts`): closure, true percentages, config-only totals,
identical lines price identically, zero-line/custom-only quotes, digital ⇔ every line digital +
packaging iff any printed line, guest count re-quantifies linked lines only, `setTargetTotal`
lands exactly, and legacy conversion parity < $0.005 (254 fixtures).

**Health** (`lib/quote-health.ts`, admin only): hours (design × reuse + printed qty × minutes +
revision hours), estimated materials, fees (`feesPct` of total) → `$/hr = (total − shipping −
packaging − materials − fees) / hours`, judged against `hourlyTarget` / `hourlyFloor` from the
snapshot on the quote (`config.health`, else the current Settings). Shown as label + glyph
(✦ / ~ / !), never traffic-light colors.

### Data model v5 (`lib/quote-types.ts`, re-exported from `lib/quote-calc-drafts.ts`)

`Draft = { id, name, createdAt, updatedAt, client, config: DraftConfigV5, cachedTotal,
schemaVersion: 5 }`. `DraftConfigV5` = households / guests, `groups` (packages: name + bundle %),
`lines` (product or custom; `productId`, `groupId`, name, detail, includes, qty + `qtyLink`,
unitPrice / `listUnitPrice`, designFee / `listDesignFee`, reuseDesign, digital, resolved
`options`, `est`), `services` (rush %, revision price, license fee, packaging fee — policy
snapshots), `reuseDesignPct`, `discount`, `adjustment`, `shipping` (null = "added later"),
`deposit`, `pricedAt`, `health`, and `legacy` (the old quote, kept for audit).

`StoredDraft = Draft | LegacyDraft` is what a `_data` cell may hold until the freeze has run.
`toV5Draft(stored, catalog)` is the one conversion (`lib/quote-legacy.ts` replays the frozen old
engine in `lib/legacy/` and stores each priced piece as a fixed-$ line). Server reads convert with
the bundled catalog: every Sheet quote was frozen to v5, so only an old local browser cache can
still hold a pre-v5 quote.

### The Sheet

| Tab | Written by | Notes |
|---|---|---|
| `Products`, `Options`, `Packages` | Janelle (seeded once) | Read by `listPriceBook()` (60s cache); validated in `mergePriceBook()` with warnings naming tab + row; each tab falls back to the bundled seed (`DEFAULT_PRICE_BOOK`, Appendix B) on its own. A product without a price is a to-do (`needs-price`), hidden from the picker |
| `Settings` | Janelle | New keys: `guestsPerHousehold rushPct revisionRoundPrice revisionHours licenseFee packagingFee depositAmount reuseDesignPct vendorReferralPct feesPct hourlyTarget hourlyFloor`. Legacy keys are ignored silently |
| `_legacy_Items` + legacy Settings keys | — | **Retired.** The freeze ran on 2026-09-27 (20 converted, 0 parity failures); nothing reads `Items` any more (renamed `_legacy_Items`). Legacy Settings rows are ignored silently and can be deleted |
| `Quotes` | App | A–M readable row: ID · Status · Client · Event type · Event date · Quote name · **Summary** · **Households** · **Priced lines** · Total · Hidden notes · Created · Updated. N–U portal/lifecycle (unchanged) |
| `_data` | App | Full Draft JSON by id (v5, or pre-v5 until frozen) |

`POST /quote-calc/api/pricebook/seed` (the Price book page's **Create price book tabs**) writes only
missing/empty tabs and missing Settings keys; `POST /quote-calc/api/drafts/freeze` rewrites every
pre-v5 payload as v5 (idempotent; reports `converted`, `skipped`, `parityFailures`, `unreadable`,
`dashboardCorrections`). Both are run by Janelle after deploy, never from code or tests.

The freeze has run and the legacy `Items` reader (`quote-calc-config.ts`, `listConfig()`) is
deleted. `lib/legacy/` + `lib/quote-legacy.ts` stay while un-frozen local caches could exist;
delete them (and `LegacyDraft`) once that no longer matters.

### Files

| File | Role |
|---|---|
| `lib/quote-engine.ts` | `computeTotals(config)` (the only money math) + pure builders: `newQuote`, `addProduct`, `addPackage`, `addCustomLine`, `setGuestCounts`, `setLineQty`/`relinkLine`, `setLineDigital`, `toggleOption`, `setTargetTotal`, `diffAgainstPriceBook`/`applyRefresh`, `isDigitalQuote`, `quoteDisplayName` |
| `lib/quote-health.ts` | `computeHealth(config, totals, fallback)` |
| `lib/quote-pricebook.ts` | Price-book types, the Appendix B seed rows (also the bundled fallback), `mergePriceBook`, `priceGuide` (floor/target), `packageSample`, `planSeed`, `ConfigWarning` |
| `lib/quote-pricebook-remote.ts` | Client wrapper for `GET /quote-calc/api/pricebook` + last-good localStorage cache + seed call |
| `lib/quote-types.ts` | v5 types |
| `lib/quote-legacy.ts`, `lib/legacy/*` | Frozen old engine + `convertLegacyDraft` (do not edit the money math) |
| `lib/quote-freeze.ts` | Pure freeze plan (`planFreeze`) |
| `lib/quote-calc-drafts.ts` | `Draft`/`LegacyDraft`/`StoredDraft`, `normalizeStoredDraft`, `toV5Draft`, local cache (v5), last session, `reconcileDrafts` |
| `lib/quote-calc-sheets.ts` | Server-only Sheets REST: drafts (`listDraftRecords`/`getDraftById` = v5 view; `listStoredDraftRecords`/`getStoredDraftById` = as stored, for write-back paths), portal columns, `listPriceBook`, `seedPriceBookTabs`, `freezeLegacyDrafts` (already run) |
| `lib/quote-calc-portal.ts` | Portal meta, stages, `PublicQuote` v2 + `buildPublicQuote(draft, totals, files, depositPaid)` — the only client-safe projector |
| `lib/quote-calc-summary.ts` | `summarizeLinesV5` (Quotes column I) |
| `lib/money.ts` | `round2`, `formatMoney`, `formatMoney2`, `formatPct` |
| `app/quote/new/_components/QuoteBuilder.tsx` (+ `EventBasics`, `PackageChips`, `LineGroup`, `LineRow`, `ProductCombobox`, `OptionChips`, `ServicesPanel`, `DiscountControl`, `SummaryPanel`, `SetTotalDialog`, `ShowMath`, `PriceRefreshBanner`, `fields`) | The builder (§9 of the redesign doc) |
| `app/quotes/prices/**` | Read-only Price book page (floor · target · market · your price, package samples at 50/100 households, warnings, seed) |
| `app/quotes/page.tsx`, `_components/Dashboard.tsx` | Dashboard (client-link totals, Duplicate, soft-archive/restore) |
| `app/quotes/[id]/page.tsx` | Profile Overview (health, indicators, Edit/Duplicate/Print, stage, deposit, link, notes, proofs) |
| `app/q/[token]/**` | Public client page (projector only) + proof approval + file proxy |
| `app/quote-calc/print/**` | Print view (server v5 view first, local cache fallback) |
| `components/quote-app/{InvestmentList,HealthCard,DuplicateQuoteButton,AppShell,…}.tsx` | Shared admin/portal pieces. `InvestmentList` renders the same rows on `/q`, Profile Overview, print and the builder summary |
| `app/quote-calc/_components/{PasswordGate,ClientInfoSection,ConfigBanner,MobileBreakdownSheet}.tsx` | Shared gate, client fields (`part="basics" \| "notes"`), warning banner, mobile summary sheet |
| `app/quote-calc/api/**` | Cookie-gated routes: `drafts` (GET v5 list, POST upsert), `drafts/[id]` (GET v5, DELETE archive), `drafts/[id]/{restore,notes,duplicate}`, `drafts/freeze`, `pricebook`, `pricebook/seed`, `portal/[id]/{token,revoke,stage,deposit,file}` |

### Auth, portal, lifecycle (unchanged)

HMAC-signed `exp` cookie (`lib/quote-calc-auth.ts`, `QUOTE_CALC_PASSWORD` +
`QUOTE_CALC_SESSION_SECRET`, cookie path `/`). Per-quote Drive folder auto-created on save
(`GOOGLE_DRIVE_PARENT_FOLDER_ID`, optional `GBJ_QUOTES_OWNER_EMAIL`); proofs stream through
token + folder-membership-checked proxies. 9-stage lifecycle (`STAGE_ORDER` in
`quote-calc-portal.ts`, physical/digital wording from `isDigitalQuote`), deposit paid in column U,
two-step client proof approval auto-advancing `approval → balance`. Env vars: `.env.example`.

### Tests

Plain Node, no runner (`lib/quote-engine.test.ts`, `lib/quote-pricebook.test.ts`; fixtures only,
never the real Sheet):

```bash
npx tsc --target es2020 --module commonjs --skipLibCheck --lib es2020,dom --outDir /tmp/qe lib/quote-engine.test.ts && node /tmp/qe/quote-engine.test.js
```

(Same for `quote-pricebook.test.ts`, and for `lib/answers.test.ts`, the /faq word-count check, which compiles to `/tmp/qe/lib/answers.test.js`.) Plus `npx tsc --noEmit` and `npm run lint`.

---

## Hidden routes — `/v1` (Classic archive), `/v2`, `/v3` (concepts)

The live site is the former concept V1, **"Linen, Re-inked"** (promoted 2026-09). The hidden routes:

| Route | What | Look |
|---|---|---|
| `/v1/*` | **Classic (previous live)** — archived so it can be compared or restored | Paper Cream + Powder Rose, Square Peg + Anybody, `SiteHeader`/`SiteFooter` |
| `/v2/*` | **Editorial Atelier** concept | Fraunces + Manrope, ivory/oxblood/champagne. Magazine chapters, parallax, lookbook strip |
| `/v3/*` | **Stationery Table** concept | Bricolage Grotesque + Instrument Serif, butter/chocolate/cherry/blush. Draggable desk, flip cards, wish list → pre-written email |

- Hidden: `robots` noindex in each `app/vN/layout.tsx`, disallowed in `app/robots.ts`, not in the sitemap or `mainNav`.
- Floating **Concept switcher** (bottom-left, hidden routes only — never on the live site) jumps to the same page in Live / V1 / V2 / V3.
- Shared helpers in `components/concepts/` (`Reveal`, `Marquee`, `Lightbox`, `ConceptSwitcher`, `use-concept.ts`, `use-gallery.ts`, `concepts.css`) and copy in `config/concepts.ts` are **also used by the live site** — keep them. `useConceptNav()` with no version returns live hrefs. `/v2`, `/v3` re-scope tokens on `.v2-root` / `.v3-root`.
- To remove a hidden route: delete `app/vN/` and drop it from `robots.ts` (and, for `/v1`, the `:root:has(.classic-root)` block in `globals.css`). Removing `/v2` + `/v3` frees their font families in `tailwind.config.ts`.

---

## Current Status

All public routes render with brand styling and full SEO metadata. The quote builder prices from the Sheet price book (engine v2, data model v5); see the Quote Builder section.

**Complete:**
- `/faq` (footer-only) with 40–60-word answers, sitewide `ProfessionalService` + `FAQPage` JSON-LD, `/llms.txt`, named AI crawlers in robots.txt, location line in the footer
- 7 public routes: Home, About, Weddings, Events & Corporate, Gallery, Reviews, Quote Calculator (nav order: Home → About → Weddings → Events → Gallery → Reviews; `app/sitemap.ts` mirrors it). `/investment` is a back-compat redirect to `/weddings#collections` that nothing on the site links to any more — investment pricing lives inside the Weddings and Events pages
- Per-page SEO metadata on all routes
- Root layout metadata with `metadataBase`, OG, Twitter card, and icons
- `app/opengraph-image.tsx` — JSX-based 1200×630 OG image
- `app/icon.tsx` — 64×64 chestnut-seal "G" favicon
- `app/sitemap.ts` and `app/robots.ts`
- Quote builder redesign (docs/quote-builder-redesign.md, P0–P5): price book in the Sheet (`Products`/`Options`/`Packages`/`Settings`) with a read-only Price book page and one-time seed; engine v2 with resolved-price quote lines (schema v5), true suite savings and one discount with a reason, "Set total", a $/hr health check; new builder at `/quote/new`; client page, Profile Overview, print and dashboard on one projector; pre-v5 quotes converted with totals preserved and a one-time freeze endpoint. The items below marked "Phase N" describe the system it replaced
- Google Sheets persistence for drafts (service-account JWT, cache-first sync, graceful offline fallback)
- Phase 0: HMAC-signed expiring session cookie for `/quote-calc` (forged-cookie regression test in roadmap)
- Phase 1: pricing data externalized to `Settings` + `Items` sheet tabs with 60s cache, validated merge, and an in-app fallback banner naming bad rows
- Phase 2: `Quotes` tab restructured to human-readable columns (client, event, package, line items, total) with the full Draft JSON moved to a hidden `_data` tab; legacy rows auto-migrate on first write
- Phase 3: client portal + Drive proofs — auto-created per-quote Drive subfolder (read+create scopes), public tokenized read-only `/q/[token]` route, streaming file proxy with folder-membership check, and an admin Quote Explorer with link generate/revoke controls. Portal metadata in `Quotes` columns N–R
- Phase 4: lifecycle stages + client approval + itemized client pricing — 9-stage pipeline (physical/digital wording) Janelle drives from Profile Overview (`Quotes` cols S/T), an amount-based deposit (fixed expected `depositAmount` + recorded **deposit paid** in col U, balance = total − paid), editable hidden notes (col K + `_data`), two-step client proof approval that auto-advances `approval → balance`, and a horizontal scrollable step tracker + itemized investment on `/q/[token]`
- Phase 5: pricing-engine redesign for consistency — unified `lines` data model (schema v4: packages + items in one array; add-ons and the `individual` pseudo-package retired), revision/packaging/digital-license moved from per-line to **once-per-quote project services**, packaging charged once per order, and the same catalog item now prices identically wherever it's added. Engine split into pure cost functions (`calcPackageCost`/`calcItemCost`/`calcQuoteServices`) with all money math centralized in `computeQuoteBreakdown`. Invariants locked by `lib/quote-calc-totals.test.ts`
- Phase 6: discount-logic redesign for consistency & margin safety — **all discounts are additive** (bundle + vendor + family & friends + custom sum into one per-line %, no compounding) and bite the **raw labor cost only** (`laborBase` = design + production at cost, not marked up), so materials, admin overhead, target profit, and project services are never discounted — a discount only lowers your effective hourly rate; the orphaned `discountIndividual` setting removed; resulting net margin surfaced (no hard floor). One discount rule across calculator, print, and portal
- Dashboard quote deletion — per-row Delete guarded by a confirm dialog (`components/ui/dialog.tsx`) that can also revoke the client link; deletion is a soft archive (Status column), so archived quotes leave the list and every ledger total but stay restorable from the `Archived` filter via `POST /quote-calc/api/drafts/[id]/restore`. The local `localStorage` copy is dropped too, so the calculator can't resurrect a deleted quote
- Custom-only quotes: lines can all be removed (new quotes start blank), unnamed add-ons count as "Custom item", add-ons carry a Physical/Digital flag, and rush covers add-ons — the latter two money rules gated behind `pricingVersion` 2 so saved quotes keep their totals
- Investment content split by audience and shaped identically on both pages: a single **"Individual Items and Enhancements"** ticker (the `add-ons` tier — standalone pieces and suite enhancements merged into one de-duplicated 20-item list) sits at the **top** of the Investment section, above the suites/collections grid. Both grids use the same `sm:grid-cols-2 lg:grid-cols-3 gap-6` shape and the same ✦ savings badges. Anchors: `#individual-items`, `#wedding-suites` / `#event-suites`. The standalone Individual Item card and the `individual` tier are retired
- Savings are expressed **only** as ✦ / ✦✦ / ✦✦✦ (`savingsLabel`) while pricing is still being set — there is no percentage anywhere on the marketing site, and `InvestmentTier` carries no `discount` field. Both pages' body copy explains what the ✦ means
- Home story scroll (4 scenes): hero (two pricing buttons straight to `/weddings#wedding-investment` and `/events#event-investment`) → **Meet the Founder** (portrait + Janelle's own opening line from `siteConfig.about`, buttons to `/about` + `/gallery`) → featured review → inquiry CTA + Etsy
- Real gallery photos — 18 JPEGs in `public/gallery/`; tag-based filter bar with animated transitions; `GalleryEmptyState` for coming-soon tags (`menus`, `place-cards` remain coming-soon)
- Homepage redesigned: fixed logo watermark (20% opacity), `StationeryHero` with two real invitation card images, frosted-glass About/CTA sections
- A11y: skip-to-content link, active nav underline, focus-visible rings, `prefers-reduced-motion` global CSS rule
- AI-generated renders feature surfaced in Sweet Suite and Signature Suite pricing tiers

**Still remaining:**
- **Anybody drops accents** (deferred 2026-10): accented letters in Anybody body text render without their accents ("Papeleria", "Gutierrez") sitewide in headless Chromium; Square Peg headings are fine. Check in a real browser and fix before the Spanish phase
- **Server-rendered `/es` routes** (deferred 2026-10): the Spanish copy is client-rendered, so AI crawlers only ever see English
- Review the 8 quotes the freeze listed under `dashboardCorrections` (their old dashboard figure differed from the client link)
- Docker prod build verification (`docker build --target runner`)
- Lighthouse audit (target 90+ on all categories)

---

## How to Add a New Page

1. Create `app/(site)/<route>/page.tsx` with a default export (and its SEO metadata).
2. Add the route to `siteConfig.mainNav` in `config/site.ts`.
3. Add any new data types/arrays to `siteConfig` and `config/site.ts`.
4. The header, footer and sticky mobile CTA render automatically via `app/(site)/layout.tsx` (`SiteShell`).
