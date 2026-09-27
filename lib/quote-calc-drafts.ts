import { ITEM_CATALOG, type CatalogItem, type QuoteState } from "./legacy/logic";
import type { DraftConfig } from "./legacy/types";
import { migrateConfig, withSnapshotDefaults } from "./legacy/migrate";
import { computeTotals } from "./quote-engine";
import { convertLegacyDraft } from "./quote-legacy";
import { DEFAULT_SETTINGS } from "./quote-pricebook";
import type {
  DraftConfigV5,
  LineOption,
  QuoteDiscount,
  QuoteGroup,
  QuoteLineV5,
} from "./quote-types";

export type {
  DiscountReason,
  DraftConfigV5,
  HealthSnapshot,
  LegacyRecord,
  LineKindV5,
  LineOption,
  QtyLink,
  QuoteDiscount,
  QuoteGroup,
  QuoteLineV5,
  QuoteServices,
} from "./quote-types";

// The v1–v4 config shape and its migration are frozen in lib/legacy/.
export * from "./legacy/types";
export { withSnapshotDefaults } from "./legacy/migrate";

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

// The pre-v5 draft, still written by the old calculator until the new builder
// ships (P4). Read surfaces convert it with toV5Draft().
export const LEGACY_SCHEMA_VERSION = 4 as const;

export interface LegacyDraft {
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

export function migrateDraft(d: LegacyDraft): LegacyDraft {
  return {
    ...d,
    client: { ...EMPTY_CLIENT_INFO, ...d.client },
    config: migrateConfig(d.config),
    schemaVersion: LEGACY_SCHEMA_VERSION,
  };
}

export function loadDrafts(): LegacyDraft[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d): d is LegacyDraft => {
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

export function saveDrafts(drafts: LegacyDraft[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function createDraft(
  name: string,
  client: DraftClientInfo,
  config: DraftConfig,
  assumptions: QuoteState,
  cachedTotal: number,
): LegacyDraft {
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
    schemaVersion: LEGACY_SCHEMA_VERSION,
  };
}

export function upsertDraft(draft: LegacyDraft): LegacyDraft[] {
  const drafts = loadDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  const next: LegacyDraft = { ...draft, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    drafts[idx] = next;
  } else {
    drafts.unshift(next);
  }
  saveDrafts(drafts);
  return drafts;
}

export function deleteDraft(id: string): LegacyDraft[] {
  const drafts = loadDrafts().filter((d) => d.id !== id);
  saveDrafts(drafts);
  return drafts;
}

export function renameDraft(id: string, name: string): LegacyDraft[] {
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

// Helper used by remote-load paths to take an unknown legacy draft from the
// wire and produce a clean, migrated LegacyDraft we trust. v5 drafts are
// rejected here (they have no assumptionsSnapshot); see normalizeStoredDraft.
export function normalizeIncomingDraft(raw: unknown): LegacyDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<LegacyDraft>;
  if (typeof d.id !== "string") return null;
  if (!d.config || !d.client || !d.assumptionsSnapshot) return null;
  const migrated: LegacyDraft = {
    id: d.id,
    name: d.name ?? "Untitled quote",
    createdAt: d.createdAt ?? new Date().toISOString(),
    updatedAt: d.updatedAt ?? new Date().toISOString(),
    client: { ...EMPTY_CLIENT_INFO, ...d.client },
    config: migrateConfig(d.config),
    assumptionsSnapshot: withSnapshotDefaults(d.assumptionsSnapshot),
    cachedTotal: typeof d.cachedTotal === "number" ? d.cachedTotal : 0,
    schemaVersion: LEGACY_SCHEMA_VERSION,
  };
  return migrated;
}

// Reconcile a remote list with the local cache. Remote wins on equal-or-newer updatedAt.
export function reconcileDrafts(local: LegacyDraft[], remote: LegacyDraft[]): LegacyDraft[] {
  const byId = new Map<string, LegacyDraft>();
  for (const d of local) byId.set(d.id, d);
  for (const r of remote) {
    const existing = byId.get(r.id);
    if (!existing || r.updatedAt >= existing.updatedAt) byId.set(r.id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0),
  );
}

// ---------------------------------------------------------------------------
// v5 drafts (docs/quote-builder-redesign.md §8)
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = 5 as const;

export interface Draft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  client: DraftClientInfo;
  config: DraftConfigV5;
  /** Always computeTotals(config).total, recomputed on save. */
  cachedTotal: number;
  schemaVersion: 5;
}

/** Whatever a `_data` payload or a local cache holds: v5, or a pre-v5 quote. */
export type StoredDraft = Draft | LegacyDraft;

export function isV5Draft(d: StoredDraft): d is Draft {
  return d.schemaVersion === 5;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function cleanOption(o: unknown): LineOption | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Partial<LineOption>;
  if (typeof r.id !== "string") return null;
  const kind = r.kind === "percent" || r.kind === "flat" ? r.kind : "per-piece";
  return {
    id: r.id,
    name: str(r.name, r.id),
    kind,
    amount: num(r.amount, 0),
    ...(typeof r.estCost === "number" ? { estCost: r.estCost } : {}),
  };
}

function cleanLine(l: unknown, i: number): QuoteLineV5 | null {
  if (!l || typeof l !== "object") return null;
  const r = l as Partial<QuoteLineV5>;
  const link = r.qtyLink && (r.qtyLink.basis === "household" || r.qtyLink.basis === "guest")
    ? { basis: r.qtyLink.basis, per: num(r.qtyLink.per, 1) }
    : null;
  return {
    ...r,
    id: str(r.id) || `line-${i}`,
    kind: r.kind === "custom" ? "custom" : "product",
    name: str(r.name),
    qty: num(r.qty, 0),
    qtyLink: link,
    unitPrice: num(r.unitPrice, 0),
    designFee: num(r.designFee, 0),
    digital: r.digital === true,
    options: (Array.isArray(r.options) ? r.options : []).map(cleanOption).filter((o): o is LineOption => !!o),
  } as QuoteLineV5;
}

/** Validate a v5 config from the wire, backfilling any missing field. */
export function sanitizeConfigV5(raw: unknown): DraftConfigV5 | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<DraftConfigV5>;
  if (c.schema !== 5) return null;
  const sv: Partial<DraftConfigV5["services"]> = c.services ?? {};
  const discount = c.discount as QuoteDiscount | null | undefined;
  return {
    ...c,
    schema: 5,
    households: num(c.households, 0),
    guests: num(c.guests, 0),
    groups: (Array.isArray(c.groups) ? c.groups : [])
      .filter((g): g is QuoteGroup => !!g && typeof g.id === "string")
      .map((g) => ({ ...g, name: str(g.name), bundlePct: num(g.bundlePct, 0) })),
    lines: (Array.isArray(c.lines) ? c.lines : []).map(cleanLine).filter((l): l is QuoteLineV5 => !!l),
    services: {
      rush: sv.rush === true,
      rushPct: num(sv.rushPct, DEFAULT_SETTINGS.rushPct),
      extraRevisions: num(sv.extraRevisions, 0),
      revisionRoundPrice: num(sv.revisionRoundPrice, DEFAULT_SETTINGS.revisionRoundPrice),
      license: sv.license === true,
      licenseFee: num(sv.licenseFee, DEFAULT_SETTINGS.licenseFee),
      packagingFee: num(sv.packagingFee, DEFAULT_SETTINGS.packagingFee),
    },
    reuseDesignPct: num(c.reuseDesignPct, DEFAULT_SETTINGS.reuseDesignPct),
    discount:
      discount && typeof discount === "object" && (discount.kind === "percent" || discount.kind === "amount")
        ? { ...discount, value: num(discount.value, 0) }
        : null,
    adjustment:
      c.adjustment && typeof c.adjustment === "object" && Number.isFinite(c.adjustment.amount)
        ? { amount: c.adjustment.amount, label: str(c.adjustment.label) }
        : null,
    shipping: typeof c.shipping === "number" && Number.isFinite(c.shipping) ? c.shipping : null,
    deposit: num(c.deposit, 0),
    pricedAt: str(c.pricedAt),
  };
}

export function normalizeDraftV5(raw: unknown): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<Draft>;
  if (typeof d.id !== "string" || d.schemaVersion !== 5) return null;
  const config = sanitizeConfigV5(d.config);
  if (!config) return null;
  return {
    id: d.id,
    name: str(d.name, "Untitled quote") || "Untitled quote",
    createdAt: str(d.createdAt) || new Date().toISOString(),
    updatedAt: str(d.updatedAt) || new Date().toISOString(),
    client: { ...EMPTY_CLIENT_INFO, ...(d.client ?? {}) },
    config,
    cachedTotal: computeTotals(config).total,
    schemaVersion: 5,
  };
}

/** Any stored quote (v5 or legacy) from the wire or a `_data` cell. */
export function normalizeStoredDraft(raw: unknown): StoredDraft | null {
  if (raw && typeof raw === "object" && (raw as { schemaVersion?: unknown }).schemaVersion === 5) {
    return normalizeDraftV5(raw);
  }
  return normalizeIncomingDraft(raw);
}

/**
 * The v5 view of a stored quote. Legacy quotes are converted in memory with
 * `catalog` (the live Items tab on the server, so the result equals what the
 * client link showed; the bundled catalog elsewhere). v5 drafts pass through.
 */
export function toV5Draft(d: StoredDraft, catalog: CatalogItem[] = ITEM_CATALOG): Draft {
  if (isV5Draft(d)) return d;
  const { config } = convertLegacyDraft(
    { id: d.id, config: d.config, assumptionsSnapshot: d.assumptionsSnapshot, updatedAt: d.updatedAt },
    catalog,
    d.updatedAt,
  );
  return {
    id: d.id,
    name: d.name,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    client: { ...EMPTY_CLIENT_INFO, ...d.client },
    config,
    cachedTotal: computeTotals(config).total,
    schemaVersion: 5,
  };
}
