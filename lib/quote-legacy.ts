// Legacy conversion: v1–v4 quote → v5 (docs/quote-builder-redesign.md §8.5).
//
// The old engine lives frozen in lib/legacy/. A converted quote replays it
// once, then stores each priced piece as a fixed-$ line, so its total is a
// pure function of the v5 config and equals what clients already saw. The
// converted config keeps `legacy`, which tells the engine to skip cent
// rounding (the old engine never rounded) and the surfaces to keep the
// whole-dollar display.

import { ITEM_CATALOG, PACKAGES, type CatalogItem, type QuoteState } from "./legacy/logic";
import { computeQuoteBreakdown, type LineResult } from "./legacy/totals";
import { migrateConfig, withSnapshotDefaults } from "./legacy/migrate";
import { isLineDigital, type DraftConfig } from "./legacy/types";
import type { DraftConfigV5, QuoteLineV5 } from "./quote-types";

export { migrateConfig as migrateLegacyConfig, withSnapshotDefaults } from "./legacy/migrate";

export interface LegacyDraftLike {
  id?: string;
  config: unknown;
  assumptionsSnapshot?: Partial<QuoteState> | null;
  updatedAt?: string;
}

function isDigitalLegacy(config: DraftConfig, breakdown: ReturnType<typeof computeQuoteBreakdown>): boolean {
  const flags = [...config.lines.map(isLineDigital), ...breakdown.miscLines.map((m) => m.digital)];
  return flags.length > 0 && flags.every(Boolean);
}

// The pieces a bundle line priced, as the client portal listed them.
function includedPieces(line: LineResult, catalog: CatalogItem[]): string[] {
  const def = line.pkg ? PACKAGES[line.pkg] : undefined;
  if (!def) return [];
  return def.items.map((it) => {
    const key = typeof it === "string" ? it : it.key;
    const cat = catalog.find((c) => c.key === key);
    const label = (typeof it !== "string" && it.displayLabel) || cat?.label || key;
    const count =
      cat?.fixed !== undefined ? `${cat.fixed} pcs` : def.isDigital ? "design" : `${(cat?.qty ?? 0) * line.qty} pcs`;
    return `${label} · ${count}`;
  });
}

function servicesDetail(s: ReturnType<typeof computeQuoteBreakdown>["services"]): string {
  const parts: string[] = [];
  if (s.revisionCost > 0) parts.push("revisions");
  if (s.licenseVar > 0) parts.push("file license");
  if (s.packaging > 0) parts.push("packaging");
  return parts.join(" + ");
}

export interface ConversionResult {
  config: DraftConfigV5;
  /** The old engine's total, unrounded: what every surface showed before. */
  legacyTotal: number;
}

/**
 * Convert a pre-v5 quote. `catalog` must be the catalog its client link used
 * (the live Items tab on the server; the bundled catalog as a fallback).
 */
export function convertLegacyDraft(
  draft: LegacyDraftLike,
  catalog: CatalogItem[] = ITEM_CATALOG,
  now: string = new Date().toISOString(),
): ConversionResult {
  const legacyConfig = migrateConfig((draft.config ?? {}) as Parameters<typeof migrateConfig>[0]);
  const snapshot = withSnapshotDefaults(draft.assumptionsSnapshot ?? {});
  const b = computeQuoteBreakdown(legacyConfig, snapshot, catalog);
  const digitalQuote = isDigitalLegacy(legacyConfig, b);
  const idBase = draft.id ? `${draft.id}:` : "";

  const lines: QuoteLineV5[] = [];
  b.lines.forEach((l, i) => {
    const isPkg = l.kind === "package";
    lines.push({
      id: `${idBase}legacy-${l.id || i}`,
      kind: "product",
      name: l.label,
      detail: isPkg ? `${l.qty} household${l.qty === 1 ? "" : "s"}` : l.digital ? "design" : `${l.qty} pcs`,
      ...(isPkg ? { includes: includedPieces(l, catalog) } : {}),
      qty: 1,
      qtyLink: null,
      unitPrice: l.list,
      designFee: 0,
      digital: l.digital,
      options: [],
    });
  });

  if (b.services.servicesList > 0) {
    const detail = servicesDetail(b.services);
    lines.push({
      id: `${idBase}legacy-services`,
      kind: "custom",
      system: "services",
      name: "Project services",
      ...(detail ? { detail } : {}),
      qty: 1,
      qtyLink: null,
      unitPrice: b.services.servicesList,
      designFee: 0,
      digital: digitalQuote,
      options: [],
    });
  }

  for (const m of b.miscLines) {
    lines.push({
      id: `${idBase}legacy-misc-${m.id}`,
      kind: "custom",
      name: m.label,
      qty: m.qty,
      qtyLink: null,
      unitPrice: m.unitPrice,
      designFee: 0,
      digital: m.digital,
      options: [],
    });
  }

  // A fixed $ line, so the v1/v2 rush-base difference can't leak.
  if (b.rushAmount > 0) {
    lines.push({
      id: `${idBase}legacy-rush`,
      kind: "custom",
      system: "rush",
      name: "Rush production",
      qty: 1,
      qtyLink: null,
      unitPrice: b.rushAmount,
      designFee: 0,
      digital: digitalQuote,
      options: [],
    });
  }

  const firstPkg = legacyConfig.lines.find((l) => l.kind === "package");
  const households = firstPkg ? firstPkg.qty : 0;

  const config: DraftConfigV5 = {
    schema: 5,
    households,
    guests: households * 2,
    groups: [],
    lines,
    services: {
      rush: false,
      rushPct: snapshot.rushFeePtg,
      extraRevisions: 0,
      revisionRoundPrice: 0,
      license: false,
      licenseFee: 0,
      packagingFee: 0,
    },
    reuseDesignPct: Math.round(snapshot.reuseFactor * 100),
    discount:
      b.discountTotal > 0 ? { reason: "custom", kind: "amount", value: b.discountTotal, label: "Savings" } : null,
    adjustment: null,
    shipping: null,
    deposit: snapshot.depositAmount || 0,
    pricedAt: draft.updatedAt || now,
    legacy: {
      config: draft.config,
      assumptionsSnapshot: draft.assumptionsSnapshot ?? null,
      pricingVersion: legacyConfig.pricingVersion ?? 1,
      finalPrice: b.finalPrice,
      convertedAt: now,
    },
  };
  return { config, legacyTotal: b.finalPrice };
}
