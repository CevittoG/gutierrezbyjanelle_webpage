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
  quotes/
    page.tsx              ← /quotes        (gated home — studio dashboard, integrates the explorer)
    [id]/page.tsx         ← /quotes/[id]   (gated "Profile Overview" — per-quote admin detail)
    _components/          ← Dashboard
  quote/
    new/page.tsx          ← /quote/new     (gated calculator; ?draft=<id> preloads a quote for editing)
  quote-calc/
    page.tsx              ← redirects to /quotes (back-compat; /quote-calc/explorer* redirect too)
    _components/          ← QuoteCalculator, BreakdownPanel, AssumptionsPanel, PasswordGate (shared by the gated pages)
    api/**                ← API route handlers stay here (fetched by absolute path)
    print/**              ← print view
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

**Combined discount** = package discount + vendor incentive + optional per-quote Package and Family-&-Friends discounts (all stacked additively on the base package price, each shown separately). The latter two are typed integer percentages entered as Extras, stored on the draft (not in `Settings`).

**Shipping** is excluded — added manually per carrier quote.

### Architecture

| File | Role |
|------|------|
| `lib/quote-calc-logic.ts` | Core engine: `QuoteState`, `DEFAULTS`, `ITEM_CATALOG` (17 items — bundled fallback), `PACKAGES` (7 tiers: 4 wedding + 3 events), `calcPackage()`/`calcAddOn()`/`getItemQty()` accept an optional `catalog` arg so the engine treats catalog as data, `calcAddOnRaw()`, `PkgItem` type with per-item multiplier/displayLabel support |
| `lib/quote-calc-auth.ts` | Server-only HMAC-signed session helpers (`signSession`, `verifySession`, `isQuoteAuthValid`, `buildSessionCookieHeader`). Replaces the legacy `quote_auth=1` constant; requires `QUOTE_CALC_SESSION_SECRET` |
| `lib/quote-calc-config.ts` | Runtime config types (`RemoteSetting`, `RemoteItem`, `RemoteConfig`, `ConfigWarning`) + `mergeRemoteConfig()` that overlays Sheet values onto `DEFAULTS`/`ITEM_CATALOG` and surfaces validation warnings |
| `lib/quote-calc-drafts.ts` | Draft CRUD (localStorage), `DraftConfig` with `packages: PackageLine[]` (multi-line, schema v3), `miscAddOns: MiscAddOn[]`, `SyncStatus` type, `reconcileDrafts()`; v1/v2 drafts auto-migrated (iDrinkTop→iWedgeTop; single `pkg`/`qty` wrapped into one `PackageLine`) |
| `lib/quote-calc-sheets.ts` | **Server-only** — service-account JWT auth (google-auth-library), module-level token cache, Sheets v4 REST. Schema-aware Quotes reads (legacy JSON-in-col-M or new readable + `_data` payload tab), auto-migrates legacy rows on first write, soft-archive by id. Also exposes `listConfig()` with a 60s cache for the Settings + Items tabs |
| `lib/quote-calc-summary.ts` | Pure formatter — turns a `Draft` into the multiline "Line items" string that lands in column I of the new Quotes tab |
| `lib/quote-calc-drafts-remote.ts` | Client-side wrappers (`fetchRemoteDrafts`, `pushRemoteDraft`, `archiveRemoteDraft`) around the `/quote-calc/api/drafts` routes |
| `lib/quote-calc-config-remote.ts` | Client wrapper for `GET /quote-calc/api/config` (RemoteResult-shaped, supports `refresh: true`) |
| `app/quote-calc/api/drafts/route.ts` | `GET` list + `POST` upsert; uses `isQuoteAuthValid()`; returns 503 when Sheets not configured |
| `app/quote-calc/api/drafts/[id]/route.ts` | `DELETE` soft-archive by id |
| `app/quote-calc/api/config/route.ts` | `GET` merged Settings + Items payload from the Sheet; `?refresh=1` bypasses the cache |
| `app/api/quote-auth/route.ts` | `POST` issues a signed session cookie on password match; `DELETE` clears it. Requires `QUOTE_CALC_PASSWORD` and `QUOTE_CALC_SESSION_SECRET` |
| `app/quote-calc/_components/QuoteCalculator.tsx` | Main UI: Wedding/Events tab toggle, package grid, add-on qty steppers, misc add-on section, extras, Sheet sync on mount/save; pulls live `catalog` + `assumptions` from `/api/config` on mount |
| `app/quote-calc/_components/MiscAddOnSection.tsx` | One-off line items (name, qty, unit selling price) for special client requests outside the catalog |
| `app/quote-calc/_components/BreakdownPanel.tsx` | Detailed price breakdown; accepts a `catalog` prop, renders misc add-on lines and PkgItem displayLabel overrides |
| `app/quote-calc/_components/AssumptionsPanel.tsx` | Collapsible settings: cost structure, wedding + event package discounts, extras, per-item table (driven by the passed-in `catalog`) |
| `app/quote-calc/_components/ConfigBanner.tsx` | Inline warning banner shown above the calculator when the Sheet config fails to load or contains invalid/unknown rows. Names the offending tab/row; has a Retry button that calls `/api/config?refresh=1` |
| `app/quote-calc/_components/PasswordGate.tsx` | Branded password gate; the front door for every gated page (`/quotes`, `/quote/new`, `/quotes/[id]`) |
| `components/quote-app/AppShell.tsx` | Slim sticky app chrome (Dashboard / New quote nav + sign-out) for the gated tools; replaces the marketing header/footer (which self-hide on `^/(quotes|quote|quote-calc|q)` via `usePathname`) |
| `components/quote-app/LinkControls.tsx` | Public-link controls (generate/regenerate/copy/revoke); shared by the dashboard and Profile Overview (moved here from the old explorer) |
| `lib/quote-calc-totals.ts` | **Pure** `computeQuoteBreakdown(config, assumptions, catalog)` — the price math extracted from `PrintQuote`. Shared by the print view and the public portal so both render identical numbers |
| `lib/quote-calc-portal.ts` | **Pure** Phase 3 types + helpers: `PortalMeta`, `LinkStatus`, `isLinkActive`/`isLinkExpired`, `PublicQuote` shape, and `buildPublicQuote()` — the projector that strips everything secret down to the client-safe shape |
| `lib/quote-calc-drive.ts` | **Server-only** Drive v3 REST (no `googleapis`): `createQuoteSubfolder`, `ensureQuoteFolder` (auto-create on save), `listFolderFiles` (60s cache), `streamFile` (alt=media, streamed), `folderWebLink`. Uses the shared SA token from `quote-calc-sheets` |
| `app/q/[token]/page.tsx` · `_components/PublicQuoteView.tsx` | **Public** "Client Quote Profile" (no admin cookie, `force-dynamic`, noindex). Token → `PublicQuote` + `PublicProgress`; work-first sell layout: stage tracker, proofs, proof-approval action, suite, itemized investment + deposit/balance, contact CTA |
| `app/q/[token]/_components/ApproveProofs.tsx` | Client proof-approval control (checkbox → typed name → confirm); POSTs `/q/[token]/approve`, which auto-advances `approval → balance` |
| `components/quote-app/StageControl.tsx` | Admin stage selector on Profile Overview; POSTs `/quote-calc/api/portal/[id]/stage`, optimistic + `router.refresh()` |
| `components/quote-app/DepositPaidControl.tsx` | Admin input recording the deposit amount paid; POSTs `/quote-calc/api/portal/[id]/deposit` (column U) |
| `components/quote-app/HiddenNotesControl.tsx` | Admin editor for a quote's private hidden notes; POSTs `/quote-calc/api/drafts/[id]/notes` |
| `components/ui/proof-gallery.tsx` | Brand proof gallery: responsive masonry + shared-element lightbox with drag-to-dismiss and keyboard nav, reduced-motion aware. Used by the client portal |
| `app/q/[token]/file/[fileId]/route.ts` | Public streaming file proxy; re-verifies token + folder membership before streaming |
| `app/quotes/page.tsx` · `_components/Dashboard.tsx` | Gated **studio dashboard** (`/quotes`): ledger stats + "up next" + searchable/filterable/date-sortable quote list with per-row Edit · Profile Overview · Client Quote Profile actions. Absorbs the old explorer |
| `app/quotes/[id]/page.tsx` | Gated **"Profile Overview"** — per-quote admin detail (stage control, payment/approval status, link controls, itemized client-facing summary, admin-proxied proofs) |
| `app/quote-calc/api/portal/[id]/{token,revoke,stage,deposit,file/[fileId]}/route.ts` | Cookie-gated: generate/regenerate token, revoke link, set lifecycle stage, record deposit paid, admin-side file proxy |
| `app/quote-calc/api/drafts/[id]/notes/route.ts` | Cookie-gated: update a quote's private hidden notes |
| `app/q/[token]/approve/route.ts` | Public, token-gated: record client proof approval (name + timestamp) and auto-advance the stage |

### Data model

All configurable values live in `QuoteState` (interface in `quote-calc-logic.ts`). Per-item fields follow the pattern `i{ItemKey}_{suffix}` where suffix is `_dt` (design time, minutes), `_pt` (production time/unit, minutes), `_sc` (sheet cost, $), `_y` (yield per sheet). Time values are stored as minutes internally, displayed as `Xh Ym` with dual number spinners.

`DraftConfig` holds the full quote state per draft including `packages: PackageLine[]` (one entry per package line — the core multi-line model), `miscAddOns: MiscAddOn[]` for one-off client items, and the per-quote `packageDiscountPtg` / `familyFriendsPtg` typed discounts. `DraftClientInfo` carries two notes: `notes` (private/hidden) and `clientNotes` (client-facing). `Draft.schemaVersion` is currently `3`; v1/v2 drafts are auto-migrated on load (v1: iDrinkTop qty moved to iWedgeTop; v2: single `pkg`/`qty` wrapped into one `PackageLine`). New fields need no version bump — `migrateConfig`/`migrateDraft` backfill them by spreading `DEFAULT_CONFIG` / `EMPTY_CLIENT_INFO`.

**Persistence:** localStorage is the primary cache (instant reads). Google Sheets is the remote source of truth — drafts sync on save and reconcile on page load. The app degrades gracefully to local-only when Sheet credentials are not configured. Requires three env vars: `GOOGLE_SHEETS_SA_EMAIL`, `GOOGLE_SHEETS_SA_PRIVATE_KEY`, `GOOGLE_SHEETS_DOC_ID` (see `.env.example`). The Sheet must have a tab named `Quotes` — the app writes its header row automatically (now A1:U1 with the Phase 3 portal + Phase 4 lifecycle columns) but does not create the tab itself.

### Auth (Phase 0)

The gate uses an HMAC-SHA256 signed cookie carrying an `exp` claim, verified in constant time by `isQuoteAuthValid()` in `lib/quote-calc-auth.ts`. The cookie `Path` is `/` (site-wide) so the session reaches every gated surface — `/quotes`, `/quote/new`, `/quotes/[id]`, and the `/quote-calc/api` routes. Requires `QUOTE_CALC_SESSION_SECRET` (≥32 chars). Rotating the secret invalidates every active session. The legacy forgeable `quote_auth=1` constant is gone.

### Runtime config from the Sheet (Phase 1)

Pricing data is loaded at runtime from two extra tabs in the same Google Sheet, so Janelle can edit numbers without touching the codebase. The engine stays in TS.

- **`Settings` tab** — two columns: `key` (A), `value` (B). One row per global rate. Whitelisted keys: `hourly`, `adminPtg`, `targetProfitPtg`, `errorMarginPtg`, `packagingCost`, `reuseFactor`, `revisionMin`, `vendorIncentivePtg`, `fullColorFactor`, `customPaperFactor`, `rushFeePtg`, `digitalLicensePtg`, `depositAmount` (flat client deposit, $ — display-only, never in the price math), `discountIndividual`, `discountDiy`, `discountSweet`, `discountSignature`, `discountEventBasics`, `discountEventFun`, `discountEventWorks`. Unknown keys are ignored and surfaced in the banner. Row 1 is the header.
- **`Items` tab** — eight columns: `key` (A), `label` (B), `designMin` (C), `prodMin` (D), `sheetCost` (E), `yield` (F), `qty` (G — per-household), `fixed` (H — flat count, blank means use `qty`). Unknown keys (typos) are ignored and listed in the banner. Row 1 is the header.

Both tabs must be created and headered manually once. The app reads but never writes them. Reads are cached server-side for 60 seconds; the calculator's Retry button calls `/api/config?refresh=1` to bypass the cache.

The Sheet is the source of truth — its values overlay locally-saved `assumptions` defaults on every fetch. If either tab is missing, empty, contains non-numeric values, or returns an error, the calculator falls back to bundled `DEFAULTS`/`ITEM_CATALOG` and `ConfigBanner` shows what failed (with tab + row number when known).

### Quotes tab schema (Phase 2)

The `Quotes` tab is now human-readable — Janelle sees client / event / package / line items / total / status, not a JSON blob. The full `Draft` payload was moved to a separate hidden `_data` tab keyed by Quote ID. Reads join the two tabs; writes update both.

**`Quotes` tab columns** (header row in A1:M1, written automatically on first upsert):
A=Quote ID · B=Status (`active` / `archived`) · C=Client · D=Event type · E=Event date · F=Quote name · G=Package (display name) · H=Quantity · I=Line items (multiline) · J=Total · K=Hidden notes · L=Created · M=Updated. The client-facing note has **no readable column** — it lives only in the `_data` Draft JSON (renders on `/q/[token]`).

**`_data` tab** (hidden, two columns): A=Quote ID · B=full Draft JSON. The app creates this tab automatically on first write if it's missing.

**Schema migration is automatic.** `listDrafts` detects the old schema (JSON in col M) by checking whether `A1 == "Quote ID"` and parses either format. The first `upsertDraftRow` call after deploy migrates any legacy rows over: parse each legacy JSON, write new readable rows to `Quotes`, write payloads to `_data`. Subsequent reads use the readable path. Idempotent — calling on an already-migrated sheet is a no-op.

Line items in column I are produced by `lib/quote-calc-summary.ts` from the bundled `ITEM_CATALOG` labels. Catalog overrides Janelle has set in the `Items` tab aren't applied to the summary at write time (this is a deliberate scope cut — the readable label drifts at most a quote away from the real one).

### Client portal + Drive proofs (Phase 3)

Each quote can map to one Drive folder (proofs + the printed-quote PDF) and one public, tokenized, read-only client link.

**Portal columns N–R** were appended to the `Quotes` tab: N=Drive folder · O=Public token · P=Link status (`active`/`revoked`) · Q=Expires · R=Approved at (now used by Phase 4, below — formerly reserved). These are **server-managed row metadata, kept out of the `Draft`/`_data` JSON** so a secret token never rides the client-synced draft. The draft pipeline still writes only A:M; the portal accessors in `quote-calc-sheets.ts` (`setDriveFolderId`, `activatePublicLink`, `revokePublicLink`, `findByPublicToken`, `listPortalMeta`, `getPortalMetaById`) write/read N–U via single-cell writes, with a ~30s module cache for token resolution. `ensureNewSchema` backfills the wider header on sheets migrated before Phase 3/4.

**Drive (read + create).** The SA JWT gained `drive.file` (create the per-quote subfolder) and `drive.readonly` (read the proofs Janelle uploads, which she owns). On quote save, `POST /api/drafts` best-effort calls `ensureQuoteFolder` — if `GOOGLE_DRIVE_PARENT_FOLDER_ID` is set and the row has no folder yet, it creates `"<client> — <quote name>"` under that parent and registers the id in column N. Idempotent; a Drive failure never fails the save. The app **never uploads file content** (folder creation is metadata-only — Render RAM safe). Set up: share the `GBJ Quotes` root with the SA as **Editor**; optionally set `GBJ_QUOTES_OWNER_EMAIL` to grant Janelle Editor on each created subfolder.

**Public route `/q/[token]`** (outside `/quote-calc`, no admin cookie, `force-dynamic`, noindex). Resolves the token → reads the `_data` Draft **server-side** → recomputes via `computeQuoteBreakdown` → projects to a `PublicQuote` (`buildPublicQuote`). The client-safe shape carries **included pieces, itemized selling-price lines (each package line + add-ons + misc), subtotal, savings, rush, total, the fixed deposit / remaining balance split, and the optional client-facing note** — never the cost buildup (design/production/admin/margin), per-item rates, the hidden note, or the `Draft` JSON. Proofs stream through `GET /q/[token]/file/[fileId]`, which re-verifies the token and confirms folder membership before streaming (the SA can read the whole tree, so membership is the cross-quote guard). Revocation/expiry is by editing column P/Q in the Sheet; propagates within the ~30s cache TTL.

**Studio dashboard** (`/quotes`, server-gated; absorbs the former explorer): the list joins `listDrafts()` + `listPortalMeta()` and derives an overview (pipeline / open / shared ledger, nearest "up next" event) plus a searchable, filterable, date-sortable quote list. **Profile Overview** (`/quotes/[id]`) shows the client-facing summary, the proofs gallery (via a cookie-gated admin file proxy so it works before any public link exists), an "Open folder" link, and link controls (generate/regenerate/revoke + copy). The app-shell nav links between the dashboard and the calculator.

**Env vars:** `GOOGLE_DRIVE_PARENT_FOLDER_ID` (required for auto-folder; unset ⇒ feature off), `GBJ_QUOTES_OWNER_EMAIL` (optional). Public tokens are raw 128-bit `crypto.randomBytes` — no signing secret needed.

### Lifecycle stages, client approval & itemized pricing (Phase 4)

Each quote moves through a 9-stage pipeline that drives the client portal and the (derived) payment status. No money is ever entered — Janelle advances the stage from Profile Overview, and the deposit/balance "paid" flags follow.

**Quotes columns R–U** (server-managed, Janelle-editable; header now A1:U1): R=Approved at (ISO) · **S=Stage** · **T=Approved by** (client's typed name) · **U=Deposit paid** ($). Written via the same `writePortalCells` single-cell helper and ~30s cache as the Phase 3 portal columns.

**Stage model** (single source of truth: `STAGE_ORDER` / `STAGE_COPY` in `lib/quote-calc-portal.ts`): `inquiry → quote → deposit → proofing → approval → balance → production → delivery → completed`. `production` and `delivery` resolve to **physical** vs **digital** wording (In production/Shipping vs Finalizing files/Delivered); every other stage is shared. **Project type is auto-derived** — `isDigitalQuote(config)` returns digital only when *every* package line is digital (any physical piece ⇒ physical flow). Blank/unknown stage cells normalize to `inquiry`.

**Payments (amount-based)** — there are no online payments. The **expected deposit is a fixed $ amount** (`assumptions.depositAmount`, from the `Settings` tab, per-quote-overridable in the calculator, capped at the total, never in the price math). Janelle records the **actual deposit paid** on Profile Overview (`DepositPaidControl` → `POST …/portal/[id]/deposit` → `setDepositPaid`, column U). The client portal shows **Deposit paid** + **Balance remaining = total − depositPaid**; before any payment it shows the expected "Deposit to begin". (`isDepositPaid`/`isBalancePaid` stage helpers still exist but no longer drive the display.)

**Hidden notes** are editable from Profile Overview (`HiddenNotesControl` → `POST …/drafts/[id]/notes` → `updateHiddenNotes`, which writes readable column K + the `_data` Draft JSON, touching no other field). They remain private — never projected to `/q`.

**Client approval** (`approval` stage only). The public page renders `ApproveProofs` (checkbox → typed name → confirm — two steps so it can't fire by accident). `POST /q/[token]/approve` is **token-gated** exactly like the file proxy (`findByPublicToken` + `isLinkActive`), then `recordApproval(id, name, "approval")` writes R/S/T and **auto-advances the stage** to `balance` (`nextStage`). Idempotent: a second submit is a no-op success; rejected at any non-`approval` stage. The name is stored as-is (no content validation, length-capped).

**Admin** sets the stage via the cookie-gated `POST /quote-calc/api/portal/[id]/stage` (`StageControl`), validated against `STAGE_ORDER`. Profile Overview also shows the deposit-paid control, hidden-notes editor, approval banner, and the itemized client-facing summary (mirrors `/q`). The client portal renders a **horizontal, side-scrollable step tracker** (`buildPublicProgress`, auto-centers the current stage) plus the itemized investment + deposit/balance.

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
- Quote calculator with cost-plus pricing, 7 packages (4 wedding + 3 events), 17-item catalog, 8 add-ons
- Google Sheets persistence for drafts (service-account JWT, cache-first sync, graceful offline fallback)
- Phase 0: HMAC-signed expiring session cookie for `/quote-calc` (forged-cookie regression test in roadmap)
- Phase 1: pricing data externalized to `Settings` + `Items` sheet tabs with 60s cache, validated merge, and an in-app fallback banner naming bad rows
- Phase 2: `Quotes` tab restructured to human-readable columns (client, event, package, line items, total) with the full Draft JSON moved to a hidden `_data` tab; legacy rows auto-migrate on first write
- Phase 3: client portal + Drive proofs — auto-created per-quote Drive subfolder (read+create scopes), public tokenized read-only `/q/[token]` route, streaming file proxy with folder-membership check, and an admin Quote Explorer with link generate/revoke controls. Portal metadata in `Quotes` columns N–R
- Phase 4: lifecycle stages + client approval + itemized client pricing — 9-stage pipeline (physical/digital wording) Janelle drives from Profile Overview (`Quotes` cols S/T), an amount-based deposit (fixed expected `depositAmount` + recorded **deposit paid** in col U, balance = total − paid), editable hidden notes (col K + `_data`), two-step client proof approval that auto-advances `approval → balance`, and a horizontal scrollable step tracker + itemized investment on `/q/[token]`
- Misc add-on section for one-off client requests (selling price, no markup applied)
- Wedding/Events package toggle with event-specific discount controls
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
