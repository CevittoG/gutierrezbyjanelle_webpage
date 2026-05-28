---
name: GutierrezByJanelle
description: A modern linen-envelope visual system — warm cream paper, a single powder-rose note, two voices of type.
colors:
  paper-cream: "#F8F2ED"
  deep-ink: "#372215"
  card-white: "#FFFFFF"
  warm-tan: "#CCAD8E"
  linen-mist: "#EDE6DE"
  muted-bark: "#6B5647"
  powder-rose: "#EFC8CE"
  warm-thread: "#DAD1C8"
  ring-tan: "#B88C61"
typography:
  display:
    fontFamily: "Square Peg, cursive"
    fontSize: "clamp(2.25rem, 6vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "normal"
  headline:
    fontFamily: "Anybody, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 132
    lineHeight: 1.15
    letterSpacing: "0.04em"
  title:
    fontFamily: "Anybody, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 132
    lineHeight: 1.1
    letterSpacing: "0.04em"
  body:
    fontFamily: "Anybody, sans-serif"
    fontSize: "1rem"
    fontWeight: 132
    lineHeight: 1.6
    letterSpacing: "0.04em"
  label:
    fontFamily: "Anybody, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 132
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.warm-tan}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.ring-tan}"
    textColor: "{colors.deep-ink}"
  button-outline:
    backgroundColor: "{colors.paper-cream}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.powder-rose}"
    textColor: "{colors.deep-ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-hover:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-ink}"
  badge-savings:
    backgroundColor: "{colors.powder-rose}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    padding: "4px 8px"
---

# Design System: GutierrezByJanelle

## 1. Overview

**Creative North Star: "The Modern Linen Envelope"**

The system is the moment before opening something beautiful. Cream paper, a quiet thread of warm beige stitching, a single dusty-rose seal, two voices of type — one cursive, one engineered. Hospitable like a garden-party invitation; tactile like the linen envelope it arrives in; restrained like a contemporary editorial spread. The work — Janelle's real stationery photography — is always the loudest thing on the page; the system around it disappears.

What this is *not*: a generic Etsy seller template (script-font + flat tan + heart bullets), a corporate SaaS landing (gradient hero + three-up feature cards), a Pinterest collage (five fonts, ten photos, no hierarchy), or cold luxury minimalism (white-space-as-status, type too small to read). The taste is in the restraint, not in the absence of warmth.

**Key Characteristics:**
- Warm cream paper (`#F8F2ED`) as the dominant surface; pure white is reserved for the card layer.
- A single accent — Powder Rose (`#EFC8CE`) — appears only as state (hover glow, savings badge, focus underline). Never as a fill, never as a gradient.
- Two-typeface system: an architectural variable sans (Anybody, weight 132, uppercase, tracked) carries the structure; a hand-drawn cursive (Square Peg) signs the headlines.
- Flat at rest. Depth is conveyed by hover-revealed blush glow and backdrop-blurred frosted panels, not by ambient shadows.
- Photography is the hero element on every page; chrome scales itself down to clear the room.

## 2. Colors

The palette is one cream, one ink, one tan, and one rose — plus the neutrals between them. Nothing else. The pink is a guest, not a host: it appears on roughly 5% of any given screen, and its rarity is the entire point.

The canonical source of truth is HSL on CSS custom properties in `app/globals.css`; the hex values in the frontmatter are the sRGB equivalents for tooling compatibility. Don't introduce a third format.

### Primary
- **Warm Tan** (`#CCAD8E` / `hsl(30 38% 68%)`): The brand color. Used for primary button fills, the section-divider stroke, and the focus ring (deepened to Ring Tan). Inherited from the printed paper stock Janelle works with; it should always feel like an ink, never like a background.

### Tertiary
- **Powder Rose** (`#EFC8CE` / `hsl(350 55% 86%)`): The accent. Reserved for: card-hover border-glow and box-shadow, savings badges (`✦`, `✦✦`, `✦✦✦`), nav-link hover underline, and the focus underline on links. It is never a fill larger than a badge, never used in gradients, never on body text.

### Neutral
- **Paper Cream** (`#F8F2ED` / `hsl(30 45% 95%)`): The page background. Tinted warm enough to read as paper, light enough to let photography pop. This is the default surface.
- **Card White** (`#FFFFFF` / `hsl(0 0% 100%)`): The card and elevated-surface fill. The only true white in the system. Use it to lift a card off the cream — never as a section background, or the warmth collapses.
- **Linen Mist** (`#EDE6DE` / `hsl(30 30% 90%)`): Muted surface. Section dividers, subtle alternating bands. A half-step deeper than the page so it reads as a shadow, not a stripe.
- **Warm Thread** (`#DAD1C8` / `hsl(30 20% 82%)`): The border color. All borders are this. Never colored; never accented.
- **Deep Ink** (`#372215` / `hsl(22 45% 15%)`): Body text and headings. A warm brown-black, not a true black — pure black would shatter the paper warmth.
- **Muted Bark** (`#6B5647` / `hsl(25 20% 35%)`): Secondary text (captions, descriptions, helper copy). Always paired with Deep Ink, never on its own.
- **Ring Tan** (`#B88C61` / `hsl(30 38% 55%)`): Focus rings only. A deepened Warm Tan that meets WCAG AA contrast against Paper Cream.

### Named Rules

**The Powder Rose Rule.** Powder Rose is a guest, not a host. It appears on ≤10% of any screen, as state only: hover glow, savings badge, focus underline. It is forbidden as a section background, as a button fill, as body text color, and inside any gradient.

**The No True Black Rule.** Pure `#000` is prohibited. All "dark" values are Deep Ink (`#372215`) or warmer. Even on shadow values: tint toward the paper.

**The One Accent Rule.** There is exactly one accent (Powder Rose). Secondary accents — sage, gold, navy, anything — are forbidden. If a second color is reached for, the answer is restraint, not addition.

## 3. Typography

**Display Font:** Square Peg (with `cursive` fallback)
**Body / Structural Font:** Anybody (variable, with `sans-serif` fallback)

**Character:** A two-voice pairing: Anybody is the architecture — variable-weight sans, set at weight 132, uppercase, with 0.04em tracking — every label, paragraph, and button is set in it. Square Peg is the signature — a hand-drawn cursive used for hero headlines, section titles, plan names, and reviewer credits. The cursive should always read like Janelle's handwriting, not like a wedding cliché. The contrast between architectural sans and personal cursive is the point.

### Hierarchy
- **Display** (Square Peg, 400, `clamp(2.25rem, 6vw, 4rem)`, line-height 1.05): Hero headlines, page titles, signature moments. Never uppercase; never tracked. Mixed case, normal letter-spacing.
- **Headline** (Anybody, weight 132, `clamp(1.5rem, 3vw, 2.25rem)`, line-height 1.15, tracking 0.04em, UPPERCASE): Section headings. The structural counterweight to the cursive Display.
- **Title** (Anybody, weight 132, 1.5rem, line-height 1.1, tracking 0.04em, UPPERCASE): Card titles, sub-section labels.
- **Body** (Anybody, weight 132, 1rem, line-height 1.6, tracking 0.04em, UPPERCASE): All paragraphs, list items, button text. **Body line length is capped at 65–75ch.** The uppercase tracking earns its place because the body weight (132) is light enough that uppercase doesn't shout; if you increase the weight, the uppercase becomes oppressive and you must change to mixed case.
- **Label** (Anybody, weight 132, 0.75rem, tracking 0.12em, UPPERCASE): Small labels, badges, nav helpers. Wider tracking than body to compensate for the smaller size.

### Named Rules

**The Two-Voice Rule.** The system uses exactly two fonts: Square Peg (signature) and Anybody (structure). Adding a third — a serif for body, a mono for code, a script for flourishes — is forbidden. Hierarchy is built through scale and weight contrast, not through font count.

**The Cursive Is a Guest Rule.** Square Peg is reserved for headlines, card titles, plan names, and signature moments. It is forbidden in body copy, navigation, buttons, captions, or any block longer than ~8 words. If you find Square Peg in a paragraph, you've broken the system.

**The Uppercase-Body Caveat.** Body text is uppercase only because Anybody weight 132 is light enough to carry it. If you increase weight (e.g. weight 400+) for any text element, drop the uppercase or the page becomes a shouting match.

## 4. Elevation

Flat by default. Depth is a *response*, not a default state. There is no ambient shadow vocabulary; surfaces sit on the paper until something happens. The only built-in lift is `shadow-sm` on cards at rest — a single hairline shadow whose entire job is to lift the card off the cream by 1px.

Two state-driven elevation moves carry the system:

### Shadow Vocabulary

- **Card hover glow** (`box-shadow: 0 2px 16px -4px hsl(350 55% 86% / 0.4)`): Cards (pricing, reviews) gain a soft Powder Rose halo on hover. The shadow is *colored*, not gray — this is what makes it feel like blush ink bleeding into paper, not like a generic SaaS hover.
- **Vendor card hover glow** (`box-shadow: 0 4px 20px -4px hsl(350 55% 86% / 0.45)`): A deeper version of the same shadow, for vendor-linked cards (Zola, Etsy). Slightly stronger because these cards are conversion-critical.
- **Frosted section panel** (`backdrop-filter: blur(4px); background-color: hsl(30 45% 95% / 0.4)`): The `.section-panel` utility — used over photography or below the watermarked logo on the homepage — creates the only "glass" effect in the system. It is purposeful, never decorative.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat. Hairline `shadow-sm` is the only ambient shadow allowed; everything else is a hover state. Stacked drop shadows, ambient elevation layers, "Material" elevation tiers, and decorative box shadows are all forbidden.

**The Tinted-Shadow Rule.** When a shadow appears, it is tinted with Powder Rose, never pure gray or black. A `rgba(0,0,0,...)` shadow anywhere on this site is a bug.

## 5. Components

### Buttons
- **Shape:** Subtly rounded corners (`6px`, `rounded-md`). Pill buttons are reserved for vendor links (Etsy, Zola, Instagram).
- **Primary:** `Warm Tan` background, `Deep Ink` text, `8px 16px` padding, `40px` height. Hover deepens to `Ring Tan`. Used for: primary CTAs (`Invest in your event`, `Inquire`).
- **Outline:** Transparent on `Paper Cream`, `Warm Thread` border, `Deep Ink` text. Hover fills with `Powder Rose` and keeps Deep Ink text. Used for: secondary CTAs that should feel quieter.
- **Ghost:** No border, transparent background, `Deep Ink` text. Hover gains a Powder Rose fill. Used for: nav items, icon-only buttons, in-card actions.
- **Link:** Underlined `Warm Tan` text, no fill, no border. Used for inline text actions.
- **Hover / Focus:** Color transitions (200ms). Focus-visible ring is a 2px `Ring Tan` outline with 2px offset. Never animate the border-radius or transform on focus.
- **Vendor pill buttons** (Etsy, Zola, Instagram): full-radius pill shape (`rounded-full`), thin Warm Thread border, icon + label inside. The only place pill shapes are allowed.

### Cards
- **Corner Style:** Rounded `8px` (`rounded-lg`).
- **Background:** `Card White` (`#FFFFFF`). The only fill allowed. Tinted backgrounds (`bg-muted`, etc.) are forbidden on cards.
- **Border:** `1px solid Warm Thread` (`#DAD1C8`).
- **Shadow Strategy:** `shadow-sm` at rest. On hover, border deepens to `Powder Rose / 0.8` and the card gains the Card hover glow box-shadow (see Elevation). Transition: `border-color 200ms ease, box-shadow 200ms ease`.
- **Internal Padding:** `16px` on mobile, `24px` on `md+`.
- **Nested cards are forbidden.** If a card needs to contain another card, the layout is wrong.

### Price Card (signature)
- Built on the base Card.
- The plan name (`Sweet Spot Suite`, `Signature Suite`) is set in **Square Peg Display** — this is one of the few places cursive appears outside hero moments. It signals that the plan is bespoke, not a SKU.
- The savings indicator is a **floating badge** in the top-right corner: `Powder Rose / 30%` background, `Powder Rose / 40%` border, displaying `✦`, `✦✦`, or `✦✦✦`. The asterism count escalates with discount tier; the symbol is decoupled from the numeric discount.
- Features list uses lucide `Check` icons (16px, Deep Ink) with `Muted Bark` text. Each feature is a hover-preview target that surfaces a small image of the item.

### Review Card
- Built on the base Card.
- Body is set as a `<blockquote>` in Anybody, weight 132 — note that body type, while uppercase by default, drops to mixed case for review quotes so the author's voice isn't shouted. **This is a sanctioned exception to the uppercase-body rule, and the only one.**
- Author and role line use Square Peg Display for the author name; role stays in Anybody Label.

### Inputs / Fields
- **Style:** `1px solid Warm Thread` border, `Card White` background, `6px` (`rounded-md`) radius, `40px` height. Internal padding `8px 12px`. Body type at 1rem, mixed case (override the uppercase body rule for inputs — typing in caps is hostile).
- **Focus:** Border deepens to `Ring Tan`; a 2px `Ring Tan` outline-ring appears with 2px offset. No glow, no animation.
- **Error:** Border `Deep Ink`, error message in `Muted Bark`. No red — red would shatter the palette.
- **Disabled:** `Linen Mist` background, `Muted Bark` text, no border change.

### Navigation
- **Style:** Sticky header on `Paper Cream / 80%` with backdrop blur. Logo / wordmark left, nav links right (collapses to hamburger sheet under `md`).
- **Nav links:** Anybody Body weight 132, uppercase, tracked. Default state: `Deep Ink`. Hover: `Powder Rose` underline, 4px offset, 2px thickness. Active route: same Powder Rose underline, persistent.
- **Focus:** 2px `Ring Tan` outline, 4px offset, 2px border-radius.
- **Mobile:** Slide-in Sheet from the right; nav links stack vertically with `24px` gap.

### Badges
- **Savings Badge** (✦ asterism): `Powder Rose / 30%` background, `Powder Rose / 40%` border, `Deep Ink / 80%` text, pill radius, `2px 10px` padding, tracked.
- **Standard Badge:** `Linen Mist` background, `Deep Ink` text, pill radius. Used for metadata (year, role label).

### Signature Components

**Stationery Hero (homepage):** Two portrait cards in a flex row with framer-motion entrance stagger (each card fades + lifts 16px over 600ms, delayed by 120ms). On hover, each card lifts 8px and rotates ±1.5deg. Right column carries the headline in Square Peg Display + a CTA in primary button.

**Logo Watermark:** Janelle's logo SVG sits behind the homepage content at 20% opacity, fixed-position, centered. It is not a content element; it is paper grain.

**Marquee Ticker:** Used in footer (and possibly elsewhere) as a slow horizontal scroll of recent client names or service tags. Keyframe `marquee-scroll` translates `-50%` over a long duration. Respect `prefers-reduced-motion`.

## 6. Do's and Don'ts

### Do:
- **Do** use Powder Rose (`#EFC8CE`) on roughly 5% of any given screen, as state only — hover glow, savings badge, focus underline.
- **Do** keep cards on pure `Card White` (`#FFFFFF`) — it's the only true white in the system and it earns its job by lifting cards off the cream.
- **Do** use Square Peg (cursive) for hero headlines, plan names, and signature moments only. It is a guest, not a host.
- **Do** cap body line length at 65–75ch; longer lines collapse readability for the older family members reading on phones.
- **Do** tint every shadow toward Powder Rose. A `rgba(0,0,0,...)` shadow anywhere on the site is a bug.
- **Do** use Deep Ink (`#372215`) instead of pure black for all text and borders — pure black shatters the paper warmth.
- **Do** test layouts with longer Spanish strings (review #2 is in Spanish, and longer translated copy is the norm). Truncation is failure.
- **Do** honor `prefers-reduced-motion` on every new animation. The global override is already in `globals.css`; don't fight it.
- **Do** keep the focus ring as 2px `Ring Tan` with 2px offset. It's WCAG-clean against Paper Cream.

### Don't:
- **Don't** introduce a second accent color. There is one accent (Powder Rose). Sage, gold, navy, terracotta — all forbidden. If a second color is reached for, the answer is restraint, not addition.
- **Don't** use stock script fonts (Allura, Great Vibes, Pinyon Script, Sacramento). The cursive in this system is Square Peg, by name, and only Square Peg. Anything else is the **Generic Etsy Seller Template** anti-reference.
- **Don't** ship a gradient hero, a "Trusted by" logo strip, or three-up feature cards with icon-heading-paragraph. That is the **Corporate SaaS Landing** anti-reference and it is forbidden here.
- **Don't** pile up five fonts, ten photos, and sparkles. That is the **Pinterest-Board Chaos** anti-reference. Hierarchy is built through scale and weight, not quantity.
- **Don't** shrink type or strip warmth in pursuit of "luxury." That is the **Cold Luxury / Minimal-to-a-Fault** anti-reference. Restraint with warmth, not restraint as absence.
- **Don't** use heart bullets (`♡`, `❤`), heart-emoji decorations, or any pictogram of love. Janelle's own copy carries the warmth; the design must not redecorate it.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards, callouts, or alerts. Side-stripe borders are forbidden.
- **Don't** use `background-clip: text` on a gradient. Gradient text is forbidden. Emphasis comes from weight or size.
- **Don't** reach for glassmorphism by default. The `.section-panel` frosted-glass utility is the *only* sanctioned use; anywhere else is decorative and forbidden.
- **Don't** open a modal as the first thought. Modals are usually laziness; exhaust inline/progressive alternatives first.
- **Don't** use em dashes (—) or `--` in copy. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** put Square Peg in body copy, navigation, buttons, captions, or any block longer than ~8 words. If you find cursive in a paragraph, you've broken the system.
- **Don't** ship a layout that breaks when a Spanish string is 30% longer than its English equivalent.
- **Don't** use pure `#000` or `#FFF` anywhere except `Card White` (which is the one sanctioned white).
