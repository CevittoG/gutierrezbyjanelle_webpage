// Quote health (docs/quote-builder-redesign.md §7.1). Pure, admin only.
//
// "This quote pays you ≈ $X/hr": the guardrail that replaced the cost-plus
// markup. It never touches the total and never reaches the client portal or
// the print view.

import type { QuoteTotals } from "./quote-engine";
import type { DraftConfigV5, HealthSnapshot } from "./quote-types";

export type HealthStatus = "on-target" | "below-target" | "under-floor" | "unknown";

export interface QuoteHealth {
  status: HealthStatus;
  perHour: number | null;
  hourlyTarget: number;
  hourlyFloor: number;
  designHours: number;
  productionHours: number;
  revisionHours: number;
  estHours: number;
  estMaterials: number;
  fees: number;
  feesPct: number;
  /** total − shipping − packaging: the pass-throughs are not earnings. */
  netRevenue: number;
  earned: number;
  /** (materials + fees) ÷ total, 0–1. */
  outOfPocketPct: number;
  /** Share of line revenue whose lines carry estimates, 0–1. */
  coverage: number;
  lowCoverage: boolean;
}

export const HEALTH_GLYPH: Record<HealthStatus, string> = {
  "on-target": "✦",
  "below-target": "~",
  "under-floor": "!",
  unknown: "·",
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  "on-target": "On target",
  "below-target": "Below target",
  "under-floor": "Under your floor",
  unknown: "No estimate yet",
};

export function computeHealth(
  config: DraftConfigV5,
  totals: QuoteTotals,
  fallback: HealthSnapshot,
): QuoteHealth {
  const h = config.health ?? fallback;
  const reuse = Math.min(100, Math.max(0, config.reuseDesignPct)) / 100;
  const lineTotalById = new Map(totals.lines.map((l) => [l.id, l.total]));

  let designHours = 0;
  let productionHours = 0;
  let estMaterials = 0;
  let covered = 0;
  let lineRevenue = 0;
  for (const l of config.lines) {
    const revenue = lineTotalById.get(l.id) ?? 0;
    lineRevenue += revenue;
    if (!l.est) continue;
    covered += revenue;
    designHours += l.est.designHours * (l.reuseDesign ? reuse : 1);
    if (!l.digital) {
      productionHours += (l.qty * l.est.minutes) / 60;
      const optCost = l.options.filter((o) => o.kind === "per-piece").reduce((s, o) => s + (o.estCost ?? 0), 0);
      estMaterials += l.qty * (l.est.unitCost + optCost);
    }
  }
  const revisionHours = Math.max(0, config.services.extraRevisions) * h.revisionHours;
  const estHours = designHours + productionHours + revisionHours;

  const total = totals.total;
  const netRevenue = total - (totals.shipping ?? 0) - totals.services.packaging;
  const fees = (total * h.feesPct) / 100;
  const earned = netRevenue - estMaterials - fees;
  const perHour = estHours > 0 ? earned / estHours : null;
  const coverage = lineRevenue > 0 ? covered / lineRevenue : config.lines.length === 0 ? 1 : 0;

  let status: HealthStatus = "unknown";
  if (perHour !== null) {
    status = perHour >= h.hourlyTarget ? "on-target" : perHour >= h.hourlyFloor ? "below-target" : "under-floor";
  }

  return {
    status,
    perHour,
    hourlyTarget: h.hourlyTarget,
    hourlyFloor: h.hourlyFloor,
    designHours,
    productionHours,
    revisionHours,
    estHours,
    estMaterials,
    fees,
    feesPct: h.feesPct,
    netRevenue,
    earned,
    outOfPocketPct: total > 0 ? (estMaterials + fees) / total : 0,
    coverage,
    lowCoverage: coverage < 0.8,
  };
}
