---
name: GutierrezByJanelle
description: A modern linen-envelope visual system (live look "Linen, Re-inked") with linen paper, olive ink, a sage thread, one chestnut wax seal, and two voices of type.
colors:
  linen-cream: "#F7F4ED"
  card-linen: "#FCFBF7"
  olive-ink: "#292F22"
  deep-olive: "#4E5C3D"
  sage-mist: "#E4E9DD"
  moss-bark: "#525A49"
  sage-thread: "#9CAE8F"
  linen-border: "#D1D3C5"
  chestnut: "#815237"
  chestnut-deep: "#623B28"
  chestnut-light: "#D2A37F"
  chestnut-tint: "#EFE2D7"
  ring-chestnut: "#74482F"
typography:
  display:
    fontFamily: "Square Peg, cursive"
    fontSize: "clamp(3rem, 7vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "normal"
  display-hero:
    fontFamily: "Square Peg, cursive"
    fontSize: "clamp(3.75rem, 9vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "normal"
  title:
    fontFamily: "Square Peg, cursive"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Anybody, sans-serif"
    fontSize: "1rem"
    fontWeight: 132
    lineHeight: 1.6
    letterSpacing: "0.04em"
  prose:
    fontFamily: "Anybody, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 300
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Anybody, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 132
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "96px"
components:
  button-solid:
    backgroundColor: "{colors.deep-olive}"
    textColor: "{colors.card-linen}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-solid-hover:
    backgroundColor: "{colors.olive-ink}"
    textColor: "{colors.card-linen}"
  button-seal:
    backgroundColor: "{colors.chestnut}"
    textColor: "{colors.card-linen}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-seal-hover:
    backgroundColor: "{colors.chestnut-deep}"
    textColor: "{colors.card-linen}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.olive-ink}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "transparent"
    textColor: "{colors.chestnut}"
  paper-card:
    backgroundColor: "{colors.card-linen}"
    textColor: "{colors.olive-ink}"
    rounded: "{rounded.lg}"
    padding: "56px 28px"
  wax-seal:
    backgroundColor: "{colors.chestnut}"
    textColor: "{colors.card-linen}"
    rounded: "{rounded.pill}"
    size: "48px to 64px"
  chip:
    backgroundColor: "{colors.card-linen}"
    textColor: "{colors.olive-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  chip-active:
    backgroundColor: "{colors.chestnut-tint}"
    textColor: "{colors.olive-ink}"
    rounded: "{rounded.pill}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.olive-ink}"
    padding: "4px 0"
---

# Design System: GutierrezByJanelle

## 1. Overview

**Creative North Star: "The Modern Linen Envelope"**

The system is the moment before opening something beautiful. The live look, **"Linen, Re-inked"** (live since 2026-09), takes that literally: the home page opens with an envelope whose wax seal breaks, cards are stitched linen paper, and a chestnut seal pressed with Janelle's monogram marks the moments that matter. It is hospitable like a garden-party invitation, tactile like the envelope it arrives in, and restrained like a contemporary editorial spread. Janelle's real stationery photography is always the loudest thing on the page; the system around it recedes.

What this is *not*: a generic Etsy seller template (script font, flat tan, heart bullets), a corporate SaaS landing (gradient hero, three-up feature cards), a Pinterest collage (five fonts, ten photos, no hierarchy), or cold luxury minimalism (white space as status, type too small to read). The taste is in the restraint, not in the absence of warmth.

**Key Characteristics:**
- Linen cream (`#F7F4ED`) is the page; card linen (`#FCFBF7`) is the paper that sits on it. There is no pure white anywhere.
- Olive ink (`#292F22`) for text and deep olive (`#4E5C3D`) for primary actions and the footer band. Sage is structural (stitching, muted bands), never an accent.
- One accent: **Chestnut** (`#815237`), the wax seal. It is an *ink*: solid seals, the Email call to action, eyebrows, links, the active-nav underline.
- Two voices of type: Anybody (architectural, weight 132, uppercase, tracked) carries the structure; Square Peg (hand-drawn cursive) signs the headlines.
- Flat paper with craft details: a faint dot grain, a dashed stitch 8px inside the edge, wax seals with a pressed rim. Depth appears only on the envelope hero, the suite fan and hover.

The previous look (Paper Cream, Powder Rose, Warm Tan, pink-glossy `.glass` cards) is retired from the live site. It survives only in the hidden `/v1` "Classic" archive, scoped under `:root:has(.classic-root)` in `app/globals.css`.

## 2. Colors

One linen, one ink, one olive, one sage thread and one chestnut, plus the neutrals between them. Nothing else.

The source of truth is HSL on CSS custom properties in the `:root` block of `app/globals.css`; the hex values here are the sRGB equivalents. `lib/og-brand.ts` mirrors them as hex for the generated images (link-preview card, favicon), which can't read CSS variables; keep the two in sync.

### Primary
- **Deep Olive** (`#4E5C3D` / `hsl(88 20% 30%)`): Primary buttons ("Wedding investment"), the footer band, and dark toggles in the quote tools. Hover deepens to Olive Ink. Card-linen text on it is 6.7:1.

### Accent
- **Chestnut** (`#815237` / `hsl(22 40% 36%)`): The wax seal. Used as solid fills (seals, the Email button, the "on target" health dot), as ink (eyebrow text via Ring Chestnut, "See the collections" links, active-nav underline, active chip borders), and for thin rules. 6.0:1 on linen, 6.4:1 on card linen, and card-linen text on chestnut is 6.2:1.
- **Chestnut Deep** (`#623B28` / `hsl(20 42% 27%)`): Accent hover and the seal's rim and shadow.
- **Chestnut Light** (`#D2A37F` / `hsl(26 48% 66%)`): The seal's specular highlight, and link hover on the olive footer. Hover only: 3.2:1 on olive is too low for resting text.
- **Chestnut Tint** (`#EFE2D7` / `hsl(28 42% 89%)`, token `--accent-soft`): The pale surface for chips and badges that carry ink text (active filters, option chips, discount pills, "paid" badges). Olive ink on it is 10.8:1.
- **Ring Chestnut** (`#74482F` / `hsl(22 42% 32%)`): Focus rings and eyebrow text. 7.0:1 on linen.

### Neutral
- **Linen Cream** (`#F7F4ED` / `hsl(40 38% 95%)`): The page background. Warm enough to read as paper, light enough to let photography carry the page.
- **Card Linen** (`#FCFBF7` / `hsl(42 50% 98%)`): The paper layer: stitched cards, tier envelopes, chips, the sticky bar's text. The lightest value in the system.
- **Sage Mist** (`#E4E9DD` / `hsl(84 20% 89%)`): Muted section bands ("How it works", the letters on Weddings and Events) and the tier-card flap.
- **Sage Thread** (`#9CAE8F` / `hsl(95 16% 62%)`): The dashed stitch inside paper cards. Structural only; never text, never a fill.
- **Linen Border** (`#D1D3C5` / `hsl(70 14% 80%)`): All borders and dividers.
- **Olive Ink** (`#292F22` / `hsl(90 16% 16%)`): Body text and headings. 12.5:1 on linen.
- **Moss Bark** (`#525A49` / `hsl(88 10% 32%)`): Secondary text: captions, descriptions, helper copy. 6.6:1 on linen, 5.8:1 on sage mist.

### Named Rules

**The One Accent Rule.** Chestnut is the only accent. Sage is a neutral in this system (thread and muted bands), not a second accent. Terracotta, rose, gold, navy: all forbidden. If a second color is reached for, the answer is restraint.

**The Chestnut Is Ink Rule.** Chestnut is dark, so it works as a solid fill or as text, never as a translucent wash behind text. `bg-accent/40`-style tints under olive ink drop to about 2 to 3:1 and read muddy; use Chestnut Tint (`bg-accent-soft`) instead. Decorative marks with no text on them (progress tracks, dots, rules) may use chestnut at partial opacity.

**The No Pure Black or White Rule.** `#000` and `#FFF` are prohibited everywhere, shadows included. The darkest value is Olive Ink; the lightest is Card Linen.

## 3. Typography

**Display font:** Square Peg (with `cursive` fallback)
**Body / structural font:** Anybody (variable, with `sans-serif` fallback)

Both load through `next/font/google` in `app/layout.tsx`. The generated images load the same two fonts from Google Fonts at build time (`lib/og-brand.ts`).

**Character:** Anybody is the architecture: weight 132, uppercase, 0.04em tracking, set on `<body>` so every label, button and short line inherits it. Square Peg is the signature: hero headlines, section titles, plan and piece names, reviewer names, the mobile menu. It should always read like Janelle's handwriting, not a wedding cliché.

### Hierarchy
- **Display hero** (Square Peg 400, `text-7xl` to `md:text-8xl`, line-height 0.95): the home hero headline only.
- **Display** (Square Peg 400, `text-5xl` to `md:text-7xl`, line-height about 0.95): page titles and section headings ("What's in a suite", "Wedding Suites", "Let's design your day").
- **Title** (Square Peg 400, `text-3xl` to `text-4xl`): tier names, occasion cards, reviewer names, mobile-menu links.
- **Body** (Anybody 132, 1rem, uppercase, 0.04em): short lines, buttons, list items.
- **Prose** (`.font-anybody-prose`: Anybody 300, mixed case, normal tracking, `text-lg`, relaxed leading): anything longer than a sentence (hero subheadline, section intros, Janelle's letters, review quotes, the call-to-action body). Line length stays at 65 to 75ch (`max-w-md` to `max-w-xl`).
- **Label** (Anybody 132, 10 to 11px, uppercase, 0.14em to 0.22em tracking): eyebrows, nav links, chip text, small captions.

### Named Rules

**The Two-Voice Rule.** Exactly two fonts: Square Peg and Anybody. No third face for body, code, or flourishes.

**The Cursive Is a Guest Rule.** Square Peg never sets body copy, buttons, captions, or any block longer than about 8 words.

**The Prose Exception.** Uppercase weight-132 body is for short lines. Multi-sentence copy switches to `.font-anybody-prose` so it reads warmly instead of shouting. This replaces the old "reviews only" exception.

**The Hairline Label Caveat.** Anybody at weight 132 has hairline strokes, so 10 to 11px labels read pale even at full contrast. Keep anything a client must read (prices, dates, instructions) at 12px or larger, or use Prose.

## 4. Elevation

Flat paper by default. Depth comes from craft details and from the few moments that are allowed to move.

### Surface details
- **Paper grain** (`.site-paper`): card linen with a 1px dot grid at 3.5% olive ink, 5px pitch. Texture you notice only up close.
- **Stitch** (`.site-stitch`): a 1.5px dashed Sage Thread line inset 8px from the card edge, like a sewn envelope.
- **Wax seal** (`.site-seal`): a radial chestnut gradient (Chestnut Light highlight at 35%/30%, Chestnut, Chestnut Deep) with two inset rims and a short chestnut-deep drop shadow. It carries `z-index: 1` so it sits above the stitch line it overlaps.

### Shadow vocabulary
- **Rest:** paper cards have no shadow. Photos and suite pieces carry a soft olive-ink shadow (`0 18px 40px -20px`, olive ink at 50%).
- **Hover on tier envelopes:** the card lifts 6px with a chestnut halo (`0 24px 50px -24px`, chestnut at 55%) and the flap tips open.
- **Envelope hero:** the envelope body sits on a long, soft olive shadow; the rising card has its own.

### Named Rules

**The Flat-By-Default Rule.** No ambient elevation tiers, no stacked drop shadows. A shadow means something is lifted or about to open.

**The Tinted-Shadow Rule.** Shadows are tinted olive ink or chestnut, never neutral gray. `rgba(0,0,0,...)` is a bug.

## 5. Components

The live site's primitives live in `app/(site)/_components/` (`ui.tsx`, `shell.tsx`, page components, `suite-showcase.tsx`) with site-only classes in `app/(site)/site.css`.

### Buttons (`SiteButton`)
- **Shape:** 3px radius (`rounded-[3px]`), 44px minimum height, `12px 20px` padding, Label type (12px, 0.14em tracking), uppercase.
- **Solid:** Deep Olive fill, card-linen text; hover goes to Olive Ink. Primary navigation actions ("Wedding investment").
- **Seal:** Chestnut fill, card-linen text; hover goes to Chestnut Deep. Reserved for the **one** conversion action in a block, usually "Email Janelle". One seal button per group.
- **Outline:** olive-ink border at 30%, translucent card-linen fill; hover turns border and text chestnut. Secondary actions (Instagram, Etsy, Zola, "Event investment").
- **Focus:** 2px Ring Chestnut ring with 2px offset. Never animate radius on focus.

### Eyebrow
Label type in Ring Chestnut, preceded by a 32px chestnut rule. Sits above every section heading.

### Paper card (stitched)
`.site-paper` + `.site-stitch`, 4px radius, Linen Border edge, generous padding (56 to 64px vertical, 24 to 64px horizontal). Often crowned by a wax seal that overlaps the top edge. Used for the call-to-action block, Janelle's letters and the About bio. **Nested cards are forbidden.**

### Wax seal
48 to 64px circle. It holds exactly one mark:
- Janelle's monogram (`LogoMark`, the logo SVG as a CSS mask in the seal's text color) on the envelope hero and the call-to-action card.
- A step number on "How it works".
- The savings asterisms (`✦`, `✦✦`, `✦✦✦`) on tier cards. These are relative only; never a percentage.
- An opening quote mark on review cards.

The seal is state-free: no hover, no link.

### Tier envelope (Weddings, Events)
Paper card with a Sage Mist triangular flap at the top and a wax seal on the flap carrying the ✦ savings mark. Tier name in Title, "What's included" as a chestnut Label, features with check marks, and an outline "Ask about this suite" button that opens an email with the suite name in the subject. Hover: lift, chestnut halo, flap tips open.

### Review card
Stitched paper card, slightly rotated (cycling between -2° and 1.5°, straightening on hover), a quote-mark seal overlapping the top-left corner, the quote in Prose, the author in Title.

### Chips
Pill radius (the only pill shapes besides seals). Card-linen fill, Linen Border edge, Label type. Active or hovered: chestnut border and text, or a Chestnut Tint fill in the quote tools. Used for gallery filters, suite-piece names, and quote-builder options.

### Navigation (`SiteShell`)
- **Header:** transparent over the page, then Linen Cream at 85% with backdrop blur and a bottom border once scrolled past 12px. Monogram and Square Peg wordmark on the left; Label-type nav links; EN/ES toggle; a seal "Email Janelle" button on desktop.
- **Nav links:** active and hover show a 2px chestnut underline that grows from the left.
- **Mobile menu:** drops down under the header; links in Square Peg `text-4xl`, numbered 01 to 06 in Label type.
- **Sticky mobile bar:** under `md`, a fixed bottom bar with Email (seal) and Instagram (outline) side by side. The page reserves 80px of bottom padding so it never covers the footer.
- **Footer:** Deep Olive band with "Talk soon" in Square Peg, nav and contact links; link hover in Chestnut Light.

### Signature components
- **Envelope hero (home):** the seal breaks (0.25s), the flap opens (0.75s), and the invitation rises out (1.55s). "Open again" replays it. Under reduced motion it renders already open.
- **Suite showcase (`SuiteShowcase`, home):** the real suite pieces fanned out, each at its true proportions (landscape pieces lie wide; nothing is cropped). Fixed hover columns flip through them: the active piece straightens and zooms to readable size while the others close ranks and step aside, and the matching chip highlights. Click (or Enter) opens the full design in the lightbox. On phones it becomes a swipeable strip; tap opens the lightbox.
- **Marquee:** the à-la-carte items as a slow, hover-pausing horizontal ticker on Weddings and Events (and the home page).
- **Gallery:** chip filters over a 2/3/4-column masonry of real photos; the lightbox has arrows, keyboard and Esc.

### Generated brand images
- **Link-preview card** (`app/opengraph-image.tsx`, 1200×630): stitched linen card, monogram seal, the name in Square Peg and the tagline in Anybody.
- **Favicon** (`app/icon.tsx`, 64×64): the "G" alone, pressed into a chestnut seal, cropped and thickened to read at tab size.

### Quote tools
The gated tools (`/quotes`, `/quote/new`, the client page `/q/[token]`, print) share the same tokens. Their chips and badges use Chestnut Tint with olive-ink text; solid dark toggles use Olive Ink or Deep Olive. Status colors (margin, sync state) stay semantic and outside the palette rules.

## 6. Do's and Don'ts

### Do:
- **Do** keep chestnut to seals, one seal button per block, eyebrows, links and active states. It should feel like a stamp, not a theme color.
- **Do** put text on Chestnut Tint, never on a translucent chestnut wash.
- **Do** use Prose for anything longer than a sentence, and cap line length at 65 to 75ch.
- **Do** keep client-critical text at 12px or larger; hairline 10 to 11px labels are for eyebrows and captions only.
- **Do** tint every shadow olive ink or chestnut.
- **Do** test layouts with longer Spanish strings. Truncation is failure.
- **Do** honor `prefers-reduced-motion` on every animation; the reveals, the envelope and the fan already do.
- **Do** keep `lib/og-brand.ts` hex values in sync when a token changes.

### Don't:
- **Don't** introduce a second accent. Sage is a neutral here; terracotta, rose, gold, navy are all forbidden.
- **Don't** bring back Powder Rose, Warm Tan or the pink-glossy `.glass` surfaces on the live site. They belong to the `/v1` Classic archive.
- **Don't** put more than one mark in a seal, make a seal clickable, or use a seal as decoration without a mark.
- **Don't** use stock script fonts (Allura, Great Vibes, Pinyon Script, Sacramento). The cursive is Square Peg only.
- **Don't** ship a gradient hero, a "Trusted by" logo strip, or three-up icon/heading/paragraph feature cards.
- **Don't** pile up fonts, photos and sparkles. Hierarchy comes from scale and weight, not quantity.
- **Don't** shrink type or strip warmth in pursuit of "luxury."
- **Don't** use heart bullets or heart emoji. Janelle's own copy carries the warmth.
- **Don't** use colored side-stripe borders wider than 1px, or gradient text (`background-clip: text`).
- **Don't** open a modal as the first thought; the lightbox is the sanctioned exception.
- **Don't** use em dashes (—) or `--` in site copy. Use commas, colons, semicolons, periods or parentheses.
- **Don't** put Square Peg in body copy, buttons, captions or any block longer than about 8 words.
- **Don't** use pure `#000` or `#FFF` anywhere.
