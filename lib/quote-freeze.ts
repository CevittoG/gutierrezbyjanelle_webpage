// The one-time freeze (docs/quote-builder-redesign.md §8.5): every non-v5
// `_data` payload is converted with the live catalog and rewritten as v5 JSON,
// keeping its updatedAt. Pure planning here; lib/quote-calc-sheets.ts writes.
// Idempotent: a second run finds only v5 payloads and skips them all.

import type { CatalogItem } from "./legacy/logic";
import { normalizeIncomingDraft, type Draft } from "./quote-calc-drafts";
import { computeTotals } from "./quote-engine";
import { convertLegacyDraft } from "./quote-legacy";

export interface FreezeInputRow {
  /** 1-indexed `_data` row. */
  rowNumber: number;
  id: string;
  payload: string;
}

export interface FreezeReport {
  converted: number;
  skipped: number;
  parityFailures: { id: string; legacyTotal: number; total: number }[];
  unreadable: string[];
  /** Quotes whose dashboard figure (the old cachedTotal) differed from the client link. */
  dashboardCorrections: { id: string; cachedTotal: number; total: number }[];
}

export interface FreezePlan {
  updates: { rowNumber: number; draft: Draft }[];
  report: FreezeReport;
}

export function planFreeze(rows: FreezeInputRow[], catalog: CatalogItem[], now: string): FreezePlan {
  const report: FreezeReport = { converted: 0, skipped: 0, parityFailures: [], unreadable: [], dashboardCorrections: [] };
  const updates: FreezePlan["updates"] = [];
  for (const row of rows) {
    let raw: unknown;
    try {
      raw = JSON.parse(row.payload);
    } catch {
      report.unreadable.push(row.id);
      continue;
    }
    if (raw && typeof raw === "object" && (raw as { schemaVersion?: unknown }).schemaVersion === 5) {
      report.skipped++;
      continue;
    }
    const legacy = normalizeIncomingDraft(raw);
    if (!legacy) {
      report.unreadable.push(row.id);
      continue;
    }
    const { config, legacyTotal } = convertLegacyDraft(
      { id: legacy.id, config: legacy.config, assumptionsSnapshot: legacy.assumptionsSnapshot, updatedAt: legacy.updatedAt },
      catalog,
      now,
    );
    const total = computeTotals(config).total;
    if (!(Math.abs(total - legacyTotal) < 0.005)) {
      report.parityFailures.push({ id: legacy.id, legacyTotal, total });
      continue;
    }
    if (Math.round(legacy.cachedTotal) !== Math.round(total)) {
      report.dashboardCorrections.push({ id: legacy.id, cachedTotal: legacy.cachedTotal, total });
    }
    updates.push({
      rowNumber: row.rowNumber,
      draft: {
        id: legacy.id,
        name: legacy.name,
        createdAt: legacy.createdAt,
        updatedAt: legacy.updatedAt,
        client: legacy.client,
        config,
        cachedTotal: total,
        schemaVersion: 5,
      },
    });
    report.converted++;
  }
  return { updates, report };
}
