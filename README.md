# GutierrezByJanelle

A multi-page business website built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Designed for minimal, clean aesthetics with a content configuration system that separates data from presentation.

## Tech Stack

- **Framework:** Next.js 14 (App Router, Static Site Generation)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with CSS-variable design tokens
- **Infrastructure:** Docker (multi-stage builds for dev and production)
- **Utilities:** clsx + tailwind-merge for className composition

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home / Landing page |
| `/pricing` | Service pricing tiers |
| `/reviews` | Client testimonials |
| `/gallery` | Portfolio / examples |

## Getting Started

### With Docker (recommended)

```bash
docker-compose up
```

App runs at `http://localhost:3000`. Source files are volume-mounted so edits hot-reload.

### Without Docker

```bash
npm install
npm run dev
```

Requires Node.js 18+.

### Production build

```bash
docker build --target runner -t gutierrezbyjanelle .
docker run -p 3000:3000 gutierrezbyjanelle
```

## Project Structure

```
.
├── app/
│   ├── globals.css           # Design tokens (CSS variables) + Tailwind base
│   ├── layout.tsx            # Root layout: shared header + footer
│   ├── page.tsx              # Home page
│   ├── pricing/page.tsx      # Pricing page
│   ├── reviews/page.tsx      # Reviews page
│   └── gallery/page.tsx      # Gallery page
├── components/
│   ├── site-header.tsx       # Global navigation bar
│   └── site-footer.tsx       # Global footer
├── config/
│   └── site.ts               # Central content configuration (siteConfig)
├── utils.ts                  # cn() helper (clsx + tailwind-merge)
├── Dockerfile                # Multi-stage: deps → dev → builder → runner
└── docker-compose.yml        # Dev environment
```

## Content Configuration

All copy, navigation links, pricing tiers, reviews, and gallery data live in `config/site.ts` and are exported as `siteConfig`. No strings should be hardcoded inside components.

```ts
// config/site.ts
export const siteConfig = {
  name: "GutierrezByJanelle",
  mainNav: [...],
  pricing: [...],
  reviews: [...],
  gallery: [...],
};
```

## Theming

Colors are defined as CSS variables in `app/globals.css` and consumed by Tailwind via `tailwind.config.ts`. To change the palette, update the variables in `:root` — all components update automatically.

```css
/* app/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  /* ... */
}
```
