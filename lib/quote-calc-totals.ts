// Pure quote-total computation, shared by the calculator, the print view, and
// the public client portal so every surface renders the *same* numbers from the
// *same* engine path.
//
// This is the single source of truth for the quote money math. The engine
// (quote-calc-logic) only computes per-line *variable cost*; everything else —
// markup, discounts, the once-per-quote project services (revisions, packaging,
// digital license), rush, and misc — is layered on here, in one place.
//
// Discount model (the consistency contract):
//   • All discounts are ADDITIVE — a package's bundle discount and the
//     relationship discounts (vendor / family & friends / custom) sum into one
//     percentage per line. Nothing compounds.
//   • That percentage bites the LABOR portion of the line only (design +
//     production, carried through markup). Materials, admin overhead, project
//     services, and misc are never discounted — a discount only ever gives away
//     your own time, so it can't quietly eat real cost.
//
// No IO, no React — importable on the server and the client.

import type { DraftConfig, LineKind, QuoteLine } from "./quote-calc-drafts";
import {
  CatalogItem,
  ITEM_CATALOG,
  LineCost,
  PACKAGES,
  PkgKey,
  QuoteServices,
  QuoteState,
  calcItemCost,
  calcPackageCost,
  calcQuoteServices,
  clampPtg,
  getDiscountPtg,
  markupLabor,
  markupVariable,
} from "./quote-calc-logic";

// One component of a discount, itemized for display (the bundle discount, or one
// of the relationship discounts). `amount` is in dollars off this scope's labor.
export interface DiscountComponent {
  label: string;
  ptg: number;
  amount: number;
}

// One priced quote line — a bundle or a single item. `list` is the marked-up
// price; `laborList` is labor's share of it (the only part a discount touches);
// `net` is `list` minus the additive line discount.
export interface LineResult {
  id: string;
  kind: LineKind;
  pkg?: PkgKey;
  itemKey?: string;
  qty: number;
  digital: boolean;
  /** Plain display name: the package name, or the catalog item label. */
  label: string;
  cost: LineCost;
  admin: number;
  profit: number;
  list: number;
  /** Marked-up labor (design + production) — the discountable base for this line. */
  laborList: number;
  /** Bundle discount (packages only) — the package's own intrinsic discount. */
  bundleDiscountPtg: number;
  bundleDiscountAmount: number;
  /** Every discount on this line (bundle + relationship), itemized; nonzero only. */
  discountComponents: DiscountComponent[];
  /** Effective combined discount %, clamped to [0,100], applied to `laborList`. */
  discountPtg: number;
  discountAmount: number;
  net: number;
}

export interface MiscLine {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface QuoteBreakdown {
  lines: LineResult[];

  // Line-item rollups.
  itemsList: number; // Σ line.list (before any discount)
  itemsNet: number; // Σ line.net (after each line's additive discount)
  totalLaborList: number; // Σ line.laborList (the total discountable base)

  // Discounts (all additive, labor-only).
  discountTotal: number; // itemsList − itemsNet (= Σ line.discountAmount)
  bundleDiscountTotal: number; // Σ line.bundleDiscountAmount
  /** Relationship discounts (vendor / family / custom) aggregated across lines. */
  relationshipDiscountLines: DiscountComponent[];

  // Quote-level project services (computed once, never discounted).
  services: QuoteServices;
  anyPhysical: boolean;
  totalDesignLabor: number; // Σ across lines — drives the digital license

  // Surcharges + free-form items.
  rushAmount: number;
  miscLines: MiscLine[];
  miscTotal: number;

  // Totals.
  savings: number; // = discountTotal
  finalPrice: number;
  /** List-price subtotal (itemsList + servicesList + miscTotal); for the client projector. */
  subtotalList: number;
}

// Price one quote line: variable cost (bundle or item) → admin/profit markup →
// one additive, labor-only discount. The discount % is the package's bundle
// discount (0 for items) plus the three relationship discounts, summed and
// clamped, applied to the line's marked-up labor (never its materials).
function priceLine(
  line: QuoteLine,
  config: DraftConfig,
  assumptions: QuoteState,
  relationship: { label: string; ptg: number }[],
  catalog: CatalogItem[],
): LineResult {
  let cost: LineCost;
  let label: string;
  let bundleDiscountPtg = 0;

  if (line.kind === "package" && line.pkg && PACKAGES[line.pkg]) {
    cost = calcPackageCost(line.pkg, line.qty, config.mode, assumptions, config.fullColor, config.customPaper, catalog);
    label = PACKAGES[line.pkg].name;
    bundleDiscountPtg = clampPtg(getDiscountPtg(line.pkg, assumptions));
  } else {
    const itemKey = line.itemKey ?? "iInvite";
    cost = calcItemCost(
      itemKey,
      line.qty,
      line.digital ?? false,
      config.mode,
      assumptions,
      config.fullColor,
      config.customPaper,
      catalog,
    );
    label = catalog.find((i) => i.key === itemKey)?.label ?? itemKey;
  }

  const { admin, profit, list } = markupVariable(cost.totalVariable, assumptions);
  const laborList = markupLabor(cost.totalDesignLabor + cost.totalProductionLabor, assumptions);

  // Additive discount: bundle (this line's own) + the shared relationship %s.
  // Clamp the *sum* so the combined discount never exceeds the labor value; if
  // it would, scale each component down proportionally so they still itemize to
  // the (capped) total.
  const components = [{ label: "Bundle", ptg: bundleDiscountPtg }, ...relationship];
  const rawPtg = components.reduce((s, d) => s + d.ptg, 0);
  const discountPtg = clampPtg(rawPtg);
  const scale = rawPtg > 0 ? discountPtg / rawPtg : 0;
  const discountComponents: DiscountComponent[] = components
    .filter((d) => d.ptg > 0)
    .map((d) => ({ label: d.label, ptg: d.ptg, amount: laborList * (d.ptg / 100) * scale }));
  const discountAmount = laborList * (discountPtg / 100);
  const bundleDiscountAmount = discountComponents.find((d) => d.label === "Bundle")?.amount ?? 0;

  return {
    id: line.id,
    kind: line.kind,
    pkg: line.pkg,
    itemKey: line.itemKey,
    qty: line.qty,
    digital: cost.isDigital,
    label,
    cost,
    admin,
    profit,
    list,
    laborList,
    bundleDiscountPtg,
    bundleDiscountAmount,
    discountComponents,
    discountPtg,
    discountAmount,
    net: list - discountAmount,
  };
}

// Compute every figure the calculator, the print quote, and the public portal
// display, from a quote's config + the assumptions snapshot it was priced under.
// `catalog` supplies item labels/qty rules; defaults to the bundled catalog.
export function computeQuoteBreakdown(
  config: DraftConfig,
  assumptions: QuoteState,
  catalog: CatalogItem[] = ITEM_CATALOG,
): QuoteBreakdown {
  // The shared relationship discounts — same % on every line, biting labor only.
  const relationship: { label: string; ptg: number }[] = [
    { label: "Vendor incentive", ptg: config.vendorIncentive ? clampPtg(assumptions.vendorIncentivePtg) : 0 },
    { label: "Family & friends", ptg: clampPtg(config.familyFriendsPtg) },
    { label: "Custom discount", ptg: clampPtg(config.customDiscountPtg) },
  ].filter((d) => d.ptg > 0);

  const lines: LineResult[] = config.lines.map((line) =>
    priceLine(line, config, assumptions, relationship, catalog),
  );
  const sum = (sel: (l: LineResult) => number): number => lines.reduce((s, l) => s + sel(l), 0);

  const itemsList = sum((l) => l.list);
  const itemsNet = sum((l) => l.net);
  const totalLaborList = sum((l) => l.laborList);
  const discountTotal = itemsList - itemsNet;
  const bundleDiscountTotal = sum((l) => l.bundleDiscountAmount);
  const totalDesignLabor = sum((l) => l.cost.totalDesignLabor);
  const anyPhysical = lines.some((l) => !l.cost.isDigital);

  // Relationship discounts aggregated across lines (for the client-facing
  // quote-level rows; the bundle discount stays itemized per line).
  const relAgg = new Map<string, DiscountComponent>();
  for (const l of lines) {
    for (const d of l.discountComponents) {
      if (d.label === "Bundle") continue;
      const cur = relAgg.get(d.label) ?? { label: d.label, ptg: d.ptg, amount: 0 };
      cur.amount += d.amount;
      relAgg.set(d.label, cur);
    }
  }
  const relationshipDiscountLines = [...relAgg.values()];

  // Project services — once per quote, marked up like any other cost. Never
  // discounted: revisions, packaging, and the digital license are cost recovery.
  const services = calcQuoteServices(assumptions, {
    extraRevisions: Math.max(0, config.extraRevisions || 0),
    anyPhysical,
    digitalLicense: config.digitalLicense,
    totalDesignLabor,
  });

  // Rush is a surcharge on the discounted order value (excludes fixed-price misc).
  const orderSubtotal = itemsNet + services.servicesList;
  const rushAmount = config.rushFee ? orderSubtotal * (assumptions.rushFeePtg / 100) : 0;

  // Misc add-ons are entered at final selling price — no markup, no discount.
  const miscLines: MiscLine[] = (config.miscAddOns ?? [])
    .filter((m) => m.qty > 0 && m.unitPrice > 0 && (m.label ?? "").trim().length > 0)
    .map((m) => ({
      id: m.id,
      label: m.label.trim(),
      qty: m.qty,
      unitPrice: m.unitPrice,
      total: m.qty * m.unitPrice,
    }));
  const miscTotal = miscLines.reduce((s, m) => s + m.total, 0);

  const finalPrice = orderSubtotal + rushAmount + miscTotal;
  const savings = discountTotal;
  const subtotalList = itemsList + services.servicesList + miscTotal;

  return {
    lines,
    itemsList,
    itemsNet,
    totalLaborList,
    discountTotal,
    bundleDiscountTotal,
    relationshipDiscountLines,
    services,
    anyPhysical,
    totalDesignLabor,
    rushAmount,
    miscLines,
    miscTotal,
    savings,
    finalPrice,
    subtotalList,
  };
}
