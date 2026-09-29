// FROZEN (docs/quote-builder-redesign.md §8.5): the pre-v5 quote engine,
// moved here unchanged so legacy quotes keep converting to the exact totals
// their clients saw. Do not edit the money math in this file.

import { PACKAGES, PkgKey, PricingMode } from "./logic";

export interface MiscAddOn {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  /**
   * Digital (nothing to ship) vs physical. A physical add-on pulls the quote
   * into packaging + the shipping reminder + the physical stage wording. Never
   * changes the add-on's own price. Backfilled on load for older quotes.
   */
  digital?: boolean;
}

export type LineKind = "package" | "item";

// One line on a quote. A quote holds an array of these so a client can buy
// several things at once. A line is either a predefined bundle (`kind:
// "package"`, keyed by `pkg`) or a single catalog piece (`kind: "item"`, keyed
// by `itemKey`). This unified model replaces the old `packages` + `addOns` +
// `individual` pseudo-package split — one catalog item now prices identically
// however it is added.
export interface QuoteLine {
  id: string;
  kind: LineKind;
  /** Bundle key when `kind === "package"` (sweet, signature, diy, event-*). */
  pkg?: PkgKey;
  /** Catalog item key when `kind === "item"` (iInvite, iGames, …). */
  itemKey?: string;
  /**
   * Package lines: household/guest count (drives the catalog qty rules).
   * Item lines: the raw piece count.
   */
  qty: number;
  /** Digital (design-only) vs physical (printed + shipped). Applies to both kinds. */
  digital?: boolean;
}

export interface DraftConfig {
  lines: QuoteLine[];
  mode: PricingMode;
  miscAddOns: MiscAddOn[];

  // Project services (quote-level — computed once, never per line).
  rushFee: boolean;
  extraRevisions: number;
  digitalLicense: boolean;

  // Quote-wide discounts (grouped — applied in one stage, stacked additively).
  vendorIncentive: boolean;
  /** Optional extra discount (0–100), e.g. bulk pricing. Was `packageDiscountPtg`. */
  customDiscountPtg: number;
  /** Optional extra discount (0–100) for friends & family. */
  familyFriendsPtg: number;

  // Material toggles (quote-wide).
  fullColor: boolean;
  customPaper: boolean;

  /**
   * Which pricing rules this quote was built under, so a rule change never
   * silently re-prices a quote that was already saved/sent.
   *   1 — rush excludes custom add-ons; an add-on needs a name to count.
   *   2 — rush includes custom add-ons; an unnamed add-on counts as "Custom item".
   * Missing ⇒ 1 (quotes saved before the field existed).
   */
  pricingVersion?: number;
}

export const CURRENT_PRICING_VERSION = 2;

export const DEFAULT_CONFIG: DraftConfig = {
  lines: [],
  mode: "fresh",
  miscAddOns: [],
  rushFee: false,
  extraRevisions: 0,
  digitalLicense: false,
  vendorIncentive: false,
  customDiscountPtg: 0,
  familyFriendsPtg: 0,
  fullColor: false,
  customPaper: false,
  pricingVersion: CURRENT_PRICING_VERSION,
};

// A line is digital (design-only, nothing shipped) when it's a digital item or a
// digital package. Shared by the physical/digital project-type rule.
export function isLineDigital(line: QuoteLine): boolean {
  if (line.kind === "item") return line.digital ?? false;
  return line.pkg && PACKAGES[line.pkg] ? PACKAGES[line.pkg].isDigital : false;
}
