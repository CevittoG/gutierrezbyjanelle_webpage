# Quote Builder: Pricing Model Reference

A plain-language explanation of how Janelle's quotes are priced. The design history and every
decision behind it are in [quote-builder-redesign.md](quote-builder-redesign.md).

---

## The idea in one line

**Prices come from Janelle; costs only warn.** Each product has a selling price in the Google
Sheet's price book. A quote adds those prices up, takes off any savings, and shows the client
exactly that. A separate health check estimates what the quote pays Janelle per hour, so she can
see when a price or a discount is too thin. Costs never set the price.

---

## The price book (Google Sheet)

| Tab | What it holds | Required columns |
|---|---|---|
| `Products` | One row per sellable piece | `id`, `name`, `price` |
| `Options` | Upgrades such as textured paper or full color | `id`, `name`, `kind`, `amount` |
| `Packages` | Suite templates (lists of product ids + a bundle %) | `id`, `name`, `type`, `items` |
| `Settings` | Quote policies and health targets (key/value) | `key`, `value` |

- **Adding a row adds a product.** No code change or deploy.
- A product without a price is a to-do: it stays out of the picker, and a suite that includes it
  adds it at $0 with a "set price" badge.
- Optional product columns make the builder smarter: `designFee` (one-time, per line),
  `digitalPrice` (flat file price), `qtyBasis` + `qtyPer` (how the default quantity follows the
  guest count), `estUnitCost` / `estMinutes` / `estDesignHours` (health only), and
  `marketLow` / `marketHigh` (competitor range, reference only).
- The app only reads these tabs. The one exception is **Create price book tabs** on the Price book
  page, which fills tabs that are missing or empty and appends missing Settings keys. It never
  overwrites a row.

Settings: `guestsPerHousehold` 2 · `rushPct` 30 · `revisionRoundPrice` $16 · `revisionHours` 0.5 ·
`licenseFee` $20 · `packagingFee` $3 · `depositAmount` · `reuseDesignPct` 25 · `vendorReferralPct` 10 ·
`feesPct` 6 · `hourlyTarget` $30 · `hourlyFloor` $25.

---

## How a quote is priced

```
Printed line   = qty × (unit price + per-piece options)
                 + percent options on that
                 + flat options
                 + design fee (× 25% when "Reuse design" is on)
Digital line   = file price (+ percent and flat options)
Custom line    = qty × unit price

Suite savings  = bundle % × the suite's subtotal               (a true percentage)
Services       = extra revision rounds × $16
                 + file license (if on)
                 + packaging (once, if anything is printed)
Base           = lines − suite savings + services
Discount       = one discount, a true % of the base or a $ amount, with a reason
Rush           = rush % × (base − discount)
Adjustment     = the signed $ from "Set total…" (0 by default)
Shipping       = optional pass-through, never discounted or rushed

Total          = base − discount + rush + adjustment + shipping
```

- Every amount is rounded to cents, so the lines on the client's page always add up to the total.
- Percentages mean what they say: "Suite savings (12%)" is exactly 12% of the suite, and
  "Family & friends (10%)" is exactly 10% of the base.
- The deposit is display only: the client sees "deposit to begin" and the balance, never a
  different total.

**Quantities.** Households and guests are set once per quote (guests default to households × 2).
A linked line (🔗) follows them: invitations 1 per household, envelopes 2 per household, place
cards 1 per guest. Typing a quantity unlinks that line; signs and other fixed items are 1.

---

## A saved quote is a document

Each line stores its own name and prices when it is added. After that, the total depends only on
the saved quote, never on the price book. If Janelle raises a price later, old quotes and the
links already sent to clients do not move. When she opens an older quote, the builder shows
"N prices changed since this quote was priced" and lets her apply the changes she wants.

Quotes made with the old calculator were converted with their totals preserved to the cent. They
keep whole-dollar amounts, the way clients first saw them, and say "Converted from the old
calculator" on Profile Overview.

---

## The health check (only Janelle sees it)

```
Hours     = design hours (× 25% when reused) + printed qty × minutes per piece + revision hours
Materials = printed qty × estimated cost per piece (+ option costs)
Fees      = 6% of the total
Earned    = total − shipping − packaging − materials − fees
$/hr      = earned ÷ hours
```

- **On target** (✦) at $30/hr or more, **Below target** (~) from $25, **Under your floor** (!)
  below $25.
- If less than 80% of the quote has estimates (custom lines usually don't), the card says how much
  it covers.
- It appears in the builder and on Profile Overview. It never appears on the client page or the
  printed quote.

The **Price book** page uses the same estimates to show, for each product, a floor price (pays
$25/hr after fees), a target price ($30/hr), the market range, and where Janelle's price sits.

---

## Worked example

Sweet Spot Suite for 80 households, textured paper at +$0.25/pc on the invite and detail card, a
welcome sign, one extra revision, family & friends 10%, and a target total of $570:

| Line | Math | Total |
|---|---|---|
| Invitation | 80 × ($1.95 + $0.25) + $16 design | $192.00 |
| Detail card | 80 × ($1.95 + $0.25) + $16 design | $192.00 |
| RSVP | 80 × $2.30 + $16 design | $200.00 |
| Envelope | 160 × $0.40 | $64.00 |
| Suite savings (12%) | 12% × $648.00 | −$77.76 |
| Welcome sign | $29.75 + $16 design | $45.75 |
| Extra revision round | 1 × $16 | $16.00 |
| Packaging & handling | once | $3.00 |
| Family & friends (10%) | 10% × $634.99 | −$63.50 |
| Courtesy adjustment | set total → $570 | −$1.49 |
| **Total** | | **$570.00** |

Health: ≈ 15.9 h of work, ≈ $149 materials, $34.20 fees → about **$24.21/hr**, under the $25 floor.
