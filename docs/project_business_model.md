---
name: project-business-model
description: "GutierrezByJanelle business model — custom wedding stationery, what's sold, how pricing works, key considerations"
metadata: 
  node_type: memory
  type: project
  originSessionId: b13220f6-9d2c-4833-b203-e42449907aab
---

## Business Type

GutierrezByJanelle is a **home-based custom wedding stationery and event decor** business run by Janelle. She designs, prints, cuts, and ships everything herself — no outsourced printing. This means all labor (design + production) is her own time, and materials are purchased at retail/small-batch scale.

## What She Sells

**Two delivery modes:**
- **Physical** — Designed, printed at home, hand-cut/assembled, and shipped. Materials cost = paper/cardstock + ink + packaging.
- **Digital (DIY)** — Design files delivered as print-ready PDFs via email. No printing, no shipping, no materials.

**15 product types in the catalog:**

| Category | Items | Notes |
|----------|-------|-------|
| **Pre-wedding mail** | Save the date, Invite, Detail card, RSVP, Envelopes (2 per household) | Core revenue — every client needs these |
| **Day-of pieces** | Ceremony card, Welcome sign (1 per event), Seating chart (1 per event), Menu, Drink toppers, Table signs, Place cards, Personalized guest settings | Higher-margin upsells; signs are large-format/time-intensive |
| **Post-wedding** | Thank you cards, Party favor tags | Common reorders after the event |

**Bundled into 4 package tiers:**

1. **Individual Item** — Any single item a la carte (digital or physical). No bundle discount.
2. **Design Suite** — Save the date + Invite as print-ready PDFs. 10% bundle discount.
3. **Sweet Suite** — Full invite suite (Save the date, Invite, Detail, RSVP, Envelopes) printed and shipped. 12% bundle discount.
4. **Signature Suite** — Everything in Sweet Suite + ceremony cards, guest settings, welcome sign, seating chart. 15% bundle discount.

**Add-ons** (available alongside any package): Menu, Drink toppers, Table signs, Place cards, Thank you cards, Party favor tags.

## Pricing Model

Cost-plus with transparent markups:

```
price = variable_cost × (1 + admin%) × (1 + profit%) × (1 - discount%)
```

**Variable cost per item:**
- **Design labor** = time × hourly rate (one-time per design, regardless of quantity)
- **Production labor** = time per unit × hourly rate × quantity (physical only)
- **Materials** = (sheet cost / yield per sheet) × (1 + error margin) × quantity (physical only)

**Order-level costs:**
- **Packaging** = flat cost per physical order (box, tissue, ribbon)
- **Revision labor** = extra revision rounds × 30min × hourly rate

**Markups applied in sequence:**
- Admin overhead (default 25%) — covers marketing, website, customer management
- Target profit (default 30%) — desired margin on top of all costs

**Discounts reduce the marked-up price:**
- Package discount (tier-based: 0%, 10%, 12%, 15%)
- Vendor incentive (stackable — for referral partnerships, default 10%)

**Why:** admin% + profit% replaced the old opaque "2x print markup" and "1.25x shipping markup." The new model lets Janelle see exactly where margin comes from and adjust each lever independently.

**How to apply:** Any pricing discussion or calculator changes should preserve this formula structure. The admin% and profit% are separate because they serve different purposes — admin covers real overhead costs, profit is the margin target.

## Extras / Surcharges

- **Rush fee** — percentage surcharge (default 30%) for turnaround under 7 days
- **Digital license** — 30% premium on design labor when customer also receives source files
- **Full color designs** — multiplier on sheet cost (default 1.5×) for heavy ink coverage
- **Custom paper** — multiplier on sheet cost (default 1.3×) for premium/specialty stock
- **Reuse factor** — when reusing a previous design (default 0.25 = 25% of fresh design time)

## Key Business Considerations

- **Shipping is excluded from pricing formula** — varies too much by order size/destination. Janelle adds actual carrier cost manually per order.
- **Quantity scaling** — most items scale with guest count (qty = per-household multiplier × number of households). Signs are fixed quantity (1 welcome sign, ~8 table signs, 1 seating chart).
- **Yield matters for margin** — items like drink toppers (12 per sheet) and party favor tags (8 per sheet) have excellent material margins at scale. Place cards (4 per sheet) are also strong.
- **Design time is the biggest cost driver** — seating charts (3.5h) and welcome signs (3h) are the most labor-intensive. For reuse orders, design time drops to 25% of fresh.
- **Envelopes have no design time** — they're a material-only cost (addressing/production time only).
- **Error margin** (default 5%) is a buffer on materials for misprints and paper waste — important because she prints at home where waste rates are higher than commercial printers.
- **The business operates through multiple channels** — website (gutierrezbyjanelle.com), Etsy shop (xgutierrezbyjanelle.etsy.com), Zola vendor profile, and Instagram (@gutierrez.byjanelle).
