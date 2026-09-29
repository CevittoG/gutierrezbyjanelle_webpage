// FROZEN (docs/quote-builder-redesign.md §8.5): the pre-v5 quote engine,
// moved here unchanged so legacy quotes keep converting to the exact totals
// their clients saw. Do not edit the money math in this file.

import { DEFAULTS, PACKAGES, PkgKey, QuoteState, getItemQty } from "./logic";
import { DEFAULT_CONFIG, DraftConfig, MiscAddOn, QuoteLine, isLineDigital } from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Rewrite the legacy `iDrinkTop` add-on key as `iWedgeTop`. Idempotent.
function migrateAddOns(addOns: Record<string, number> | undefined): Record<string, number> {
  const next: Record<string, number> = { ...(addOns ?? {}) };
  if ("iDrinkTop" in next) {
    const qty = next.iDrinkTop;
    delete next.iDrinkTop;
    if (qty > 0) next.iWedgeTop = (next.iWedgeTop ?? 0) + qty;
  }
  return next;
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function validPkg(pkg: unknown): PkgKey {
  return typeof pkg === "string" && pkg in PACKAGES ? (pkg as PkgKey) : "sweet";
}

// One line as it may appear on disk: either a current v4 `QuoteLine` (has
// `kind`) or a legacy package object (`pkg`/`qty`/`individual*`, where
// `pkg === "individual"` meant a single à-la-carte piece).
type LegacyLine = {
  id?: string;
  kind?: string;
  pkg?: string;
  qty?: number;
  itemKey?: string;
  individualItem?: string;
  individualDigital?: boolean;
  digital?: boolean;
};

// Project any on-disk line shape to a clean v4 QuoteLine. Legacy `individual`
// packages collapse to item lines, preserving their piece count via getItemQty
// so the migrated quote re-prices to the same per-item quantities.
function lineFromLegacy(p: LegacyLine): QuoteLine {
  const id = typeof p.id === "string" && p.id ? p.id : newId();
  if (p.kind === "item") {
    return { id, kind: "item", itemKey: p.itemKey ?? "iInvite", qty: numOr(p.qty, 1), digital: p.digital ?? false };
  }
  if (p.kind === "package") {
    return { id, kind: "package", pkg: validPkg(p.pkg), qty: numOr(p.qty, 75), digital: p.digital ?? false };
  }
  // Legacy package shape.
  if (p.pkg === "individual") {
    const itemKey = p.individualItem ?? "iInvite";
    return {
      id,
      kind: "item",
      itemKey,
      qty: getItemQty(itemKey, numOr(p.qty, 75)),
      digital: p.individualDigital ?? false,
    };
  }
  return { id, kind: "package", pkg: validPkg(p.pkg), qty: numOr(p.qty, 75), digital: false };
}

// A config as it may appear on disk / on the wire: a current v4 shape (with
// `lines`), a v3 shape (`packages` + `addOns`), or a legacy v1/v2 shape (single
// `pkg`/`qty`/`individual*`).
type LegacyConfig = Partial<DraftConfig> & {
  pkg?: string;
  qty?: number;
  individualItem?: string;
  individualDigital?: boolean;
  packages?: LegacyLine[];
  lines?: LegacyLine[];
  addOns?: Record<string, number>;
  packageDiscountPtg?: number;
};

export function migrateConfig(c: LegacyConfig): DraftConfig {
  const {
    pkg: legacyPkg,
    qty: legacyQty,
    individualItem: legacyItem,
    individualDigital: legacyDigital,
    packages: rawPackages,
    lines: rawLines,
    addOns: rawAddOns,
    packageDiscountPtg: legacyCustomDiscount,
    customDiscountPtg,
    ...rest
  } = c;

  let lines: QuoteLine[];
  if (Array.isArray(rawLines)) {
    // v4 shape: trust it as saved — an empty list is a real zero-line quote
    // (e.g. custom add-ons only), never a cue to inject a default package.
    lines = rawLines.map(lineFromLegacy);
  } else {
    if (Array.isArray(rawPackages) && rawPackages.length > 0) {
      lines = rawPackages.map(lineFromLegacy);
    } else if (legacyPkg) {
      lines = [
        lineFromLegacy({
          pkg: legacyPkg,
          qty: legacyQty,
          individualItem: legacyItem,
          individualDigital: legacyDigital,
        }),
      ];
    } else {
      lines = [];
    }

    // Fold legacy à-la-carte add-ons into item lines (raw piece counts).
    for (const [key, qty] of Object.entries(migrateAddOns(rawAddOns))) {
      if (qty > 0) lines.push({ id: newId(), kind: "item", itemKey: key, qty, digital: false });
    }

    // Pre-v4 quotes always carried a package; keep their old Sweet Suite
    // fallback so an odd legacy shape still re-prices the way it did.
    if (lines.length === 0) lines = [{ id: newId(), kind: "package", pkg: "sweet", qty: 75, digital: false }];
  }

  // Backfill the add-on digital flag without moving any existing total: an
  // add-on only "adds" physicality when the quote already has a physical line.
  const hasPhysicalLine = lines.some((l) => !isLineDigital(l));
  const miscAddOns: MiscAddOn[] = (Array.isArray(rest.miscAddOns) ? rest.miscAddOns : []).map((m) => ({
    ...m,
    digital: typeof m.digital === "boolean" ? m.digital : !hasPhysicalLine,
  }));

  return {
    ...DEFAULT_CONFIG,
    ...rest,
    lines,
    miscAddOns,
    customDiscountPtg: numOr(customDiscountPtg, numOr(legacyCustomDiscount, 0)),
    pricingVersion: numOr(rest.pricingVersion, 1),
  };
}

// Sanity helper for QuoteState completeness when loading a snapshot.
export function withSnapshotDefaults(snapshot: Partial<QuoteState>): QuoteState {
  return { ...DEFAULTS, ...snapshot };
}

