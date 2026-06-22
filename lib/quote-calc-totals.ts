// Pure quote-total computation, shared by the calculator, the print view, and
// the public client portal so every surface renders the *same* numbers from the
// *same* engine path.
//
// This is the single source of truth for the quote money math. The engine
// (quote-calc-logic) only computes per-line *variable cost*; everything else —
// markup, the per-package bundle discount, the once-per-quote project services
// (revisions, packaging, digital license), the grouped quote-wide discount,
// rush, and misc — is layered on here, in one place, in one order.
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
  markupVariable,
} from "./quote-calc-logic";

// One priced quote line — a bundle or a single item. `list` is the marked-up
// price; `net` is after the per-package bundle discount (0 for item lines).
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
  bundleDiscountPtg: number;
  bundleDiscountAmount: number;
  net: number;
}

export interface MiscLine {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
}

// One component of the grouped quote-wide discount, itemized for the breakdown
// display. Amounts are each component's share of `preDiscount`.
export interface QuoteDiscountLine {
  label: string;
  ptg: number;
  amount: number;
}

export interface QuoteBreakdown {
  lines: LineResult[];

  // Line-item rollups.
  itemsList: number; // Σ line.list (before any discount)
  itemsNet: number; // Σ line.net (after per-package bundle discounts)
  bundleDiscountTotal: number; // itemsList − itemsNet

  // Quote-level project services (computed once).
  services: QuoteServices;
  anyPhysical: boolean;
  totalDesignLabor: number; // Σ across lines — drives the digital license

  // Grouped quote-wide discount stage.
  preDiscount: number; // itemsNet + services.servicesList
  quoteDiscountPtg: number;
  quoteDiscountAmount: number;
  quoteDiscountLines: QuoteDiscountLine[]; // itemized components (vendor / family / custom)
  discountedSubtotal: number; // preDiscount − quoteDiscountAmount

  // Surcharges + free-form items.
  rushAmount: number;
  miscLines: MiscLine[];
  miscTotal: number;

  // Totals.
  savings: number; // bundleDiscountTotal + quoteDiscountAmount
  finalPrice: number;
  /** List-price subtotal (itemsList + servicesList + miscTotal); for the client projector. */
  subtotalList: number;
}

// Price one quote line: variable cost (bundle or item) → admin/profit markup →
// the per-package bundle discount. Item lines carry no bundle discount.
function priceLine(
  line: QuoteLine,
  config: DraftConfig,
  assumptions: QuoteState,
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
  const bundleDiscountAmount = list * (bundleDiscountPtg / 100);

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
    bundleDiscountPtg,
    bundleDiscountAmount,
    net: list - bundleDiscountAmount,
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
  const lines: LineResult[] = config.lines.map((line) => priceLine(line, config, assumptions, catalog));
  const sum = (sel: (l: LineResult) => number): number => lines.reduce((s, l) => s + sel(l), 0);

  const itemsList = sum((l) => l.list);
  const itemsNet = sum((l) => l.net);
  const bundleDiscountTotal = itemsList - itemsNet;
  const totalDesignLabor = sum((l) => l.cost.totalDesignLabor);
  const anyPhysical = lines.some((l) => !l.cost.isDigital);

  // Project services — once per quote, marked up like any other cost.
  const services = calcQuoteServices(assumptions, {
    extraRevisions: Math.max(0, config.extraRevisions || 0),
    anyPhysical,
    digitalLicense: config.digitalLicense,
    totalDesignLabor,
  });

  // Grouped quote-wide discount: vendor incentive + family & friends + custom,
  // stacked additively, applied once to the marked-up subtotal (items + services).
  const preDiscount = itemsNet + services.servicesList;
  const vendorPtg = config.vendorIncentive ? clampPtg(assumptions.vendorIncentivePtg) : 0;
  const familyFriendsPtg = clampPtg(config.familyFriendsPtg);
  const customPtg = clampPtg(config.customDiscountPtg);
  const quoteDiscountLines: QuoteDiscountLine[] = [
    { label: "Vendor incentive", ptg: vendorPtg },
    { label: "Family & friends", ptg: familyFriendsPtg },
    { label: "Custom discount", ptg: customPtg },
  ]
    .filter((d) => d.ptg > 0)
    .map((d) => ({ ...d, amount: preDiscount * (d.ptg / 100) }));
  const quoteDiscountPtg = clampPtg(vendorPtg + familyFriendsPtg + customPtg);
  const quoteDiscountAmount = preDiscount * (quoteDiscountPtg / 100);
  const discountedSubtotal = preDiscount - quoteDiscountAmount;

  // Rush is a surcharge on the discounted order value (excludes fixed-price misc).
  const rushAmount = config.rushFee ? discountedSubtotal * (assumptions.rushFeePtg / 100) : 0;

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

  const finalPrice = discountedSubtotal + rushAmount + miscTotal;
  const savings = bundleDiscountTotal + quoteDiscountAmount;
  const subtotalList = itemsList + services.servicesList + miscTotal;

  return {
    lines,
    itemsList,
    itemsNet,
    bundleDiscountTotal,
    services,
    anyPhysical,
    totalDesignLabor,
    preDiscount,
    quoteDiscountPtg,
    quoteDiscountAmount,
    quoteDiscountLines,
    discountedSubtotal,
    rushAmount,
    miscLines,
    miscTotal,
    savings,
    finalPrice,
    subtotalList,
  };
}
