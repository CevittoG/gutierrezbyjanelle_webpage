# Quote Calculator — Pricing Model Reference

A plain-language explanation of how Janelle builds quotes and the business model behind the pricing engine.

---

## The Core Formula (Cost-Plus Pricing)

Every quote builds price from the bottom up, starting from real costs:

```
Variable Cost
  + Admin overhead (10%)
  + Target profit (15%)
  = Price Before Discount
  × (1 - package discount - vendor incentive)
  = Final Price
```

**Default rates:**
- Hourly labor rate: **$25/hr**
- Admin overhead: **10%** of variable cost
- Target profit: **15%** of (variable + admin)
- Error margin on materials: **5%** buffer

All rates are overridable from the `Settings` tab of the Google Sheet — no code changes needed.

---

## What Goes Into Variable Cost

For each physical item in the order:

| Component | How it's calculated |
|-----------|---------------------|
| **Design labor** | `(design time in minutes / 60) × $25/hr` |
| **Design labor (reuse mode)** | Same × 25% — when the client reuses a previous design |
| **Production labor** | `(production time/unit in minutes / 60) × $25/hr × quantity` — skipped for digital orders |
| **Materials** | `(sheet cost / items per sheet) × 1.05 error margin × quantity` — skipped for digital orders |
| **Revision labor** | `extra revisions × 30 min/revision × $25/hr` |
| **Packaging** | Flat **$2.50** per physical order |

Shipping is deliberately excluded — added manually per carrier quote after the fact.

---

## Material Cost Modifiers

Two toggles multiply the sheet cost before calculating materials:

- **Full color printing**: sheet cost × **1.5×**
- **Custom paper**: sheet cost × **1.3×**

These stack (both on = 1.95× base sheet cost).

---

## The 17 Catalog Items

Each item has four parameters (overridable from the `Items` tab of the Google Sheet):

| Item | Design (min) | Prod/unit (min) | Sheet cost | Yield |
|------|-------------|-----------------|------------|-------|
| Save the Date | 30 | 3 | $0.55 | 6/sheet |
| Invite | 30 | 3 | $0.55 | 2/sheet |
| Detail card | 30 | 3 | $0.55 | 2/sheet |
| RSVP | 30 | 4 | $0.55 | 4/sheet |
| Envelope | 0 | 0 | $0.31 | 1/sheet *(material cost only, no labor)* |
| Ceremony card | 45 | 3 | $0.55 | 2/sheet |
| Personalized guest setting | 30 | 4 | $0.55 | 4/sheet |
| Welcome sign | 30 | 1 | $22.00 | 1 *(large format)* |
| Seating chart | 60 | 1 | $22.00 | 1 *(most time-intensive)* |
| Menu | 15 | 2 | $0.55 | 1/sheet |
| Wedge topper | 30 | 4 | $0.55 | 8/sheet |
| Wafer topper | 20 | 3 | $0.55 | 16/sheet *(highest yield)* |
| Table top sign | 15 | 1 | $0.55 | 1/sheet |
| Place card | 15 | 3 | $0.55 | 6/sheet |
| Thank you card | 30 | 2 | $0.55 | 4/sheet |
| Party favor tag | 15 | 4 | $0.55 | 10/sheet |
| Games | 20 | 2 | $0.55 | 4/sheet |

Quantities scale by guest household count (e.g., envelopes = 2× households). Fixed-count items (welcome sign, seating chart, table signs) are always 1 or 8 regardless of guest count.

---

## The 7 Packages

### Wedding Packages

| Package | Includes | Discount |
|---------|----------|---------|
| Individual Item | Any single piece, digital or physical | 0% |
| Design Suite | Save the Date + Invite (PDF only, no print) | 10% |
| Sweet Suite | Save the Date + Invite + Detail + RSVP + Envelopes (printed) | 12% |
| Signature Suite | Everything in Sweet + Ceremony + Guest Settings + Welcome Sign + Seating Chart | 15% |

### Event Packages

| Package | Includes | Discount |
|---------|----------|---------|
| The Basics | Invite + Thank Yous | 0% |
| Add Some Fun | Invite + Thank Yous + Menus + 2 Table Signs | 0% |
| Give Me the Works | Invite + Thank Yous + 3 Menus + Welcome Sign + 3 Table Signs | 0% |

Add-ons (menus, toppers, place cards, games, etc.) can be layered on top of any package.

---

## Discounts and Surcharges

| Type | Amount | When applied |
|------|--------|--------------|
| Package discount | 0–15% | Built into each package (see table above) |
| Vendor incentive | 10% | Client referred by a vendor partner |
| Rush fee | +30% | Short turnaround requested |
| Digital license | +30% | Client wants file ownership rights |

Package discount and vendor incentive stack additively. Rush and digital license are surcharges added on top.

---

## What the Calculator Shows Janelle

The breakdown panel exposes the full cost stack so she can evaluate profitability before sending a quote:

- Total direct costs (materials + packaging)
- Total labor cost (design + production + revisions)
- Net profit after all discounts
- **Effective margin** = net profit ÷ final price × 100

---

## Business Model Notes

### Design time dominates cost
A single invite takes 30 min design at $25/hr = **$12.50 in design labor** before any printing. Reuse mode (25% factor) cuts this to $3.13 — strong argument for template-based repeat clients.

### Large-format items have different economics
Welcome signs and seating charts cost $22/sheet vs $0.55 for standard cards (~40× the material cost) and yield only 1 item per sheet. Higher price point, but margins are thinner unless design time is kept short.

### Place cards and toppers scale well
High yield (6–16 per sheet) and short design time make these high-margin at scale. Good upsell items.

### Digital orders are the most profitable per hour
No production labor, no materials, no packaging — pure design margin. The Design Suite carries a 10% package discount but is likely the strongest margin of any package.

### 15% target profit is a floor, not a ceiling
The formula bakes 15% profit in before discounts. The "effective margin" shown in the breakdown is the real number to watch — after discounts and with actual cost structure, it will be lower than 15% on discounted packages.

---

## Where the Numbers Live

All pricing assumptions are editable by Janelle directly in the Google Sheet, no code required:

| Sheet tab | What it controls |
|-----------|-----------------|
| `Settings` | Global rates: hourly, admin %, profit %, error margin, packaging cost, reuse factor, revision time, discount %, surcharge % |
| `Items` | Per-item rates: design time, production time, sheet cost, yield, default quantity |

The app reads these tabs with a 60-second cache and falls back to the hardcoded defaults if the Sheet is unavailable. A banner in the calculator flags any rows that failed to load.
