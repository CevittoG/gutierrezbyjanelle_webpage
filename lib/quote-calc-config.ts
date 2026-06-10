// Runtime config layer for /quote-calc.
//
// Phase 1 of docs/quote-calc-roadmap.md: pull pricing data (global settings
// + per-item rates) out of the TS bundle and into two Google Sheet tabs:
//
//   Settings   — key/value pairs that overlay QuoteState scalars
//                (hourly, adminPtg, discountSweet, fullColorFactor, ...)
//   Items      — one row per catalog item with both the catalog metadata
//                (label, qty, fixed) and the per-item rate parameters
//                (designMin, prodMin, sheetCost, yield).
//
// The engine stays in TS. This module defines the wire shape, the merge
// strategy, and the validation that decides which Sheet values to trust.

import {
  CatalogItem,
  DEFAULTS,
  ITEM_CATALOG,
  QuoteState,
} from "./quote-calc-logic";

// --- Wire shapes ---

// A single Settings-tab row.
export interface RemoteSetting {
  key: string;
  value: number;
  /** 1-indexed sheet row, for diagnostics in the fallback banner. */
  sheetRow: number;
}

// A single Items-tab row.
export interface RemoteItem {
  key: string;
  label: string;
  designMin: number;
  prodMin: number;
  sheetCost: number;
  yield: number;
  /** Per-household qty multiplier (mirrors ITEM_CATALOG.qty). */
  qty: number;
  /** If set, overrides per-household qty with a flat count (mirrors .fixed). */
  fixed: number | null;
  sheetRow: number;
}

export interface RemoteConfig {
  settings: RemoteSetting[];
  items: RemoteItem[];
  warnings: ConfigWarning[];
}

export type ConfigWarningKind =
  | "fetch-failed"
  | "tab-missing"
  | "empty"
  | "invalid-row"
  | "unknown-key";

export interface ConfigWarning {
  kind: ConfigWarningKind;
  tab: "Settings" | "Items" | null;
  sheetRow: number | null;
  detail: string;
}

// --- Whitelist: only these QuoteState keys are accepted from the Settings tab.
// Anything else becomes an "unknown-key" warning and is ignored. This keeps
// the sheet from being able to mutate per-item rates indirectly through the
// settings tab (those belong in Items) and from injecting bogus fields.

const SETTINGS_WHITELIST = new Set<keyof QuoteState>([
  "hourly",
  "adminPtg",
  "targetProfitPtg",
  "errorMarginPtg",
  "packagingCost",
  "reuseFactor",
  "revisionMin",
  "discountIndividual",
  "discountDiy",
  "discountSweet",
  "discountSignature",
  "discountEventBasics",
  "discountEventFun",
  "discountEventWorks",
  "vendorIncentivePtg",
  "fullColorFactor",
  "customPaperFactor",
  "rushFeePtg",
  "digitalLicensePtg",
]);

export function isWhitelistedSetting(key: string): key is keyof QuoteState {
  return SETTINGS_WHITELIST.has(key as keyof QuoteState);
}

// --- Merge: produce the effective assumptions + catalog from remote config ---

export interface MergedConfig {
  assumptions: QuoteState;
  catalog: CatalogItem[];
  /** Warnings to surface in the banner. Empty when everything loaded cleanly. */
  warnings: ConfigWarning[];
  /** True when at least one Sheet tab was successfully read. */
  fromSheet: boolean;
}

export function mergeRemoteConfig(remote: RemoteConfig | null): MergedConfig {
  if (!remote) {
    return {
      assumptions: { ...DEFAULTS },
      catalog: [...ITEM_CATALOG],
      warnings: [],
      fromSheet: false,
    };
  }

  const warnings: ConfigWarning[] = [...remote.warnings];
  const next: QuoteState = { ...DEFAULTS };

  // Settings overlay scalar QuoteState fields.
  for (const s of remote.settings) {
    if (!isWhitelistedSetting(s.key)) {
      warnings.push({
        kind: "unknown-key",
        tab: "Settings",
        sheetRow: s.sheetRow,
        detail: `Unknown setting "${s.key}" — ignored. Check the spelling against the keys documented in the calculator.`,
      });
      continue;
    }
    (next as unknown as Record<string, number>)[s.key] = s.value;
  }

  // Items overlay both the catalog AND the per-item rate fields in QuoteState.
  // Items not in the Sheet fall back to the bundled defaults.
  const itemsByKey = new Map(remote.items.map((it) => [it.key, it]));
  const catalog: CatalogItem[] = ITEM_CATALOG.map((defItem) => {
    const r = itemsByKey.get(defItem.key);
    if (!r) return { ...defItem };
    return {
      key: defItem.key,
      label: r.label || defItem.label,
      qty: r.qty,
      ...(r.fixed != null ? { fixed: r.fixed } : {}),
      notes: defItem.notes,
    };
  });

  // Warn for Sheet items that don't match any known catalog key — typo guard.
  for (const r of remote.items) {
    if (!ITEM_CATALOG.some((d) => d.key === r.key)) {
      warnings.push({
        kind: "unknown-key",
        tab: "Items",
        sheetRow: r.sheetRow,
        detail: `Unknown item key "${r.key}" — ignored. Valid keys are: ${ITEM_CATALOG.map((d) => d.key).join(", ")}.`,
      });
      continue;
    }
    (next as unknown as Record<string, number>)[`${r.key}_dt`] = r.designMin;
    (next as unknown as Record<string, number>)[`${r.key}_pt`] = r.prodMin;
    (next as unknown as Record<string, number>)[`${r.key}_sc`] = r.sheetCost;
    (next as unknown as Record<string, number>)[`${r.key}_y`] = r.yield;
  }

  return {
    assumptions: next,
    catalog,
    warnings,
    fromSheet: remote.settings.length > 0 || remote.items.length > 0,
  };
}
