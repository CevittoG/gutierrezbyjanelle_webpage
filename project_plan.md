You are an expert Frontend Architect specializing in clean code, Docker containerization, Next.js, and TypeScript. I am a Backend Engineer starting a new project: a multi-page website for my wife's new business. 

I need you to generate the foundational project structure, configuration files, Docker environment, and core components. We must strictly adhere to a SOLID software development approach so that I can easily iterate on the aesthetics (colors, typography, layouts) with my wife across all pages without breaking functionality.

### 1. The Technology Stack & Environment
- **Environment:** Docker containerization starting from a standard Linux base (e.g., Node alpine/debian) to replicate a production host.
- **Framework:** Next.js (App Router, optimized for Static Site Generation/Production builds)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS + shadcn/ui (Radix Primitives)

### 2. Website Structure & Pages
The application must support a clean, multi-page layout handled via Next.js App Router:
- `/` (General Welcome / Landing Page)
- `/pricing` (Pricing Page)
- `/reviews` (Reviews/Testimonials Page)
- `/gallery` (Examples/Portfolio Gallery Page)

### 3. Aesthetic & UX Requirements
- Minimalist, trendy, and highly light/bright.
- Balanced, neutral color palette (lots of whitespace, clean grays/stones/zinc).
- Easy, uncluttered user experience across all pages.

### 4. Architectural Requirements (SOLID Mapping)
- **Single Responsibility (SRP):** Separate data/content, global layouts, navigation components, and page-specific views. UI elements (buttons, cards) must be decoupled from section containers.
- **Open/Closed (OCP):** UI elements must be open for visual extension but closed for modification. Use `clsx`/`tailwind-merge` so wrapper components can accept custom styling extensions via `className` without changing core logic.
- **Liskov Substitution (LSP):** Custom wrappers (e.g., custom links or buttons used in navigation) must fully extend and be substitutable for their native HTML or Next.js primitive counterparts.
- **Interface Segregation (ISP):** Component prop interfaces must be small and modular. For example, a `PriceCard` component should only require a highly specific `PricePlan` interface, completely independent of global layout states.
- **Dependency Inversion (DIP):** Abstract page data fetching or submission. Navigation systems and page elements must depend on a localized configuration scheme (`siteConfig.ts`), decoupling the visual presentation from the underlying hardcoded strings.

### 5. Implementation Goals
Please provide:

1. **Docker Infrastructure:** 
   - A production-ready, multi-stage `Dockerfile` leveraging a standard Linux base image (e.g., `node:20-alpine`) that handles dependency installation, building the static Next.js application, and running it efficiently.
   - A `docker-compose.yml` file for streamlined local development mapping volumes and ports properly.

2. **Design Tokens (`tailwind.config.js` or `globals.css`):** 
   - A centralized theme configuration mapping out CSS variables for background, foreground, primary, secondary, and neutral shades to easily change the global color scheme in one place.

3. **Global Navigation & Content Schema (`siteConfig.ts`):**
   - A central TypeScript file storing all copy, pricing tiers, review data, gallery image references, and the primary navigation links. All pages must consume data from this file.

4. **Multi-Page App Router Scaffolding:**
   - The root layout (`layout.tsx`) incorporating a global, minimalist Header/Navigation bar and Footer shared across all pages.
   - Clean, skeleton route directories for `/`, `/pricing`, `/reviews`, and `/gallery` utilizing the central content configuration.

Provide production-ready configurations, Docker settings, and the structural skeleton of the code.