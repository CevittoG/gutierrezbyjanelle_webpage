// Quote data model v5 (docs/quote-builder-redesign.md §8.1). Pure types.
//
// A saved quote is a document, not a formula: every line stores its resolved
// name and prices, so totals are a pure function of this config alone
// (lib/quote-engine.ts), whatever the price book says today.

export type LineKindV5 = "product" | "custom";

/** A resolved copy of an Options row, frozen on the line. */
export interface LineOption {
  id: string;
  name: string;
  kind: "per-piece" | "percent" | "flat";
  amount: number;
  /** Health only: extra cost per piece. Never shown to the client. */
  estCost?: number;
}

export interface QtyLink {
  basis: "household" | "guest";
  per: number;
}

export interface QuoteLineV5 {
  id: string;
  kind: LineKindV5;
  /** Price-book reference (refresh + health defaults); absent on custom and converted lines. */
  productId?: string;
  /** Package group membership. */
  groupId?: string;
  /** Resolved, editable, client-facing. */
  name: string;
  /** Optional client-facing sub-line ("5×7 · textured"). */
  detail?: string;
  /** Optional bullet list (converted legacy packages, custom bundles). */
  includes?: string[];
  qty: number;
  /** null ⇒ manual qty (typed). */
  qtyLink?: QtyLink | null;
  /** Resolved; editable. */
  unitPrice: number;
  /** Price-book price when added (drives the "custom price" badge). Admin only. */
  listUnitPrice?: number;
  /** Price-book design fee when added (drives the refresh diff). Admin only. */
  listDesignFee?: number;
  /** Resolved; editable. Charged once per physical line. */
  designFee: number;
  reuseDesign?: boolean;
  digital: boolean;
  options: LineOption[];
  /** Resolved estimate snapshot for the health check. Admin only. */
  est?: { unitCost: number; minutes: number; designHours: number };
  /**
   * Fixed-$ lines written by the legacy conversion (the old once-per-quote
   * services and the rush surcharge). Kept out of the quote's display name.
   */
  system?: "services" | "rush";
}

export interface QuoteGroup {
  id: string;
  packageId?: string;
  name: string;
  /** A true % of the group's subtotal. */
  bundlePct: number;
}

export type DiscountReason = "vendor" | "family" | "promo" | "custom";

export interface QuoteDiscount {
  reason: DiscountReason;
  kind: "percent" | "amount";
  value: number;
  /** Client-facing override ("Spring promo"). */
  label?: string;
}

export interface QuoteServices {
  rush: boolean;
  rushPct: number;
  extraRevisions: number;
  revisionRoundPrice: number;
  license: boolean;
  licenseFee: number;
  packagingFee: number;
}

export interface HealthSnapshot {
  revisionHours: number;
  feesPct: number;
  hourlyTarget: number;
  hourlyFloor: number;
}

/** The pre-v5 quote, kept verbatim for audit after conversion. Admin only. */
export interface LegacyRecord {
  config: unknown;
  assumptionsSnapshot: unknown;
  pricingVersion: number;
  /** The old engine's total at conversion time (unrounded). */
  finalPrice: number;
  convertedAt: string;
}

export interface DraftConfigV5 {
  schema: 5;
  households: number;
  guests: number;
  groups: QuoteGroup[];
  lines: QuoteLineV5[];
  services: QuoteServices;
  /** % of the design fee charged on a line marked "Reuse design" (policy snapshot). */
  reuseDesignPct: number;
  discount: QuoteDiscount | null;
  adjustment: { amount: number; label: string } | null;
  /** Pass-through shipping. null ⇒ "added later". Never discounted or rushed. */
  shipping: number | null;
  /** Expected deposit (display only, never in the math). */
  deposit: number;
  /** ISO: when prices were last pulled from the price book. */
  pricedAt: string;
  health?: HealthSnapshot;
  /**
   * Present on quotes converted from the old calculator. Such quotes keep the
   * old engine's unrounded arithmetic and whole-dollar display, so the total a
   * client already saw never moves (see §15 of the redesign doc).
   */
  legacy?: LegacyRecord;
}
