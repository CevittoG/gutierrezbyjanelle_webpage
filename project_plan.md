# GutierrezByJanelle — Project Plan

Multi-page business website for Janelle's brand. Built with Next.js 14, TypeScript, Tailwind CSS, and Docker. Architecture follows SOLID principles so content and aesthetics can be iterated without touching structure or logic.

---

## Current State (as of 2026-05-17)

### What exists
- Next.js 14 App Router scaffold with TypeScript
- Multi-stage Dockerfile (dev + prod) and docker-compose
- Tailwind CSS with CSS-variable design token system in `globals.css`
- `app/layout.tsx` with shared `SiteHeader` + `SiteFooter`
- `components/site-header.tsx` and `components/site-footer.tsx` (both import `siteConfig`)
- `clsx` and `tailwind-merge` installed

### What is broken / missing
- [ ] `config/site.ts` does not exist — **app will not build** until created
- [ ] `utils.ts` is empty — `cn()` helper not implemented
- [ ] `app/page.tsx` renders a Pricing view, not the homepage
- [ ] `components/page.tsx` is a Reviews component in the wrong location
- [ ] No `app/pricing/`, `app/reviews/`, or `app/gallery/` route directories
- [ ] `site.ts` at root is an empty, unused stub
- [ ] `shadcn/ui` not installed

---

## Code Guidelines

### File responsibilities
| Location | Contains |
|----------|----------|
| `config/site.ts` | All content: copy, nav links, pricing tiers, reviews, gallery refs |
| `app/globals.css` | Design tokens only (CSS variables) |
| `tailwind.config.ts` | Maps CSS variables to Tailwind utilities |
| `utils.ts` | Pure utility functions (`cn()`, etc.) |
| `app/layout.tsx` | Shell only: imports header/footer, sets metadata |
| `app/<route>/page.tsx` | Page view: composes section components using `siteConfig` data |
| `components/ui/` | Reusable primitives: PriceCard, ReviewCard, GalleryGrid |
| `components/site-header.tsx` | Global nav |
| `components/site-footer.tsx` | Global footer |

### Rules
- **No hardcoded strings in components.** All display text comes from `siteConfig`.
- **No inline colors.** Use only Tailwind token utilities (`bg-background`, `text-muted-foreground`). Raw hex/rgb values belong in `globals.css` CSS variables only.
- **`cn()` for all className composition.** Never concatenate class strings manually.
- **Narrow prop interfaces.** Each component's props type covers only what that component needs — nothing more.
- **`className` passthrough on every component.** Wrap with `cn(defaults, className)` so any component can be extended visually without modification.
- **Types live next to their data.** Define `PricePlan`, `Review`, `NavItem`, etc. in `config/site.ts` alongside the data.

### Naming
- Components: PascalCase files (`PriceCard.tsx`) with named exports
- Pages: lowercase route dirs (`app/pricing/page.tsx`), default exports
- Utilities: camelCase (`cn`, `formatCurrency`)

---

## Phase 1 — Make It Build
**Goal:** App compiles and all 4 routes render with placeholder content.

### Tasks
- [ ] **Implement `utils.ts`** — add `cn()` helper using `clsx` + `tailwind-merge`
- [ ] **Create `config/site.ts`** — define types and export `siteConfig` with placeholder data for: `name`, `description`, `mainNav`, `pricing`, `reviews`, `gallery`
- [ ] **Fix `app/page.tsx`** — replace pricing content with a proper Home/Landing page skeleton
- [ ] **Create `app/pricing/page.tsx`** — move pricing view here, reading from `siteConfig.pricing`
- [ ] **Create `app/reviews/page.tsx`** — move reviews view here (currently at `components/page.tsx`), reading from `siteConfig.reviews`
- [ ] **Create `app/gallery/page.tsx`** — skeleton gallery page reading from `siteConfig.gallery`
- [ ] **Delete stubs** — remove `site.ts` (root) and `components/page.tsx` (misplaced)

### Verification
```bash
npm run build    # must complete with 0 errors
npm run dev      # visit /, /pricing, /reviews, /gallery — all must render
```

---

## Phase 2 — UI Components
**Goal:** Each page has real, styled, reusable components. shadcn/ui wired in.

### Tasks
- [ ] **Install shadcn/ui** — `npx shadcn-ui@latest init` (use CSS variables, no src/ dir)
- [ ] **Add shadcn primitives as needed** — Button, Card, Badge at minimum
- [ ] **Create `components/ui/price-card.tsx`** — accepts `PricePlan`, displays name/price/features; uses shadcn Card
- [ ] **Create `components/ui/review-card.tsx`** — accepts `Review`, blockquote style
- [ ] **Create `components/ui/gallery-grid.tsx`** — responsive CSS grid, accepts `GalleryItem[]`
- [ ] **Homepage hero section** — headline, subheadline, CTA button; reads `siteConfig.hero`
- [ ] **Mobile navigation** — hamburger/sheet menu for small screens in `site-header.tsx`

### Verification
```bash
npm run dev    # all pages render with shadcn components, no layout breaks
# resize browser to mobile — nav should collapse
```

---

## Phase 3 — Real Content & Visual Polish
**Goal:** Janelle's actual business content, brand colors, and final typography.

### Tasks
- [ ] **Populate `config/site.ts`** — real service names, prices, testimonials, gallery image paths
- [ ] **Add gallery images** — place in `public/gallery/`, reference in `siteConfig.gallery`
- [ ] **Brand colors** — update CSS variables in `app/globals.css` to match Janelle's palette
- [ ] **Typography** — load a Google Font (e.g., via `next/font`), apply to `body` in `layout.tsx`
- [ ] **Responsive audit** — test all pages at 375px, 768px, 1280px
- [ ] **Accessibility pass** — check heading hierarchy, alt text on images, focus states

### Verification
```bash
npm run dev    # walk through all pages with real content
# mobile emulation in browser devtools
```

---

## Phase 4 — Production Readiness
**Goal:** SEO, performance, and a clean Docker prod build.

### Tasks
- [ ] **Per-page metadata** — add `export const metadata` to each `page.tsx` (title, description, og:image)
- [ ] **Sitemap** — add `app/sitemap.ts` using Next.js built-in sitemap support
- [ ] **Favicon & og:image** — add to `public/`, reference in `app/layout.tsx`
- [ ] **Docker prod build** — verify multi-stage build produces a working image
- [ ] **Lighthouse audit** — target 90+ on Performance, Accessibility, Best Practices, SEO

### Verification
```bash
npm run build && npm run start    # prod mode locally
docker build --target runner -t gutierrezbyjanelle . && docker run -p 3000:3000 gutierrezbyjanelle
# run Lighthouse in Chrome devtools
```

---

## Commands Reference

### Local development (no Docker)
```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # verify production build
npm run lint        # catch type/lint errors
```

### Local development (Docker)
```bash
docker-compose up           # first run builds the image
docker-compose up --build   # rebuild after Dockerfile or dep changes
docker-compose down         # stop and remove containers
```

### Production image
```bash
docker build --target runner -t gutierrezbyjanelle .
docker run -p 3000:3000 gutierrezbyjanelle
```

### shadcn/ui (Phase 2)
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge
```
