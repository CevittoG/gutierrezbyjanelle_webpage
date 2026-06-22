import {
  DEFAULTS,
  PACKAGES,
  PkgKey,
  PricingMode,
  QuoteState,
  getItemQty,
} from "./quote-calc-logic";

export interface DraftClientInfo {
  name: string;
  eventDate: string;
  eventType: string;
  /** Private working notes — never shown to the client. */
  notes: string;
  /** Client-facing message shown on the public /q/[token] quote page. */
  clientNotes: string;
}

export const EMPTY_CLIENT_INFO: DraftClientInfo = {
  name: "",
  eventDate: "",
  eventType: "Wedding",
  notes: "",
  clientNotes: "",
};

export const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Baby Shower",
  "Quinceañera",
  "Corporate",
  "Other",
] as const;

export interface MiscAddOn {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
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
}

export const DEFAULT_CONFIG: DraftConfig = {
  lines: [{ id: "default", kind: "package", pkg: "sweet", qty: 75, digital: false }],
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
};

export const CURRENT_SCHEMA_VERSION = 4 as const;

export interface Draft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  client: DraftClientInfo;
  config: DraftConfig;
  assumptionsSnapshot: QuoteState;
  cachedTotal: number;
  schemaVersion: 1 | 2 | 3 | 4;
}

// --- Sync status (for UI badge) ---

export type SyncStatus =
  | { kind: "idle" }
  | { kind: "syncing" }
  | { kind: "synced"; at: string }
  | { kind: "offline"; reason: "network" | "unconfigured" | "server" };

const DRAFTS_KEY = "quote-calc-drafts";
const LAST_KEY = "quote-calc-last";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function newId(): string {
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

function migrateConfig(c: LegacyConfig): DraftConfig {
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
  if (Array.isArray(rawLines) && rawLines.length > 0) {
    lines = rawLines.map(lineFromLegacy);
  } else if (Array.isArray(rawPackages) && rawPackages.length > 0) {
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

  if (lines.length === 0) lines = DEFAULT_CONFIG.lines.map((l) => ({ ...l, id: newId() }));

  return {
    ...DEFAULT_CONFIG,
    ...rest,
    lines,
    miscAddOns: Array.isArray(rest.miscAddOns) ? rest.miscAddOns : [],
    customDiscountPtg: numOr(customDiscountPtg, numOr(legacyCustomDiscount, 0)),
  };
}

export function migrateDraft(d: Draft): Draft {
  return {
    ...d,
    client: { ...EMPTY_CLIENT_INFO, ...d.client },
    config: migrateConfig(d.config),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export function loadDrafts(): Draft[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d): d is Draft => {
        return (
          d &&
          typeof d === "object" &&
          (d.schemaVersion === 1 ||
            d.schemaVersion === 2 ||
            d.schemaVersion === 3 ||
            d.schemaVersion === 4) &&
          typeof d.id === "string"
        );
      })
      .map(migrateDraft);
  } catch (err) {
    console.warn("Failed to load drafts; resetting.", err);
    return [];
  }
}

export function saveDrafts(drafts: Draft[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function createDraft(
  name: string,
  client: DraftClientInfo,
  config: DraftConfig,
  assumptions: QuoteState,
  cachedTotal: number,
): Draft {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: name.trim() || "Untitled quote",
    createdAt: now,
    updatedAt: now,
    client,
    config,
    assumptionsSnapshot: { ...assumptions },
    cachedTotal,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export function upsertDraft(draft: Draft): Draft[] {
  const drafts = loadDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  const next: Draft = { ...draft, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    drafts[idx] = next;
  } else {
    drafts.unshift(next);
  }
  saveDrafts(drafts);
  return drafts;
}

export function deleteDraft(id: string): Draft[] {
  const drafts = loadDrafts().filter((d) => d.id !== id);
  saveDrafts(drafts);
  return drafts;
}

export function renameDraft(id: string, name: string): Draft[] {
  const drafts = loadDrafts();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx < 0) return drafts;
  drafts[idx] = { ...drafts[idx], name: name.trim() || drafts[idx].name, updatedAt: new Date().toISOString() };
  saveDrafts(drafts);
  return drafts;
}

export interface LastSession {
  client: DraftClientInfo;
  config: DraftConfig;
  currentDraftId: string | null;
}

export function loadLastSession(): LastSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastSession>;
    if (!parsed.config || !parsed.client) return null;
    return {
      client: { ...EMPTY_CLIENT_INFO, ...parsed.client },
      config: migrateConfig(parsed.config),
      currentDraftId: parsed.currentDraftId ?? null,
    };
  } catch {
    return null;
  }
}

export function saveLastSession(session: LastSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_KEY, JSON.stringify(session));
}

export function clearLastSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(LAST_KEY);
}

// Sanity helper for QuoteState completeness when loading a snapshot.
export function withSnapshotDefaults(snapshot: Partial<QuoteState>): QuoteState {
  return { ...DEFAULTS, ...snapshot };
}

// Helper used by remote-load paths to take an unknown draft-shaped object
// from the wire and produce a clean, migrated Draft we trust.
export function normalizeIncomingDraft(raw: unknown): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<Draft>;
  if (typeof d.id !== "string") return null;
  if (!d.config || !d.client || !d.assumptionsSnapshot) return null;
  const migrated: Draft = {
    id: d.id,
    name: d.name ?? "Untitled quote",
    createdAt: d.createdAt ?? new Date().toISOString(),
    updatedAt: d.updatedAt ?? new Date().toISOString(),
    client: { ...EMPTY_CLIENT_INFO, ...d.client },
    config: migrateConfig(d.config),
    assumptionsSnapshot: withSnapshotDefaults(d.assumptionsSnapshot),
    cachedTotal: typeof d.cachedTotal === "number" ? d.cachedTotal : 0,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
  return migrated;
}

// Reconcile a remote list with the local cache. Remote wins on equal-or-newer updatedAt.
export function reconcileDrafts(local: Draft[], remote: Draft[]): Draft[] {
  const byId = new Map<string, Draft>();
  for (const d of local) byId.set(d.id, d);
  for (const r of remote) {
    const existing = byId.get(r.id);
    if (!existing || r.updatedAt >= existing.updatedAt) byId.set(r.id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0),
  );
}
