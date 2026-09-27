# Quote Builder — Analysis & Redesign Hand-off

**Status:** approved direction, **not implemented**. This document is the hand-off for the
implementation. It describes today's system, what is wrong with it, the target design, and the
phased plan (Google Sheet, formula, data model, builder UI, Profile Overview / portal / print,
and a file-by-file change inventory).

**Decisions already made** (from the review with the product owner):

| # | Decision | Chosen |
|---|---|---|
| 1 | Pricing model | **Price book first, cost as a health check.** Janelle sets selling prices (from competitor research) in the Sheet. Cost is an optional rough estimate used only to warn. The current cost-plus math becomes a "floor price" helper. |
| 2 | Discount semantics | **Discounts come off the price.** "10% off" means 10% off. A visible health check (not the discount base) protects margin. |
| 3 | Packages | **Editable templates.** A package adds a grouped block of its pieces, quantities pre-filled from the guest count, every piece editable/removable, optional bundle % shown as "Suite savings". |
| 4 | Where complexity lives | **The Sheet holds the data** (price book), **the engine holds the rules**, **the UI handles composition** (guest count → quantities, templates, overrides). No price-book editing UI in the app. |
| 5 | Open business questions | **Resolved with Janelle on 2026-09-27** (§14): suites follow the website, true bundle % of 10 / 12 / 15 for weddings *and* events, a $30/hr target with a $25/hr floor, 6% fees, 2 guests per household, 2 envelopes per household, optional shipping line, digital prices kept at $16 for now. |

---

## 1. TL;DR

- **The engine answers the wrong question.** It computes *"what does this cost me × 1.265?"*
  instead of *"what should I charge?"*. For a custom-design studio that prices against
  competitors, cost-plus underprices the creative work: a custom two-piece digital suite quotes at
  **$29.13**, and the design of a full Sweet Suite is worth **$63** (2 h at $25/h × 1.265). The only
  way to move toward a market price today is to change `hourly`/`targetProfitPtg`, which moves every
  product at once. That is why iterating is painful.
- **Being exact made quotes wrong.** Hidden quantity rules put **300 menus and 24 table signs**
  into "Give Me the Works" at 50 households. Paper size and stock (which drive the sheet/yield
  inputs) change quote by quote, so the "exact" inputs are guesses anyway.
- **The Sheet externalization stopped halfway.** You **cannot add a product from the Sheet**:
  unknown `Items` keys are ignored. Packages live in code. A quote is driven by **111 numbers**.
  With new products weekly, every product is a code deploy.
- **Saved quotes are fragile.** Totals are re-derived from inputs everywhere, and there are three
  concrete ways a sent quote's total can move (§3-C). `pricingVersion` exists only to patch this.
- **The percentages lie.** Client-facing documents print "Suite savings (15%)" beside a dollar
  amount that is 9.6% of the line, because discounts only bite labor.
- **The proposal:**
  - A **price book** in the Sheet, with only 3 required columns per product. Adding a row adds a
    product.
  - Quote lines **store resolved prices**, so a sent quote is a document, not a formula.
  - One small pure total function.
  - A **health check** ("this quote pays you ≈ $X/hr") as the guardrail.
  - The cost-plus math survives as a **floor price** on a read-only Price book page, next to
    Janelle's price and the competitor range.
- **Day one is close to today, and the health check will ask for more.**
  - Per-product prices are seeded from today's engine at ±1% (Appendix B).
  - Suite totals come out about 5–6% lower, because the bundle % Janelle already advertises
    (10 / 12 / 15) now really come off the price.
  - With 6% fees, an undiscounted Sweet Spot quote at seed prices pays ≈ $28/hr, below her $30
    target (§6.5). The first job after P1 is moving prices toward the market.
- **Five shippable phases** (§12): P0 quick fixes → P1 price book → P2 engine + data model →
  P3 read surfaces → P4 new builder → P5 cleanup.

---

## 2. How it works today

### 2.1 Builder flow (`/quote/new` → `app/quote-calc/_components/QuoteCalculator.tsx`)

1. **Client**: name, event date (required), event type, hidden notes, client notes.
2. **Add a package**: Wedding/Events toggle, 3 package cards each (qty defaults to 75 "households").
3. **Add an individual item**: a `<select>` over the catalog and "+ Add item" (qty is in *pieces*).
4. **On this quote**: one card per line (package: qty = households; item: qty = pieces, plus a
   physical/digital toggle).
5. **Configuration**: Fresh vs Reuse design (quote-wide).
6. **Custom add-ons**: name, qty, unit selling price, physical/digital (a separate line type).
7. **Project services**: rush %, extra revision rounds, digital file license.
8. **Discounts**: vendor incentive toggle, family & friends %, custom %.
9. **Materials**: full color ×1.5, custom paper ×1.3 (quote-wide).
10. **Adjust assumptions** (collapsible): 19 global settings + a 23-item × 4-field per-item table.
11. **Breakdown panel**: per-line variable cost → markups → labor-only discounts → services →
    rush → total, "Your costs", net margin badge.
12. **Save / Save As** (`window.prompt` for the name).

### 2.2 Formula (`lib/quote-calc-logic.ts`, `lib/quote-calc-totals.ts`)

```
per piece   design  = design_min/60 × hourly × (reuse ? 0.25 : 1)          (once per piece type)
            prod    = prod_min/60 × hourly × qty                             (physical only)
            mat     = sheet_cost × colorFactor × paperFactor / yield × 1.05 × qty
per line    list    = Σ(design + prod + mat) × (1 + admin 10%) × (1 + profit 15%)     → ×1.265
            disc    = (design + prod) × clamp(bundle% + vendor% + family% + custom%)  → labor only
            net     = list − disc
per quote   services = (revisions × 30 min × hourly + packaging + license 30% × Σdesign) × 1.265
            rush     = (Σnet + services [+ misc, v2]) × 30%
            total    = Σnet + services + rush + misc
```

Package line quantities come from `ITEM_CATALOG` rules (`qty` per household or `fixed`).

### 2.3 Persistence and read surfaces

- A saved `Draft` stores **inputs** (`config`), an `assumptionsSnapshot` (all 111 numbers) and a
  `cachedTotal`.
- Every surface **recomputes** with `computeQuoteBreakdown(config, snapshot, liveCatalog)`: the
  client portal `/q/[token]`, Profile Overview `/quotes/[id]`, and the print view. The dashboard
  shows `cachedTotal`.
- The Sheet is the store: a readable `Quotes` row, the JSON payload in `_data`, and the
  `Settings` + `Items` tabs overlaid on the bundled defaults.

### 2.4 How many numbers drive a quote

| Source | Count |
|---|---|
| Global settings (`hourly`, `adminPtg`, … 6 package discounts, deposit) | 19 |
| Per-item rates (`_dt`, `_pt`, `_sc`, `_y` × 23 items) | 92 |
| Per-item qty rules (`qty`, `fixed`) | 46 |
| Packages (hard-coded in TS) | 6 |
| Per-quote controls in the builder | ≈ 14 |

---

## 3. Findings and pushback

All numbers below come from running the current engine with default settings. Appendix A has the
full table.

### A. The formula

**A1. Cost-plus is the wrong price generator for this business.**

| Quote (today's engine) | Total | What it says |
|---|---|---|
| Design Suite (2 original designs, digital) | **$29.13** | One billed hour for two custom designs |
| Sweet Suite, 75 households | $664.95 ($8.87/household) | Design = $50 raw (2 h); production = $406 (16.3 h of printing/cutting) |
| Signature Suite, 75 households | $1,225.36 | Design = $119 raw (4.8 h); production 30 h |
| Welcome sign (1) | $48.72 | 30 min design, $22 board |
| Seating chart (1) | $64.54 | 60 min design, $22 board |

- The model values Janelle's *creative* work at her *production* wage. Competitors price custom
  design by value, typically as a one-time design fee plus a per-piece print price.
- Cost-plus can only reach a market price by changing global levers that move every product at
  once.
- **Pushback:** keep cost as information, not as the price. Set prices per product, compare them to
  the competition, and let a cost estimate warn when a price is too thin.

**A2. Exactness through hidden rules produced wrong quantities.**
- `iTableSign` is `fixed: 8` ("~8 tables typical", `lib/quote-calc-logic.ts:121`). The event
  packages reuse it for "Event sign", "Dessert sign" and "Signature drink sign" (`:198-203`,
  `:214-224`).
- Every menu variant is 2 per household.

| Package @ 50 households | Pieces the engine prices |
|---|---|
| Add Some Fun | Invite 50, Thank you 50, **Menus 100, Event sign 8, Dessert sign 8** |
| Give Me the Works | Invite 50, Thank you 50, **Food menu 100, Dessert menu 100, Bar menu 100**, Welcome sign 1, **Event sign 8, Dessert sign 8, Signature drink sign 8** |

- The builder never shows per-piece quantities for package lines, so this is invisible while
  quoting. It surfaces only in the breakdown panel and on the client page ("Event sign — 8 pcs").
- Sheet cost and yield also depend on paper size and stock, which change per quote.
- **Pushback:** approximate numbers that are *visible* beat exact numbers that are *hidden*. Make
  every quantity a visible, editable field linked to the guest count.

**A3. Discount percentages don't match the dollars.** Discounts only bite raw labor
(`lib/quote-calc-totals.ts:180-193`), so the % Janelle types or promises is never the % the client
gets:

| Discount | Stated | Actual share of the line |
|---|---|---|
| Design Suite bundle | 10% | 7.9% |
| Sweet Suite bundle | 12% | 7.6% |
| Signature Suite bundle | 15% | **9.6%** |
| Family & friends on Sweet Suite @75 | 10% | **6.4%** |

These stated percentages are client-facing:
- print: "Suite savings (15%)" (`app/quote-calc/print/_components/PrintQuote.tsx:330`) and
  "Family & friends (10%)" (`:369`)
- the copied client summary (`app/quote-calc/_components/BreakdownPanel.tsx:245`)
- the package cards (`QuoteCalculator.tsx:484-488`)

A client who does the math sees an error. **Pushback:** protecting margin by shrinking the
discount base is clever but invisible, and it breaks trust. Protect margin with a visible check
instead (§7).

**A4. The margin badge measures the wrong thing.** `BreakdownPanel.tsx:212-232` (and the mobile bar,
`QuoteCalculator.tsx:321-332`) computes `(price − variable cost) / price`:
- It **counts admin overhead as profit.**
- It compares that margin-on-price against `targetProfitPtg`, which is a markup on cost.

Results:
- An undiscounted quote is by construction exactly on target (13.0% profit after overhead), yet
  the badge says **"+6 pts above target"**.
- A Signature Suite with its bundle discount shows **"2 pts below"**, while its real profit after
  overhead is **3.8%** against the 13% intended.

**A5. Services priced in minutes produce odd amounts.**
- The digital license is 30% of *design labor*: **$7.50** raw ($9.49 billed) on the Design Suite
  (`lib/quote-calc-logic.ts:494`).
- A revision round is 30 min × $25 = $12.50 raw.
- These are business policies, not costs. They should be flat prices Janelle sets.

**A6. The site promises savings the calculator never applies.**
- The event collections show ✦ / ✦✦ / ✦✦✦ savings on `/events` (`config/site.ts:301-352`).
- Every event bundle discount is 0% (`lib/quote-calc-logic.ts:68`).
- *Resolved:* event collections get real bundle % of 10 / 12 / 15, the same as weddings (§14). The
  ✦ badges stay and become honest; no site change is needed.

### B. Data and the Sheet

**B1. A product cannot be added from the Sheet.**
- `mergeRemoteConfig` maps over the bundled `ITEM_CATALOG` and **ignores unknown keys**
  (`lib/quote-calc-config.ts:139-160`).
- A new product needs 4 new `QuoteState` fields, a `DEFAULTS` entry and an `ITEM_CATALOG` entry,
  then a deploy.
- The original roadmap promised to remove the per-item fields and the per-item table
  (`docs/quote-calc-roadmap.md` Phase 1). Neither was removed.
- With products added weekly, **this is the #1 source of friction.**

**B2. Packages are code.** `PACKAGES` in `lib/quote-calc-logic.ts:153-230`. Changing a suite's
contents requires a deploy, and it silently re-prices every saved quote that uses the package
(see C2).

**B3. The website and the calculator have drifted apart.**

| | Website (`config/site.ts`) | Calculator (`PACKAGES`) |
|---|---|---|
| Entry suite | **Short and Suite**: Detail card, Invite | **Design Suite** (digital): Save the date, Invite |
| Mid suite | **Sweet Spot Suite**: Detail, Invite, RSVP, Envelope printing | **Sweet Suite**: Save the date, Invite, Detail, RSVP, Envelope |
| Top suite | **Signature Suite**: RSVP, Detail, Invite, Envelope printing, Band/clip/pocket, Ceremony cards, Table top sign, AI render | **Signature Suite**: Save the date, Invite, Detail, RSVP, Envelope, Ceremony, Guest settings, Welcome sign, Seating chart |

Products **sold on the site but absent from the calculator**: suite pocket / band / clip, wax seal,
envelope liners, envelope printing, extra card or shape design, textured paper, AI render. Every
quote that includes them goes through "Custom add-ons", with prices typed from memory each time.

**B4. There are three sources of truth for rates, plus per-quote edits.**
- Bundled `DEFAULTS`.
- A browser-local "Save as my defaults" (`lib/quote-calc-logic.ts:524-544`,
  `AssumptionsPanel.tsx:135-144`).
- The Sheet overlay (`QuoteCalculator.tsx:205-209`).
- Ad-hoc per-quote edits in the Assumptions panel.

The Sheet wins on every load, so "Save as my defaults" does nothing once the Sheet is configured.
Janelle cannot tell which numbers a quote used.

**B5. Too many numbers, and the wrong ones.** 111 inputs, most of which (sheet cost, yield, minutes
per piece) Janelle can't know before designing the piece.

### C. Architecture

**C1. Recomputing from inputs makes sent quotes fragile.**
- A sent quote's total is re-derived from its inputs every time it is viewed.
- Any rule change therefore needs version gating (`pricingVersion`, `lib/quote-calc-drafts.ts:95-105`)
  or it moves the client's number.

**C2. The snapshot is incomplete.**
- `assumptionsSnapshot` freezes the rates, but **not** the catalog quantity rules (`qty` / `fixed`
  from the live `Items` tab) or `PACKAGES`.
- `/q/[token]` (`app/q/[token]/page.tsx:52-60`), Profile Overview (`app/quotes/[id]/page.tsx:62-68`)
  and print recompute with the **live** catalog.
- So editing a quantity in the `Items` tab **silently changes the total on links already sent to
  clients.**
- The dashboard shows `cachedTotal` (`app/quotes/page.tsx:58`), which can then disagree with the
  client link.

**C3. Opening a saved quote re-prices it (a race).**
- `loadDraftIntoState` sets the draft's snapshot (`QuoteCalculator.tsx:153-162`).
- The config fetch that runs in parallel then does
  `setAssumptions(prev => ({...prev, ...merged.assumptions}))` (`:209`), where `merged.assumptions`
  is a *full* `QuoteState`. It replaces every key.
- The comment on `:208` says snapshots are preserved; they aren't.
- Janelle sees a different number than the client link shows, and **Save** persists the re-priced
  quote.

**C4. One list, three quantity meanings.**
- Package lines count households.
- Item lines count pieces.
- Custom add-ons are a third line type with their own rules (unnamed rows dropped under v1).

### D. UX

- **D1. Too many controls.** ≈14 per-quote controls plus a 111-field panel, against the 4
  decisions Janelle actually makes: *which pieces, how many, at what price, any discount.*
- **D2. Per-line choices are quote-wide.**
  - Fresh vs Reuse, full color and custom paper apply to every line (`QuoteCalculator.tsx:652-679`,
    `:767-782`).
  - A client reusing last year's invite design but ordering new day-of signs cannot be quoted.
- **D3. Repeat items are treated as one-offs.** Most "custom add-ons" are real, repeat products
  (see B3). They deserve a price-book row, not re-typing.
- **D4. The breakdown panel is an accountant's view.** Variable → markups → discount per line is
  good for debugging, heavy for deciding. Janelle's decision needs three things: the client's
  total, whether the quote is worth her time, and what the client will see.
- **D5. There is no way to "land" a price.** To match a competitor's number she tweaks the custom %
  until the total lands.
- **D6. Small frictions.** Saving uses a `window.prompt` for the name (`QuoteCalculator.tsx:390`),
  and there is no "Duplicate quote".

### What to keep (it's good)

- **One pure money function shared by every surface** (`computeQuoteBreakdown`). Keep the pattern.
- **The client-safe projector** (`buildPublicQuote`). Costs never leak.
- **Sheets as the store.** Readable `Quotes` rows plus the `_data` payload, and the service-account
  REST without `googleapis`.
- **Stage pipeline, deposit tracking, proof approval, soft archive, auto Drive folders.**
- **Config validation, and a banner that names the tab and row.**
- **Invariant tests on plain Node.**
- **The direction of moving numbers into the Sheet.** The granularity was wrong, not the idea.

---

## 4. Principles of the redesign

1. **Prices come from Janelle; costs come from estimates.** The engine prices from the price book.
   Cost estimates only feed a warning.
2. **A sent quote is a document, not a formula.** Lines store resolved names and prices, so totals
   are a pure function of the saved quote alone. No snapshot, no live catalog, no
   `pricingVersion`.
3. **Everything load-bearing is visible and editable.** Quantities, unit prices, discounts and
   adjustments are all on screen.
4. **Adding a product is one Sheet row.** Catalog changes never need code.
5. **Percentages mean what they say.**
6. **One source of truth per thing.** The price book is the Sheet. Per-quote changes are line
   overrides. No browser-local defaults.
7. **Complexity lives in the Sheet (data) and the engine (rules).** The UI's job is to make the
   common path a handful of clicks and the uncommon path possible.

---

## 5. Google Sheet changes

### 5.1 Tab overview

| Tab | Status | Written by | Purpose |
|---|---|---|---|
| `Products` | **New** | Janelle (the app seeds it once) | The price book: one row per sellable product |
| `Options` | **New** | Janelle (seeded) | Upgrades/modifiers: paper, color, size, foil… |
| `Packages` | **New** | Janelle (seeded) | Suite templates |
| `Settings` | **Changed** (new keys) | Janelle | Quote-level policies + health targets |
| `Items` | **Retired in P5** | — | Kept read-only until legacy quotes are frozen (P3) |
| `Quotes` | **Changed** (G/H/I content, H header) | App | Readable row per quote |
| `_data` | **Changed** (v5 payloads) | App | Full quote JSON |

The app only **reads** `Products` / `Options` / `Packages` / `Settings`. The single exception is a
one-time **seed** into tabs that are missing or empty, plus appending missing `Settings` keys. It
never overwrites a row Janelle has touched. This is the same pattern as the `_data` auto-creation
that exists today.

### 5.2 `Products`

Row 1 is the header. **Only `id`, `name` and `price` are required.** Everything else is optional
and just makes the builder smarter.

| Col | Header | Req. | Type | Meaning |
|---|---|---|---|---|
| A | `id` | ✔ | text | Stable key, lowercase-with-dashes (`invite`, `welcome-sign`). Never reuse an id for a different product. |
| B | `name` | ✔ | text | Client-facing name. Safe to rename (saved quotes keep their own copy). |
| C | `price` | ✔ | $ | Selling price **per piece** (physical). |
| D | `category` |  | text | Groups the picker: Invitations, Day-of, Signage, Favors & bar, After the event, Services. |
| E | `designFee` |  | $ | One-time design fee added once per line (fresh design). Blank = 0. |
| F | `digitalPrice` |  | $ | Price when sold as a digital file (flat, qty ignored). Blank = not offered digitally. |
| G | `qtyBasis` |  | `household` / `guest` / `fixed` | What the default quantity follows. Blank = `fixed`. |
| H | `qtyPer` |  | number | Multiplier on the basis (e.g. `1` per household, `2` for envelopes). Blank = 1. |
| I | `estUnitCost` |  | $ | Rough out-of-pocket cost per piece (paper, ink, envelope, board). Health only. |
| J | `estMinutes` |  | min | Rough production minutes per piece. Health only. |
| K | `estDesignHours` |  | h | Rough design hours (one-time). Health only. |
| L | `marketLow` |  | $ | Lowest competitor price per piece you've seen. Reference only. |
| M | `marketHigh` |  | $ | Highest competitor price per piece. Reference only. |
| N | `active` |  | TRUE/FALSE | Blank = TRUE. Inactive products are hidden from the picker but still read for old references. |
| O | `notes` |  | text | Internal. |

**Validation** (warnings go to the existing `ConfigBanner`, naming the tab and row):
- duplicate `id`
- non-numeric money or number cells
- unknown `qtyBasis`
- `marketLow > marketHigh`

A row **without a price** is skipped with a "needs a price" warning. That makes the tab double as
Janelle's to-do list for new products.

Example:

| id | name | price | category | designFee | digitalPrice | qtyBasis | qtyPer | estUnitCost | estMinutes | estDesignHours | marketLow | marketHigh |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| invite | Invitation | 1.95 | Invitations | 16 | 16 | household | 1 | 0.29 | 3 | 0.5 | | |
| envelope | Envelope | 0.40 | Invitations | | | household | 2 | 0.33 | 0 | | | |
| welcome-sign | Welcome sign | 29.75 | Signage | 16 | 16 | fixed | 1 | 23.10 | 1 | 0.5 | | |
| wax-seal | Wax seal (adhesive) | | Invitations | | | household | 1 | | | | | |

### 5.3 `Options` (modifiers)

| Col | Header | Req. | Meaning |
|---|---|---|---|
| A | `id` | ✔ | `textured-paper`, `full-color`, `gold-foil`, `size-6x9` |
| B | `name` | ✔ | Client-facing ("Textured paper") |
| C | `kind` | ✔ | `per-piece` (+$ per piece), `percent` (+% of the line's piece subtotal), `flat` (+$ once on the line) |
| D | `amount` | ✔ | $ or % according to `kind` |
| E | `appliesTo` |  | Comma list of categories and/or product ids. Blank = every product. |
| F | `estCost` |  | Extra cost per piece (health only; `per-piece` options) |
| G | `active` |  | Blank = TRUE |
| H | `notes` |  | Internal |

Options answer "different paper quality" and "different sizes" without multiplying product rows.
Wax seals, liners and pockets are **products** (they are separate, countable pieces the client
sees), not options.

### 5.4 `Packages` (templates)

One row per package.

| Col | Header | Req. | Meaning |
|---|---|---|---|
| A | `id` | ✔ | `sweet-spot-suite` |
| B | `name` | ✔ | "Sweet Spot Suite" (should match `config/site.ts`) |
| C | `type` | ✔ | `wedding` / `event` (filters the builder chips) |
| D | `items` | ✔ | Comma-separated product ids, in display order. Repeat an id to include it twice. Quantities come from each product's `qtyBasis`/`qtyPer`. |
| E | `bundlePct` |  | Suite savings, a **true %** of the group's subtotal. Blank = 0. |
| F | `delivery` |  | `physical` (default) / `digital`: the default for the group's lines |
| G | `active` |  | Blank = TRUE |
| H | `notes` |  | Internal |

Validation:
- An unknown product id in `items` raises a warning, and the builder skips that piece.
- A product without a price raises a warning, and the builder adds the piece at $0 with a
  "set price" badge.

### 5.5 `Settings` (same tab, new keys)

| Key | Seed | Meaning | Replaces |
|---|---|---|---|
| `guestsPerHousehold` | 2 ✔ | Guests default = households × this (editable per quote) | catalog "~2 per household" |
| `rushPct` | 30 | Rush surcharge % | `rushFeePtg` |
| `revisionRoundPrice` | 16 | $ per extra revision round | `revisionMin` × `hourly` × markup |
| `revisionHours` | 0.5 | Health only: hours per extra round | `revisionMin` |
| `licenseFee` | 20 | Flat $ for print-ready source files on a physical order | `digitalLicensePtg` |
| `packagingFee` | 3 | Flat $ once per physical order (0 hides it) | `packagingCost` × markup |
| `depositAmount` | *(keep current)* | Default deposit, editable per quote | same key |
| `reuseDesignPct` | 25 | % of the design fee charged when reusing an existing design | `reuseFactor` |
| `vendorReferralPct` | 10 | Preset for the "Vendor referral" discount reason | `vendorIncentivePtg` |
| `feesPct` | 6 ✔ | Health only: payment/platform/software fees as % of revenue | `adminPtg` (as a cost, not a markup) |
| `hourlyTarget` | 30 ✔ | Health only: the $/hr you want a quote to pay you | `hourly` + `targetProfitPtg` |
| `hourlyFloor` | 25 ✔ | Health only: the $/hr you won't go below | — |

✔ = confirmed by Janelle (§14).

**Transition rules:**
- Legacy keys (`hourly`, `adminPtg`, `targetProfitPtg`, `errorMarginPtg`, `fullColorFactor`,
  `customPaperFactor`, `discount*`, …) stay in the tab until P5.
- The new reader ignores legacy keys silently.
- The old reader (`SETTINGS_WHITELIST`, `lib/quote-calc-config.ts:72`) must ignore the new keys
  silently too, so the old calculator's banner doesn't fill with "unknown key" warnings during the
  transition.

### 5.6 `Quotes` tab (readable row)

| Col | Today | After |
|---|---|---|
| G | Package (display name) | **Summary**: group names + standalone product names (e.g. "Sweet Spot Suite + Welcome sign") |
| H | Quantity (per-line qty list) | **Households** (header renamed in `ensureNewSchema`) |
| I | Line items (names only) | **Priced lines**, e.g. `Invitation — 80 × $2.20 + $16 design = $192.00`, then bundle / discount / rush / adjustment lines |
| J | Total | Total (unchanged; always equals the v5 engine) |
| N–U | Portal / lifecycle | Unchanged |
| V, W | — | *Optional (P5):* **Est. $/hr**, **Est. costs**, so Janelle can review profitability across quotes in the Sheet |

### 5.7 Janelle's setup checklist (after P1 ships)

1. Open **Price book** in the app nav → click **Create price book tabs**. This seeds `Products`,
   `Options` and `Packages`, and appends the new `Settings` keys.
2. Skim `Products`. The seeded prices reproduce today's calculator, and the to-do rows have no
   price yet.
3. For the ten best-selling products, fill in `marketLow` / `marketHigh` from competitor research.
   The Price book page then shows where each price sits against the floor and the market.
4. Price the to-do rows (wax seal, liners, pocket/band/clip, envelope printing, extra card design,
   AI render) and set them `active`. Until then, a package that includes one adds it at $0 with a
   "set price" badge.
5. Set the real upcharges for the `Options` rows (the seeded amounts are parity placeholders).
6. Open a few typical quotes and check the health card. Where it reads *below target*, raise
   prices in `Products` (package contents, bundle %, $/hr goals and fees are already set per §14).

---

## 6. Pricing formula v2

All money math lives in one pure module, `lib/quote-engine.ts`. The inputs are **only** the saved
quote config; the price book is consulted when a line is *added* or *refreshed*, never when
totals are computed.

### 6.1 Line

```
Physical product line
  pieceUnit  = unitPrice + Σ per-piece options
  pieces     = qty × pieceUnit
  pctOpts    = pieces × Σ percent options / 100
  design     = designFee × (reuseDesign ? reuseDesignPct/100 : 1)
  lineTotal  = round2(pieces + pctOpts + Σ flat options + design)

Digital product line  (only when the product has a digitalPrice; qty is not used)
  lineTotal  = round2(unitPrice × (1 + Σ percent options/100) + Σ flat options)   # unitPrice = digitalPrice at add time

Custom line  (free-form; replaces "custom add-ons")
  lineTotal  = round2(qty × unitPrice)            # optional designFee / options work the same way
```

### 6.2 Groups (packages)

```
groupSubtotal = Σ lineTotal of lines in the group
groupSavings  = round2(groupSubtotal × bundlePct / 100)      # a true percentage
```

### 6.3 Quote

```
itemsSubtotal = Σ lineTotal (all lines)
bundleSavings = Σ groupSavings
services      = extraRevisions × revisionRoundPrice
              + (license ? licenseFee : 0)
              + (anyPhysical ? packagingFee : 0)
base          = itemsSubtotal − bundleSavings + services
discount      = percent ? round2(base × pct/100) : min(amount, base)     # ONE discount, with a reason
rush          = rush ? round2((base − discount) × rushPct/100) : 0
adjustment    = signed $ from "Set total…" (0 by default)
shipping      = optional pass-through $ (null ⇒ "added later", as today)
total         = base − discount + rush + adjustment + (shipping ?? 0)
deposit       = min(depositAmount, total)             # display-only, never in the math
```

Order of operations, and why:
- **The bundle comes before the discount.** The suite price is the product's price. "10% off your
  order" then comes off what the client is actually buying, which is how retail discounts read.
- Phase 6's additive, labor-only rule existed to protect margin. The health check (§7) now does
  that visibly, and every component shows as its own dollar line, so the compounding is honest.
- **Rush comes after the discount.** Rush is a surcharge on the work being done, at the price
  agreed.
- **The adjustment comes last** (before shipping). It is the explicit "make the total X" lever and
  is shown to the client with Janelle's label (e.g. "Courtesy adjustment").
- **Shipping** is never discounted or rushed.

**Rounding.**
- Every money component is rounded to cents in the engine, so displayed lines always sum to the
  displayed total.
- Client-facing money uses one formatter everywhere: cents shown only when the value isn't a whole
  dollar.

### 6.4 Invariants (asserted in `lib/quote-engine.test.ts`)

1. `itemsSubtotal − bundleSavings + services − discount + rush + adjustment + (shipping ?? 0) == total`.
2. The percent discount equals exactly `pct%` of `base`. A 10% group bundle equals exactly 10% of
   `groupSubtotal`.
3. Totals depend only on the config. The same config gives the same total whatever price book is
   loaded.
4. Adding the same product twice with the same inputs gives identical line totals.
5. A zero-line quote totals 0 (plus services/adjustment if set). A custom-only quote is valid.
6. `isDigitalQuote` is true iff every line is digital, including custom lines. Packaging applies
   iff any line is physical.
7. Changing the guest count re-quantifies **linked** lines only. Lines with manually typed
   quantities keep them.
8. `setTargetTotal(config, T)` yields `total == T` exactly.
9. Legacy conversion preserves every legacy total within $0.005 (§8.5).

### 6.5 Worked example

What's real and what's illustrative:
- **Real:** the unit prices are the seed prices, and the settings are Janelle's confirmed ones (12%
  Sweet Spot bundle, 6% fees, $30/hr target, $25/hr floor).
- **Made up:** the textured-paper upcharge, the discount and the target total.

The quote: a Sweet Spot Suite for 80 households, with textured paper on the invite and detail card
(+$0.25/pc), plus a welcome sign, 1 extra revision and family & friends 10%. Janelle types a target
total of $570.

Envelope printing is part of the suite but has no price yet, so it shows at $0 with a "set price"
badge and is left out below.

| Line | Math | Total |
|---|---|---|
| Invitation | 80 × ($1.95 + $0.25) + $16 design | $192.00 |
| Detail card | 80 × ($1.95 + $0.25) + $16 design | $192.00 |
| RSVP | 80 × $2.30 + $16 design | $200.00 |
| Envelope (invite + RSVP reply) | 160 × $0.40 | $64.00 |
| *Suite subtotal* | | *$648.00* |
| Suite savings (12%) | 12% × $648.00 | −$77.76 |
| Welcome sign | 1 × $29.75 + $16 design | $45.75 |
| Extra revision round | 1 × $16 | $16.00 |
| Packaging & handling | once | $3.00 |
| Family & friends (10%) | 10% × $634.99 | −$63.50 |
| Courtesy adjustment | set total → $570 | −$1.49 |
| **Total** | | **$570.00** |

Health (admin only):
- ≈ 15.9 h of work: 2 h design, 13.4 h production, 0.5 h revision.
- ≈ $149 materials and ≈ $34.20 fees (6%).
- Pays about **$24.21/hr**: *under the $25 floor.*
- The same quote without the family discount and adjustment ($634.99) pays about **$28.07/hr**:
  *below the $30 target.*

What this tells Janelle:
- She sees exactly what the discount costs her before she sends the quote.
- The seed prices, now that the bundle % are real and fees are 6%, sit below her own target. That
  is the signal to raise prices toward the market.

---

## 7. Health check and floor prices (admin only)

### 7.1 Quote health (`lib/quote-health.ts`, pure)

```
estHours     = Σ lines (estDesignHours × (reuseDesign ? reuseDesignPct : 1))
             + Σ physical lines qty × estMinutes / 60
             + extraRevisions × revisionHours
estMaterials = Σ physical lines qty × (estUnitCost + Σ per-piece option estCost)
netRevenue   = total − (shipping ?? 0) − packagingFee·anyPhysical     # pass-throughs excluded
fees         = total × feesPct / 100
earned       = netRevenue − estMaterials − fees
perHour      = estHours > 0 ? earned / estHours : null
outOfPocket% = (estMaterials + fees) / total
coverage     = revenue share of lines that carry estimates (custom lines usually don't)
```

- **Status:** `perHour ≥ hourlyTarget` → *On target*; `≥ hourlyFloor` → *Below target*; otherwise
  *Under your floor*.
- **Presentation:** status is shown by **label + glyph** (✦ / ~ / !), following the DESIGN.md rule
  of no traffic-light colors; the Powder Rose accent is used only for the on-target state.
- **Low coverage:** when `coverage < 80%`, show "Estimate covers N% of this quote".
- **Where it appears:** the builder summary, Profile Overview, and optionally `Quotes` V/W.
  **Never** on `/q/[token]` or print.

Why $/hr is the headline number:
- Janelle's scarce resource is her time.
- "This quote pays me $26/hr" is a number she can act on.
- "Net margin 20.9%" wasn't (and was mis-computed, A4).

### 7.2 Floor and target prices (the cost-plus logic, demoted)

For each product with estimates:

```
floorUnit   = (estUnitCost + estMinutes/60 × hourlyFloor ) / (1 − feesPct/100)
targetUnit  = (estUnitCost + estMinutes/60 × hourlyTarget) / (1 − feesPct/100)
floorDesign = estDesignHours × hourlyFloor
```

The Price book page (§10.6) shows, per product:
**floor · target · market range · your price**, with flags for *below floor*, *above market*,
*no market data*, and *no price*.

This is the "compare with competition while still having profit" workbench. It is read-only in the
app; Janelle edits prices in the Sheet.

---

## 8. Data model v5 and conversion

### 8.1 Types (`lib/quote-calc-drafts.ts`)

```ts
export type LineKind = "product" | "custom";

export interface LineOption {        // resolved copy of an Options row
  id: string; name: string;
  kind: "per-piece" | "percent" | "flat";
  amount: number; estCost?: number;
}

export interface QuoteLineV5 {
  id: string;
  kind: LineKind;
  productId?: string;           // price-book reference (refresh + health defaults); absent on custom lines
  groupId?: string;             // package group membership
  name: string;                 // resolved, editable, client-facing
  detail?: string;              // optional client-facing sub-line ("5×7 · textured · gold foil")
  includes?: string[];          // optional bullet list (converted legacy packages, custom bundles)
  qty: number;
  qtyLink?: { basis: "household" | "guest"; per: number } | null;   // null ⇒ manual qty
  unitPrice: number;            // resolved; editable
  listUnitPrice?: number;       // price-book price when added (drives the "custom price" badge)
  designFee: number;            // resolved; editable
  reuseDesign?: boolean;
  digital: boolean;
  options: LineOption[];
  est?: { unitCost: number; minutes: number; designHours: number };  // resolved snapshot for health
}

export interface QuoteGroup { id: string; packageId?: string; name: string; bundlePct: number; }

export interface QuoteDiscount {
  reason: "vendor" | "family" | "promo" | "custom";
  kind: "percent" | "amount";
  value: number;
  label?: string;               // client-facing override ("Spring promo")
}

export interface DraftConfigV5 {
  schema: 5;
  households: number;
  guests: number;
  groups: QuoteGroup[];
  lines: QuoteLineV5[];
  services: {
    rush: boolean; rushPct: number;
    extraRevisions: number; revisionRoundPrice: number;
    license: boolean; licenseFee: number;
    packagingFee: number;
  };
  discount: QuoteDiscount | null;
  adjustment: { amount: number; label: string } | null;
  shipping: number | null;      // null ⇒ "added later"
  deposit: number;
  pricedAt: string;             // ISO: when prices were last pulled from the price book
  health?: { revisionHours: number; feesPct: number; hourlyTarget: number; hourlyFloor: number };  // snapshot for consistent health on old quotes
  legacy?: unknown;             // original v4 config + assumptionsSnapshot, kept for audit after conversion
}
```

The `Draft` becomes `{ id, name, createdAt, updatedAt, client, config: DraftConfigV5, cachedTotal,
schemaVersion: 5 }`:
- `assumptionsSnapshot` is dropped for v5 (legacy only, under `config.legacy`).
- `cachedTotal` is always `computeTotals(config).total`, recomputed on save.

### 8.2 Guest-count linking

- A line added from the price book or a package gets `qtyLink` from the product's
  `qtyBasis`/`qtyPer`, and `qty = per × (households | guests)`.
- Changing households or guests on the quote re-computes the qty of every **linked** line.
- Typing a qty into a line sets `qtyLink = null` (manual); a small link icon can re-link it.
- `guests` defaults to `households × guestsPerHousehold` until Janelle edits it.
- `fixed` products get `qtyLink = null` and `qty = qtyPer`.

### 8.3 Price refresh

- `diffAgainstPriceBook(config, priceBook)` lists lines whose `productId` now has a different
  `price` / `designFee` / `digitalPrice`, and options whose amount changed.
- The builder shows "3 prices changed since this quote was priced (Jun 12)". A **Review** action
  lets Janelle apply them selectively.
- A refresh is never automatic. Applying it updates `pricedAt`.

### 8.4 Health snapshot

`config.health` stores the four health settings used, so Profile Overview shows the same health an
old quote had when saved. Health never touches the total.

### 8.5 Legacy conversion (v1–v4 → v5, totals preserved)

`lib/quote-legacy.ts` contains the **current** `quote-calc-logic.ts` + `quote-calc-totals.ts`
engine, moved and frozen (no further edits). It exposes `convertLegacyDraft(draft, catalog)`:

1. `b = computeQuoteBreakdown(migratedV4Config, draft.assumptionsSnapshot, catalog)`: exactly what
   clients see today.
2. Each legacy line becomes one v5 `product` line with `productId` undefined and **qty 1 ×
   `unitPrice = line.list`**. It is named after the line ("Sweet Suite — 75 households",
   "Place cards — 150 pcs"), with `includes` = the piece list the portal shows today
   (`buildIncludedPieces`).
3. `b.services.servicesList > 0` becomes a custom line "Project services (revisions + packaging…)".
4. `b.rushAmount > 0` becomes a custom line "Rush production" (fixed $, `services.rush = false`), so
   the v1/v2 rush-base difference can't leak.
5. `b.miscLines` become custom lines (qty × unitPrice).
6. `b.discountTotal > 0` becomes `discount = { reason: "custom", kind: "amount", value:
   discountTotal, label: "Savings" }`.
7. `services` zeroed, `households` = first package line's qty (else 0), and `deposit =
   snapshot.depositAmount`.
8. `legacy = { config, assumptionsSnapshot, pricingVersion }` kept for audit.

Parity: `|computeTotals(v5).total − b.finalPrice| < 0.005`. Values are not rounded during
conversion.

**Where it runs:**
- **On read (P3):** the server routes `getDraftById` / `listDraftRecords` convert in memory using
  the live `Items` catalog (so the result equals what clients see today). The browser's
  `loadDrafts()` converts local caches with the bundled catalog; remote copies win on reconcile
  (equal `updatedAt` ⇒ remote).
- **Freeze (P3, run once):** a cookie-gated `POST /quote-calc/api/drafts/freeze` converts every
  non-v5 payload with the live catalog and writes v5 JSON to `_data`, keeping `updatedAt`. It is
  idempotent and reports `{converted, skipped, parityFailures}`. After this, `Items` and the legacy
  `Settings` keys are no longer read and can be retired (P5).

---

## 9. Quote builder UI (`/quote/new`)

### 9.1 Layout

```
┌──────────────────────────────────────────────┬───────────────────────────┐
│ ① Client & event                              │  SUMMARY (sticky)         │
│   Name · Event type · Date* · Households 80   │  Sweet Spot Suite  $570.24│
│   Guests 160 (auto)                           │  Welcome sign       $45.75│
│                                               │  Services           $19.00│
│ ② Start from   [Short and Suite] [Sweet Spot] │  Family & friends −$63.50 │
│   [Signature] · Events ▸ · [Blank]            │  Adjustment         −$1.49│
│                                               │  ─────────────────────────│
│ ③ Lines                                       │  Total            $570.00 │
│  ┌ Sweet Spot Suite · 80 households −12% ───┐ │  Deposit $150 · Bal $420  │
│  │ Invitation  🔗80  $1.95  +Textured  $192 │ │  [ Set total… ]           │
│  │ Detail card 🔗80  $1.95  +Textured  $192 │ │  ─────────────────────────│
│  │ RSVP        🔗80  $2.30             $200 │ │  HEALTH  ! Under floor    │
│  │ Envelope    🔗160 $0.40              $64 │ │  ≈ $24.21/hr (floor $25)  │
│  │ + add piece      ≈ $7.13 / household     │ │  ≈ 15.9 h · costs ≈ $183  │
│  └──────────────────────────────────────────┘ │  ▸ Show math              │
│  Welcome sign   1   $29.75 +$16 design $45.75 │                           │
│  [ + Add from price book ]  [ + Custom line ] │  [ Save ]  [ Duplicate ]  │
│                                               │                           │
│ ④ Services   Rush ☐ 30% · Revisions [−] 1 [+] │                           │
│              File license ☐ $20               │                           │
│              Shipping: added later ▾          │                           │
│ ⑤ Discount   [Family & friends ▾]  10 [%|$]   │                           │
│ ⑥ Notes      Client note · Hidden note        │                           │
└──────────────────────────────────────────────┴───────────────────────────┘
Mobile: single column; sticky bottom bar "Total $570 · ! $24.21/hr" opens the summary sheet.
```

### 9.2 Behaviour by section

**① Client & event** (reuses `ClientInfoSection`, plus households/guests)
- The date stays required (it drives the dashboard).
- Households/guests are the quote's quantity drivers (§8.2).
- The quote name defaults to "<client> — <event type>". **No `window.prompt`**; the name is an
  inline editable title.

**② Start from**
- Chips come from the `Packages` tab, filtered by event type (Wedding → `wedding`, others →
  `event`, with a toggle to show all).
- Clicking a chip appends a **group** with the package's pieces (§8.2 quantities, price-book
  prices, the package's `delivery`).
- Several groups are allowed.
- "Blank" starts with no lines. Zero-line and custom-only quotes stay valid.

**③ Lines**: invoice-style rows. Anatomy:

| Element | Behaviour |
|---|---|
| Name | Editable inline. Product lines show a small "from price book" affordance. |
| Qty | Numeric. The 🔗 icon shows it follows households/guests; typing breaks the link; clicking 🔗 re-links. A digital line shows "file" instead. |
| Unit price | Pre-filled. When it differs from `listUnitPrice`, a "custom" badge appears with the list price in muted text; a "reset" action restores it. |
| Design fee | Shown when > 0. Per-line **Reuse design** toggle (fee × `reuseDesignPct`). |
| Options | Chips for options that apply to the product (`appliesTo`); click to add or remove. |
| Physical / Digital | Toggle, enabled only if the product has a `digitalPrice`. Switching swaps `unitPrice`. |
| Line total | Right-aligned, tabular. |
| ⋯ menu | Duplicate · Move out of / into group · Edit detail line · Remove |

More line behaviours:
- **Add from price book**: a searchable combobox (type-ahead over name and category, grouped by
  category, showing price and unit). It replaces the `<select>`.
- **Custom line**: name, qty, unit price, physical/digital. It replaces the "Custom add-ons"
  section.
- **Group header**: package name (Square Peg), households, bundle %, group subtotal, "≈ $X per
  household" (for competitor comparison), "+ add piece", and remove group.

**④ Services**
- Rush toggle (shows `rushPct`).
- Extra revisions stepper (shows "$16 / round").
- File license toggle (shows `licenseFee`).
- Shipping, with two choices: "Added later" (default, keeps today's behaviour and footnote) or
  "Add now: $\_\_".
- Deposit: pre-filled from Settings, editable.
- Every policy value is pre-filled from `Settings` and editable per quote. Edits are stored on the
  quote, never written back.

**⑤ Discount**: a single control.
- Reason select: None / Vendor referral / Family & friends / Promo / Custom.
- A % or $ segmented input. Vendor referral pre-fills `vendorReferralPct`.
- An optional client-facing label.
- It replaces the vendor toggle and the two % inputs.

**⑥ Summary** (sticky right; bottom sheet on mobile)
- **Client view**: groups, standalone lines, services, suite savings, discount (labelled by
  reason), rush, adjustment, shipping, total, deposit/balance. This is exactly what the portal
  will show.
- **Set total…**: type a target. It creates or updates `adjustment` so the total equals it (label
  editable), and previews the health impact before applying.
- **Health card** (§7.1): status label + glyph, $/hr vs target, hours, costs, coverage note.
- **Show math** (collapsed): per-line formula rows for debugging, replacing today's
  `BreakdownPanel`.
- **Copy client summary**: kept, rebuilt from the v5 totals, with truthful percentages.

**Refresh banner**: appears when opening a quote whose `pricedAt` precedes price-book changes that
affect its lines (§8.3).

**Price book load states**:
- The builder caches the last good price book in `localStorage` with a timestamp.
- If the Sheet fetch fails, it uses the cache and shows the existing `ConfigBanner` ("Using the
  price book from Sep 20").
- With no cache it falls back to the bundled seed.
- Saved quotes are unaffected either way (their prices are frozen).

### 9.3 What goes away and where it went

| Today | After |
|---|---|
| Wedding/Events package cards with "−15%" badges | "Start from" chips; the group header shows the true bundle % |
| Item `<select>` | Searchable price-book combobox |
| Package qty = households vs item qty = pieces | Quote-level households/guests; every line qty is pieces (linked or manual) |
| Pricing mode Fresh/Reuse (quote-wide) | Per-line "Reuse design" |
| Materials: full color / custom paper (quote-wide multipliers) | Per-line option chips from `Options` |
| Custom add-ons section | Custom line (same list, same rules) |
| Vendor toggle + F&F % + custom % (additive, labor-only) | One discount with a reason, true % or $ |
| Adjust assumptions panel (111 fields) + browser defaults + JSON import/export | Price book in the Sheet + read-only Price book page |
| Breakdown panel (cost accounting) | Summary (client view) + Health card + collapsed "Show math" |
| Net-margin badge | Health status ($/hr vs target/floor) |
| `window.prompt` Save As | Inline quote name; **Duplicate** action |

### 9.4 Design-system constraints (from `DESIGN.md` / `PRODUCT.md`)

- Powder Rose (`accent`) marks **state only**: the selected chip, custom-price badge,
  on-target glyph. It stays ≤ 10% of the screen.
- **No traffic-light colors.** Health and warnings use label + glyph + shape. Today's
  `bg-green-100` / `bg-amber-100` / `bg-red-100` badges are removed.
- Square Peg for group and package names; Anybody for everything else, with tabular figures for
  money.
- Touch targets ≥ 44 px. Rows must survive longer Spanish strings (names wrap; money columns never
  do).

---

## 10. Other surfaces

### 10.1 Profile Overview (`app/quotes/[id]/page.tsx`)

- **Totals**: `computeTotals(draft.config)`. The live `listConfig()` catalog fetch is dropped (no
  longer needed for money).
- **Client-facing summary**: rendered from the new `PublicQuote` (§10.2) so it mirrors `/q`
  exactly. Groups appear with their pieces, suite savings, and the discount by reason.
- **New "Pricing health" panel (admin only)**: status, $/hr vs target/floor, hours, costs,
  coverage, using the health snapshot saved with the quote (`config.health`).
- **New indicators**:
  - "Priced from the price book on <pricedAt>".
  - "N prices changed since", linking to Edit, which opens the refresh banner.
  - "Converted from the old calculator — totals preserved" when `config.legacy` exists.
- **New actions**: **Duplicate as new quote** (copies client/event/config with a fresh id; no
  portal meta, no folder), **Edit**, **Print / PDF**.
- **Unchanged**: stage control, deposit paid, approval banner, hidden notes, link controls, proofs.

### 10.2 Client portal (`/q/[token]`) and the projector (`lib/quote-calc-portal.ts`)

`PublicQuote` v2, projected from `computeTotals(config)` only:

```ts
interface PublicQuoteV2 {
  clientName: string; eventType: string; eventDate: string;
  title: string;                                        // group names / line names (quoteDisplayName v2)
  groups: { name: string; pieces: { name: string; qty: number | null; detail?: string }[];
            subtotal: number; savingsPct: number; savings: number }[];
  extras: { name: string; qty: number | null; detail?: string; price: number }[];   // standalone + custom lines
  services: { label: string; price: number }[];          // "Extra revision round ×1", "File license", "Packaging & handling"
  discount: { label: string; amount: number } | null;   // "Family & friends (10%)" — truthful
  rush: { label: string; amount: number } | null;       // "Rush production (+30%)"
  adjustment: { label: string; amount: number } | null;
  shipping: number | null;
  subtotal: number; savings: number; total: number;
  depositExpected: number; depositPaid: number; balanceRemaining: number;
  proofs: { images: PublicQuoteFile[]; pdfs: PublicQuoteFile[] };
  clientNote: string;
}
```

- **Never** includes: `listUnitPrice`, `est`, health, `productId`, options' `estCost`, `legacy`,
  hidden notes.
- The view renders suites as a list of pieces with quantities, then "Suite savings (12%) −$77.76",
  then extras, services, discount, rush, adjustment and total.
- The existing deposit/balance and shipping footnote stay.

### 10.3 Print (`app/quote-calc/print/_components/PrintQuote.tsx`)

- Same projector. Remove `assumptions`/`catalog` loading.
- "Suite savings (12%)" and "Family & friends (10%)" are now truthful.
- Unsaved working quotes print from the builder's in-memory v5 config. `loadSavedDefaults()` goes
  away.

### 10.4 Dashboard (`app/quotes/page.tsx`, `app/quotes/_components/Dashboard.tsx`)

- `total` = `computeTotals(config).total` (identical to `cachedTotal` by construction).
- Add a **Duplicate** row action.
- Optional: an est. $/hr column (admin screen only).
- `packageName` → `quoteDisplayName` v2.

### 10.5 Sheets writer (`lib/quote-calc-sheets.ts`, `lib/quote-calc-summary.ts`)

- `draftToReadableRow`: G = summary, H = households, I = `summarizeLinesV5` (priced),
  J = `Math.round(total)`.
- Optional V/W (est. $/hr, est. costs) written in the same upsert as a second range write.
- `ensureNewSchema` updates the header (H → "Households", optional V/W).

### 10.6 New: Price book page (`/quotes/prices`)

- Read-only view of the merged price book, grouped by category.
- Each product row shows: price · design fee · digital price · qty rule · **floor / target** (§7.2)
  · market range · a position bar (floor ← you → market) · flags.
- Packages section: each package's pieces and a sample total at 50 / 100 households, plus "≈ $X
  per household". This is the number to compare against competitor suite pricing.
- Warnings list (the same `ConfigWarning` shape), with tab + row.
- Actions:
  - **Open Google Sheet** (link built from `GOOGLE_SHEETS_DOC_ID`; the page is admin-gated).
  - **Reload** (`?refresh=1`).
  - **Create price book tabs** (seed; shown only when tabs are missing or empty).

### 10.7 App shell (`components/quote-app/AppShell.tsx`)

Nav becomes **Dashboard · New quote · Price book**.

---

## 11. Code change inventory

Phase tags refer to §12.

### 11.1 New files

| File | Phase | Contents |
|---|---|---|
| `lib/quote-pricebook.ts` | P1 | Types `Product`, `ProductOption`, `PackageTemplate`, `PriceSettings`, `PriceBook`; `DEFAULT_PRICE_BOOK` (bundled seed = Appendix B); `mergePriceBook(remote)` validation → `{ priceBook, warnings }`; `floorPrice` / `targetPrice` (§7.2) |
| `lib/quote-pricebook-remote.ts` | P1 | Client wrapper for `GET /quote-calc/api/pricebook` (RemoteResult pattern, `refresh`) + localStorage last-good cache |
| `app/quote-calc/api/pricebook/route.ts` | P1 | Cookie-gated `GET`, merged price book + warnings; `?refresh=1` bypasses the cache |
| `app/quote-calc/api/pricebook/seed/route.ts` | P1 | Cookie-gated `POST`: create/seed missing-or-empty `Products` / `Options` / `Packages`, append missing `Settings` keys; never overwrites |
| `app/quotes/prices/page.tsx` + `_components/PriceBookView.tsx` | P1 | §10.6 |
| `lib/quote-engine.ts` | P2 | `computeTotals(config)`; builders `newQuote(priceBook)`, `addProduct`, `addPackage`, `addCustomLine`, `setGuestCounts`, `setTargetTotal`, `diffAgainstPriceBook`, `applyRefresh`; `isDigitalQuote`; `quoteDisplayName` |
| `lib/quote-health.ts` | P2 | `computeHealth(config, totals)` (§7.1) |
| `lib/quote-legacy.ts` (+ `lib/legacy/…`) | P2 | Frozen copy of today's `quote-calc-logic.ts` / `quote-calc-totals.ts` / v1–v4 migration; `convertLegacyDraft(draft, catalog)` |
| `lib/quote-engine.test.ts` | P2 | Invariants §6.4, health cases, conversion parity (v1, v2, v4, zero-line, custom-only, rush + misc v1 vs v2, all 6 packages × reuse/color/paper × discounts) |
| `app/quote-calc/api/drafts/freeze/route.ts` | P3 | Cookie-gated one-time batch conversion (§8.5) |
| `components/quote-app/HealthCard.tsx` | P3 | Shared by the builder summary and Profile Overview |
| `components/quote-app/DuplicateQuoteButton.tsx` | P3 | Dashboard + Profile Overview |
| `app/quote/new/_components/QuoteBuilder.tsx` | P4 | Replaces `QuoteCalculator` (state = `DraftConfigV5` via a reducer, sync/save logic reused) |
| `app/quote/new/_components/{EventBasics, PackageChips, LineGroup, LineRow, ProductCombobox, OptionChips, ServicesPanel, DiscountControl, SummaryPanel, SetTotalDialog, ShowMath, PriceRefreshBanner}.tsx` | P4 | §9 |

### 11.2 Modified files

| File | Phase | Change |
|---|---|---|
| `app/quote-calc/_components/QuoteCalculator.tsx` | P0 | Don't overlay remote assumptions onto an opened draft (apply the Sheet overlay only when no draft is loaded, or behind an explicit "Re-price with current rates" action) |
| `app/quote-calc/print/_components/PrintQuote.tsx`, `BreakdownPanel.tsx`, `QuoteCalculator.tsx` (package cards) | P0 | Client-facing discount labels: drop the stated % or show the effective % (`amount / list`); totals untouched |
| `BreakdownPanel.tsx` + `QuoteCalculator.tsx` totals | P0 | Count admin overhead as a cost in "Your costs"; compare against the margin equivalent of the target (`profit/(1+profit)` on cost+admin) |
| `lib/quote-calc-config.ts` | P1 | Old whitelist silently tolerates the new `Settings` keys |
| `lib/quote-calc-sheets.ts` | P1, P3 | `listPriceBook()` (reads 4 tabs, 60 s cache, same token/cache pattern as `listConfig`); `seedPriceBookTabs()`; convert-on-read in `getDraftById` / `listDraftRecords`; readable row v5; header update; optional V/W |
| `lib/quote-calc-drafts.ts` | P2 | v5 types, `CURRENT_SCHEMA_VERSION = 5`, `createDraft` without a snapshot, `migrateDraft` → v4 migration then `convertLegacyDraft`, `normalizeIncomingDraft` accepts v5, `EMPTY`/`DEFAULT` v5 config |
| `lib/quote-calc-portal.ts` | P3 | `PublicQuoteV2` + `buildPublicQuote(draft, totals, files, depositPaid)`; `isDigitalQuote` / `projectTypeOf` on v5 |
| `lib/quote-calc-summary.ts` | P3 | `summarizeLinesV5`, `quoteDisplayName` v2 |
| `app/q/[token]/page.tsx`, `_components/PublicQuoteView.tsx` | P3 | `computeTotals`, drop the catalog fetch, render groups / extras / services / discount / adjustment / shipping |
| `app/quotes/[id]/page.tsx` | P3 | §10.1 |
| `app/quotes/page.tsx`, `_components/Dashboard.tsx` | P3 | §10.4 |
| `app/quote-calc/print/_components/PrintQuote.tsx` | P3 | §10.3 |
| `app/quote-calc/api/drafts/route.ts` | P3 | Accepts v5; the Drive folder logic is unchanged |
| `components/quote-app/AppShell.tsx` | P1 | "Price book" nav item |
| `app/quote/new/page.tsx` | P4 | Render `QuoteBuilder` |
| `.claude/CLAUDE.md`, `docs/QUOTE_CALC_MODEL.md` | P5 | Rewrite the Quote Calculator section (formula, tabs, data model v5, files). `QUOTE_CALC_MODEL.md` is already stale (17 items, 7 packages, multiplicative discounts). |

### 11.3 Deleted in P5 (after the freeze has run and P4 has shipped)

- `app/quote-calc/_components/{QuoteCalculator, AssumptionsPanel, ItemAssumptionRow, BreakdownPanel, MiscAddOnSection}.tsx`
  - Keep `ClientInfoSection`, `PasswordGate`, `ConfigBanner` and `MobileBreakdownSheet` (reuse as
    the summary sheet).
  - `DraftsBar`: fold into the builder's save bar, or delete if P4 replaces it.
- `lib/quote-calc-config.ts`, `lib/quote-calc-config-remote.ts`, `app/quote-calc/api/config/route.ts`,
  and `listConfig()` / Items parsing in `lib/quote-calc-sheets.ts`.
- In `lib/quote-calc-logic.ts`: `loadSavedDefaults` / `saveDefaults` / `clearSavedDefaults` /
  `exportSettings` / `importSettings`, `QuoteState`, `DEFAULTS`, `ITEM_CATALOG`, `PACKAGES`. The
  frozen copies live on in `lib/legacy/` only if some reader still needs them. After the freeze,
  nothing does; delete them too, and keep `convertLegacyDraft` only if un-frozen local caches could
  still exist.
- `lib/quote-calc-totals.ts` and `lib/quote-calc-totals.test.ts` (superseded by the engine and its
  tests).
- In the Sheet: legacy `Settings` rows and the `Items` tab (rename to `_legacy_Items` rather than
  delete).

---

## 12. Implementation phases

Each phase is shippable on its own and leaves every surface working.

### P0: Quick fixes on the current calculator (no total changes) · ~½ day

**Why first:** Janelle quotes every week; these three are misleading today.

1. **C3 (snapshot race):** in `QuoteCalculator.tsx`, track whether a draft was loaded. If so,
   apply the remote config to `catalog` only, not to `assumptions`, and show a small "Re-price
   with current Sheet rates" button.
2. **A3 (truthful labels):** client-facing discount labels show the effective % (or no %):
   `PrintQuote.tsx:330`, `:369`, `BreakdownPanel.tsx:245`, and the package-card badge
   (`QuoteCalculator.tsx:484-488`). Money is unchanged.
3. **A4 (margin badge):** include admin overhead in "Your costs" and compare against the margin
   equivalent of `targetProfitPtg`.

**Accept when:**
- Opening a saved quote shows the same total as `/q/<token>`.
- Printed percentages equal amount ÷ base.
- An undiscounted quote reads "on target".
- `lib/quote-calc-totals.test.ts` still passes.

### P1: Price book in the Sheet (quoting unchanged) · ~2–3 days

**Scope:**
- `lib/quote-pricebook.ts`, `listPriceBook()` + `seedPriceBookTabs()` in `quote-calc-sheets.ts`.
- `GET /quote-calc/api/pricebook` and `POST …/pricebook/seed`.
- The `/quotes/prices` page, the AppShell nav item, and old-whitelist tolerance.

**Why before the engine:** Janelle can start moving prices toward the market (and filling market
ranges) while P2–P4 are built, and the new builder launches on prices she has reviewed.

**Accept when:**
- Seeding a blank Sheet creates the 3 tabs + Settings keys exactly as in Appendix B.
- Re-running the seed changes nothing.
- A bad cell shows a banner naming the tab and row.
- Adding a row appears on the Price book page after Reload.
- The old calculator shows no new warnings.

**Risk:** a seed write on a Sheet Janelle has edited. Mitigation: seed only missing or empty tabs,
and only append missing keys.

### P2: Engine, data model, legacy conversion (libraries + tests only) · ~2–3 days

**Scope:** `lib/quote-engine.ts`, `lib/quote-health.ts`, `lib/quote-legacy.ts` (frozen move of
today's engine), the v5 types in `quote-calc-drafts.ts`, and `lib/quote-engine.test.ts`.

**Accept when:**
- All §6.4 invariants pass.
- The conversion parity matrix passes (< $0.005 on every fixture, including the existing
  `quote-calc-totals.test.ts` scenarios).
- The engine does not import the price book when computing totals (enforced by the test: same
  config + two different price books ⇒ same total).

### P3: Read surfaces on v5 + freeze · ~2–3 days

**Scope:**
- Convert-on-read in the Sheets readers.
- `PublicQuoteV2` projector.
- `/q/[token]`, Profile Overview (health panel, indicators, Duplicate), print, dashboard.
- Readable row v5, and the freeze endpoint.

**Accept when:**
- Before running the freeze, every existing quote shows the **same total** on the dashboard,
  `/q`, Profile Overview and print as before deploy (spot-check 5 real quotes plus the parity
  test).
- The freeze reports `parityFailures: 0`.
- Editing a value in `Items` afterwards changes no quote.

**Risk:** a cent-level difference on the client page. Mitigation: parity tolerance plus a
manual comparison list captured before deploy (§13.3).

### P4: New builder · ~4–6 days

**Scope:** `QuoteBuilder` and its components (§9, §11.1), replacing `QuoteCalculator` at
`/quote/new`. Editing a legacy quote opens its converted v5 form and saves as v5.

**Accept when:**
- A Signature quote for 90 households with two option chips, a price override, a custom line and
  a F&F discount takes < 2 minutes.
- Changing households re-quantifies linked lines only.
- "Set total" lands exactly.
- The builder summary equals the `/q` page to the cent.
- It works offline on the cached price book.
- Mobile: bottom bar + sheet, with 44 px targets.

### P5: Cleanup and docs · ~1 day

- Delete the files in §11.3.
- Retire the `Items` tab and legacy `Settings` rows.
- Optional `Quotes` V/W columns.
- Rewrite the CLAUDE.md Quote Calculator section and `docs/QUOTE_CALC_MODEL.md`, and link this
  document as history.

### Later (not in scope)

- Spanish product names (`name_es`) for the client page.
- A per-household figure on the client page (toggle).
- Win/loss tracking by price level. The stage already records progression; add "lost" to learn
  which prices convert.
- Reusable quote templates saved from real quotes ("save as package").

---

## 13. Testing and verification

### 13.1 Unit tests

- **Where:** `lib/quote-engine.test.ts`, following the repo pattern of plain Node with no test
  runner.
- **Running them:** the repo uses extension-less imports, so compile first, then run:
  ```
  tsc --target es2020 --module commonjs --skipLibCheck --lib es2020,dom \
      --outDir /tmp/qe lib/quote-engine.ts lib/quote-health.ts lib/quote-legacy.ts lib/quote-engine.test.ts
  node /tmp/qe/quote-engine.test.js
  ```
  This is the approach used to produce the numbers in this document.
- **Type checks and lint:** `npx tsc --noEmit` and `npm run lint` inside the dev container
  (`docker-compose up`).

### 13.2 Conversion parity

- Fixtures: every scenario already in `lib/quote-calc-totals.test.ts`, plus:
  - all 6 packages × {fresh, reuse} × {plain, color, paper}
  - vendor + F&F + custom discounts
  - rush with and without misc under v1 and v2
  - zero-line quotes, custom-only quotes, digital items
- Optional: a one-off script that pulls the `_data` payloads and asserts parity on real quotes
  before running the freeze.

### 13.3 Manual end-to-end (dev container)

1. Before the P3 deploy, record the dashboard totals and 5 `/q/<token>` totals.
2. After the P3 deploy, confirm they are identical. Run the freeze, confirm again, then edit a
   quantity in `Items` and confirm nothing moves.
3. P1: seed a copy of the Sheet; add a product row, Reload, and confirm it appears. Break a cell
   and confirm the banner.
4. P4: build the §6.5 example and confirm $570.00 and ≈ $24.21/hr. Open `/q/<token>` and print,
   and confirm the same numbers, truthful %s, and no health or cost data.
5. Private window: `/q/<token>` still shows no cost internals. The page source contains no
   `est`, `listUnitPrice` or `legacy`.

---

## 14. Decisions from Janelle (resolved 2026-09-27)

| # | Question | Decision | Where it lands |
|---|---|---|---|
| 1 | Which contents do the suites have? | **The website's** (`config/site.ts`). The calculator's extra pieces (save the date, guest settings, welcome sign, seating chart) become standalone add-on products. | `Packages` seed (B.4) |
| 2 | Is "Short and Suite" digital-only? | **No, printed by default.** Any line can still be switched to digital in the builder. | `Packages.delivery = physical` |
| 3 | Event ✦ savings with 0% discounts | **Real bundle %, the same as weddings:** The Basics 10%, Add Some Fun 12%, Give Me the Works 15%. The ✦ badges on `/events` stay and are now honest. | `Packages.bundlePct` |
| 4 | Wedding bundle % | **True 10 / 12 / 15%** off the suite price (Short and Suite / Sweet Spot / Signature). Suite totals come out about 5–6% lower than today's labor-only discounts gave (Appendix B.1). | `Packages.bundlePct` |
| 5 | $/hr goals | **Target $30/hr, floor $25/hr.** | `Settings.hourlyTarget` / `hourlyFloor` |
| 6 | Fees | **6%** of revenue (card processing plus some Etsy / Zola orders). | `Settings.feesPct` |
| 7 | Guests per household | **2.** | `Settings.guestsPerHousehold` |
| 8 | Envelopes | **Keep it simple: 2 per household**, one for the invite and one for the RSVP reply, as a single `envelope` product. Envelope printing (addressing) is a separate product at 1 per household, priced later. | `Products` seed (B.2) |
| 9 | Shipping | **Optional line.** Default "added later" with today's footnote; when the carrier cost is known she can type it in, and it is never discounted or rushed. | §6.3, §9.2 ④ |
| 10 | Digital prices | **Keep today's $16 per design for now** and raise later in `Products.digitalPrice`. | `Products` seed (B.2) |

### Remaining follow-ups (Janelle, in the Sheet; no code needed)

1. Price the six to-do products: envelope printing, envelope liner, suite pocket/band/clip, wax
   seal, extra card design, AI render.
2. Set real upcharges for the `Options` rows (textured paper, full color, gold foil).
3. Fill `marketLow` / `marketHigh` for the best sellers.
4. Raise prices where the health check reads below target. At seed prices, a plain Sweet Spot
   quote pays ≈ $28/hr (§6.5).
5. Raise digital prices when ready. They are still $16 per design.

### Optional website follow-up

Save the date, welcome sign, seating chart and personalized guest settings are now sold only as
add-ons, but the "Individual Items and Enhancements" ticker on `/weddings` and `/events`
(`config/site.ts`, the `add-ons` tier) doesn't list them. Add them there so clients know they can
order them.

---

## 15. Implementation notes (decisions made while building)

Details the plan left open, resolved in the direction of §4. None of them changes the money
on an existing quote.

**P1 (price book)**
- The seed rows in `lib/quote-pricebook.ts` are the single source for both the bundled fallback
  (`DEFAULT_PRICE_BOOK` is parsed from them) and the seed endpoint, so the two cannot drift.
- A product or option without a price is a **to-do**, not an error: it raises a `needs-price`
  warning that the Price book page lists under "Still to price", and the builder banner hides.
  The product stays in the book (packages add it at $0 with a "set price" badge) but is left out
  of the picker. Inactive rows are also left out of the picker.
- Each tab falls back to the seed on its own: a missing or empty `Products` tab uses the bundled
  products even if `Options` is filled in. Settings that are missing or not numbers keep their
  seed value and name the row.
- The seed writes with `USER_ENTERED` so Janelle gets real numbers and TRUE/FALSE cells. A Settings
  tab that exists only gets the missing keys appended; `depositAmount` is never overwritten.
- The Price book page shows floor · target per piece and, for design fees, flags *below floor*
  when the fee is under `estDesignHours × hourlyFloor`. The position bar's dot uses Powder Rose
  only when the price reaches the target (state only).
- App shell on phones: the logo hides and Sign out becomes an icon button so the three nav items
  fit at 375 px; `ConfigBanner` lost its 4 px side stripe (forbidden by DESIGN.md) and wraps.

**P2 (engine, data model, conversion)**
- The v5 types live in `lib/quote-types.ts` (pure) and are re-exported from `quote-calc-drafts.ts`
  when the surfaces switch in P3, so the engine never imports browser storage code.
- Three small fields beyond §8.1: `config.reuseDesignPct` (the reuse % is a policy snapshot, like
  `rushPct`, so totals stay config-only), `line.listDesignFee` (so the refresh diff can tell a
  changed design fee from an edited one), and `line.system` (`"services"` / `"rush"`, marking the
  fixed-$ lines a conversion writes so they stay out of the display name).
- **Converted quotes keep the old engine's arithmetic.** When `config.legacy` is present the
  engine skips cent rounding, and the surfaces keep the whole-dollar display those quotes always
  had. Rounding each converted component to cents drifts the total by up to $0.013 across the
  254 parity fixtures, which fails the < $0.005 rule; without rounding the worst case is 1e-13.
  Quotes built in the new builder round every component to cents as §6.3 says.
- Converted lines keep the old label as `name` ("Sweet Suite") and put the count in `detail`
  ("80 households", "120 pcs", "design") instead of "Sweet Suite — 75 households". The dashboard's
  display name stays exactly what it was, and the copy avoids em dashes. Order: priced lines,
  project services, custom add-ons, rush. Line ids are derived from the quote id, so converting
  twice gives the same config.
- A digital product line is its digital price only: no design fee, no per-piece options (percent
  and flat options still apply). Custom lines are always `qty × unitPrice` (+ design fee/options);
  their digital flag only drives packaging and the project type.
- Today's engine was moved, unchanged, to `lib/legacy/` (`logic`, `totals`, `types`, `migrate`).
  The old module paths re-export it so the old calculator keeps working until P5.

**P3 (read surfaces + freeze)**
- `Draft` is now the v5 draft; the pre-v5 draft is `LegacyDraft`, still written by the old
  calculator until P4. `StoredDraft = Draft | LegacyDraft` is what a `_data` cell holds.
  `toV5Draft(stored, catalog)` is the single conversion, used by every read surface.
- Sheets readers: `listDraftRecords()` / `getDraftById()` return v5 (legacy converted in memory
  with the live `Items` catalog); `listStoredDraftRecords()` / `getStoredDraftById()` return
  payloads as stored, for the paths that write back (hidden notes, duplicate, freeze), so none of
  them converts a quote as a side effect. `GET /quote-calc/api/drafts` still returns stored drafts
  (the old calculator reads them until P4).
- **Duplicate** copies the stored payload as-is (a legacy quote stays legacy until the freeze), so
  the copy's total is identical; it gets a fresh id and no portal columns.
- **Print** reads the quote from the new `GET /quote-calc/api/drafts/[id]` (the same v5 view as
  `/q`), falling back to this browser's cache; "Working quote" prints the builder's last session.
  The fine print now names the real deposit instead of "a 50% deposit".
- `PublicQuote` v2 adds `wholeDollars` (true for converted quotes), `anyPhysical` (drives the
  shipping footnote) and `extras[].includes`. Converted fixed-price lines show no "× 1".
  One shared `InvestmentList` renders it on `/q`, Profile Overview and print.
- The freeze report adds `unreadable` and `dashboardCorrections`: quotes whose old dashboard figure
  (`cachedTotal`, which the C2/C3 bugs could leave stale) differed from their client link. After
  P3 the dashboard shows the client-link total for every quote, so those rows change on the
  dashboard only; `/q`, Profile Overview and print do not move.
- Dashboard rows wrap their actions under the name on phones so every action is a 44 px target.

## Appendix A: Current-engine numbers (default settings, fresh design, no toggles)

| Quote | List | Discount (stated → actual) | Total | $/household | Design h | Production h | Materials |
|---|---|---|---|---|---|---|---|
| Design Suite @75 (digital) | $31.63 | 10% → 7.9% | $29.13 | $0.39 | 1.0 | 0 | $0 |
| Sweet Suite @75 | $716.54 | 12% → 7.6% | $664.95 | $8.87 | 2.0 | 16.3 | $110.18 |
| Signature Suite @75 | $1,352.64 | 15% → 9.6% | $1,225.36 | $16.34 | 4.8 | 30.0 | $199.70 |
| The Basics @30 | $127.12 | 0% | $130.29 | $4.34 | 1.0 | 2.5 | $12.99 |
| Add Some Fun @50 | $413.10 | 0% | $416.26 | $8.33 | 1.8 | 7.8 | $88.65 |
| Give Me the Works @50 | $849.38 | 0% | $852.55 | $17.05 | 3.0 | 14.6 | $231.87 |

Totals include the once-per-quote packaging service ($2.50 × 1.265) on physical quotes.

Other checks:
- **Family & friends 10% on Sweet Suite @75:** $45.63 off a $716.54 line (6.4%). Total $619.33.
- **Digital license on the Design Suite:** $7.50 raw, $9.49 billed.
- **Margin badge on an undiscounted Invite ×100 ($213.63):** shows 20.9% (≈ "+6 pts above the
  15% target"). Real profit after admin overhead is 13.0%, i.e. exactly on target.
- **Margin badge on Signature @75 with its bundle:** shows 12.5% ("2 pts below target", amber).
  Real profit after overhead is 3.8%.

## Appendix B: Seed price book

### B.1 How the seed is derived (parity with today)

```
price         = (sheetCost/yield × 1.05 + prodMin/60 × hourly) × 1.265   → rounded to $0.05
designFee     = designMin/60 × hourly × 1.265                            → rounded to $1
digitalPrice  = designFee        (today a digital piece is billed as design labor only)
estUnitCost   = sheetCost/yield × 1.05     estMinutes = prodMin     estDesignHours = designMin/60
```

Checked against the current engine, using the calculator's current package contents:
- The Sweet Suite @75 list is **$716.50** under the seed vs $716.54 today.
- The Signature Suite @75 is $1,355.25 vs $1,352.64.
- Both are within 1% list for list.

Bundle %s are Janelle's advertised **10 / 12 / 15%**, now applied to the whole suite price (§14).
Today's labor-only rule only ever gave clients about 8 / 8 / 10%, so suite totals come out lower
(same contents, 75 households):

| Suite | Today (net) | Seed price book | Change |
|---|---|---|---|
| Sweet Suite | $661.79 | $630.52 ($716.50 − 12%) | −4.7% |
| Signature Suite | $1,222.20 | $1,151.96 ($1,355.25 − 15%) | −5.7% |

Parity is per product. The seeded `Packages` follow the website's contents rather than the
calculator's (§14, decision 1), so a suite's total also changes by exactly the pieces added or
removed.

### B.2 `Products`

| id | name | price | category | designFee | digitalPrice | qtyBasis | qtyPer | estUnitCost | estMinutes | estDesignHours | active |
|---|---|---|---|---|---|---|---|---|---|---|---|
| save-the-date | Save the date | 1.70 | Invitations | 16 | 16 | household | 1 | 0.10 | 3 | 0.50 | |
| invite | Invitation | 1.95 | Invitations | 16 | 16 | household | 1 | 0.29 | 3 | 0.50 | |
| detail-card | Detail card | 1.95 | Invitations | 16 | 16 | household | 1 | 0.29 | 3 | 0.50 | |
| rsvp | RSVP card | 2.30 | Invitations | 16 | 16 | household | 1 | 0.14 | 4 | 0.50 | |
| envelope | Envelope | 0.40 | Invitations | | | household | 2 | 0.33 | 0 | 0 | |
| ceremony-card | Ceremony card | 1.95 | Day-of | 24 | 24 | household | 1 | 0.29 | 3 | 0.75 | |
| guest-setting | Personalized guest setting | 2.30 | Day-of | 16 | 16 | guest | 1 | 0.14 | 4 | 0.50 | |
| menu | Menu | 1.80 | Day-of | 8 | 8 | guest | 1 | 0.58 | 2 | 0.25 | |
| place-card | Place card | 1.70 | Day-of | 8 | 8 | guest | 1 | 0.10 | 3 | 0.25 | |
| games | Games | 1.25 | Day-of | 11 | 11 | household | 1 | 0.14 | 2 | 0.33 | |
| welcome-sign | Welcome sign | 29.75 | Signage | 16 | 16 | fixed | 1 | 23.10 | 1 | 0.50 | |
| seating-chart | Seating chart | 29.75 | Signage | 32 | 32 | fixed | 1 | 23.10 | 1 | 1.00 | |
| table-sign | Table top sign | 1.25 | Signage | 8 | 8 | fixed | 1 | 0.58 | 1 | 0.25 | |
| event-sign | Event sign | 1.25 | Signage | 8 | 8 | fixed | 1 | 0.58 | 1 | 0.25 | |
| dessert-sign | Dessert sign | 1.25 | Signage | 8 | 8 | fixed | 1 | 0.58 | 1 | 0.25 | |
| drink-sign | Signature drink sign | 1.25 | Signage | 8 | 8 | fixed | 1 | 0.58 | 1 | 0.25 | |
| dessert-menu | Dessert menu | 1.25 | Signage | 8 | 8 | fixed | 1 | 0.58 | 1 | 0.25 | |
| bar-menu | Bar menu | 1.25 | Signage | 8 | 8 | fixed | 1 | 0.58 | 1 | 0.25 | |
| wedge-topper | Wedge topper | 2.20 | Favors & bar | 16 | 16 | guest | 2 | 0.07 | 4 | 0.50 | |
| wafer-topper | Wafer topper | 1.65 | Favors & bar | 11 | 11 | guest | 2 | 0.04 | 3 | 0.33 | |
| favor-tag | Party favor tag | 2.20 | Favors & bar | 8 | 8 | guest | 1 | 0.06 | 4 | 0.25 | |
| coaster | Coaster | 0.75 | Favors & bar | 8 | 8 | household | 1 | 0.57 | 0.05 | 0.25 | |
| sticker | Sticker | 0.30 | Favors & bar | 8 | 8 | household | 1 | 0.21 | 0.05 | 0.25 | |
| wine-charm | Wine charm | 1.65 | Favors & bar | 11 | 11 | guest | 1 | 0.07 | 3 | 0.33 | |
| drink-charm | Drink charm | 1.65 | Favors & bar | 11 | 11 | guest | 1 | 0.07 | 3 | 0.33 | |
| wine-charm-set | Wine charm set (6) | 9.90 | Favors & bar | 11 | 11 | fixed | 1 | 0.43 | 18 | 0.33 | |
| drink-charm-set | Drink charm set (6) | 9.90 | Favors & bar | 11 | 11 | fixed | 1 | 0.43 | 18 | 0.33 | |
| thank-you | Thank you card | 1.25 | After the event | 16 | 16 | household | 1 | 0.14 | 2 | 0.50 | |
| envelope-printing | Envelope printing | *(set)* | Invitations | | | household | 1 | | | | FALSE |
| envelope-liner | Envelope liner | *(set)* | Invitations | | | household | 1 | | | | FALSE |
| suite-accessory | Suite pocket, band or clip | *(set)* | Invitations | | | household | 1 | | | | FALSE |
| wax-seal | Wax seal (adhesive) | *(set)* | Invitations | | | household | 1 | | | | FALSE |
| extra-card-design | Extra card or shape design | *(set)* | Services | | | fixed | 1 | | | | FALSE |
| ai-render | AI-generated event render | *(set)* | Services | | | fixed | 1 | | | | FALSE |

Seed notes:
- **Quantity-rule fixes vs today** (intentional, per A2):
  - Signs and the dessert/bar menus are `fixed 1` (they were 8 signs, or 2 menus per household).
  - Per-person items (menu, place card, guest setting, favor tags, charms, toppers) follow `guest`
    instead of "2 per household"; with `guestsPerHousehold = 2` this gives the same count.
- **Envelope** stays one product at 2 per household: one for the invite, one for the RSVP reply
  (§14, decision 8). Envelope printing (addressing) is separate, at 1 per household.
- **Digital prices** stay at today's $16 per design (the `designFee`) until Janelle raises them
  (§14, decision 10).
- **The last six rows** are the to-do list of products sold on the site with no price yet.
- **Welcome sign and seating chart** show how thin today's large-format pricing is ($29.75 against
  $23.10 of board). Worth checking against the market first.

### B.3 `Options` (parity placeholders — set your real upcharges)

| id | name | kind | amount | appliesTo | estCost | notes |
|---|---|---|---|---|---|---|
| textured-paper | Textured paper | percent | 6 | Invitations, Day-of | | Parity with today's ×1.3 paper factor (≈ +6% of an invite's price) |
| full-color | Full color design | percent | 10 | | | Parity with today's ×1.5 ink factor (≈ +10%) |
| gold-foil | Gold foil | per-piece | *(set)* | Invitations | | Inactive until priced |

### B.4 `Packages` (contents from `config/site.ts`; bundle % and delivery per §14)

| id | name | type | items | bundlePct | delivery |
|---|---|---|---|---|---|
| short-and-suite | Short and Suite | wedding | detail-card, invite | 10 | physical |
| sweet-spot-suite | Sweet Spot Suite | wedding | detail-card, invite, rsvp, envelope, envelope-printing | 12 | physical |
| signature-suite | Signature Suite | wedding | rsvp, detail-card, invite, envelope, envelope-printing, suite-accessory, ceremony-card, table-sign, ai-render | 15 | physical |
| the-basics | The Basics | event | invite, thank-you | 10 | physical |
| add-some-fun | Add Some Fun | event | invite, thank-you, menu, event-sign, dessert-sign | 12 | physical |
| give-me-the-works | Give Me the Works | event | invite, thank-you, menu, dessert-menu, bar-menu, welcome-sign, event-sign, dessert-sign, drink-sign | 15 | physical |

### B.5 `Settings` (new keys)

`guestsPerHousehold 2 · rushPct 30 · revisionRoundPrice 16 · revisionHours 0.5 · licenseFee 20 ·
packagingFee 3 · depositAmount (current) · reuseDesignPct 25 · vendorReferralPct 10 · feesPct 6 ·
hourlyTarget 30 · hourlyFloor 25`

## Appendix C: Old → new settings map

| Old | New | Note |
|---|---|---|
| `hourly` | `hourlyFloor` / `hourlyTarget` | No longer multiplies prices; drives health + floor prices |
| `adminPtg`, `targetProfitPtg` | — | No markup; profit is price − costs, judged by $/hr |
| `errorMarginPtg` | folded into `estUnitCost` | A rough cost already includes waste |
| `packagingCost` | `packagingFee` | Flat, billed as-is |
| `reuseFactor` | `reuseDesignPct` | Now a % of the design fee, per line |
| `revisionMin` | `revisionRoundPrice` + `revisionHours` | Price and time separated |
| `discountDiy` … `discountEventWorks` | `Packages.bundlePct` | True % of the suite subtotal |
| `vendorIncentivePtg` | `vendorReferralPct` | A discount-reason preset, true % |
| `fullColorFactor`, `customPaperFactor` | `Options` rows | Per line, per product |
| `rushFeePtg` | `rushPct` | Same meaning |
| `digitalLicensePtg` | `licenseFee` | Flat |
| `depositAmount` | `depositAmount` | Unchanged |
| `i*_dt / _pt / _sc / _y` (92) | `Products.estDesignHours / estMinutes / estUnitCost` | Optional, health only |
| `ITEM_CATALOG.qty / fixed` | `Products.qtyBasis / qtyPer` | Visible, editable per line |
