import {
  DEFAULTS,
  PkgKey,
  PricingMode,
  QuoteState,
} from "./quote-calc-logic";

export interface DraftClientInfo {
  name: string;
  eventDate: string;
  eventType: string;
  notes: string;
}

export const EMPTY_CLIENT_INFO: DraftClientInfo = {
  name: "",
  eventDate: "",
  eventType: "Wedding",
  notes: "",
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

export interface DraftConfig {
  pkg: PkgKey;
  mode: PricingMode;
  qty: number;
  addOns: Record<string, number>;
  miscAddOns: MiscAddOn[];
  rushFee: boolean;
  extraRevisions: number;
  digitalLicense: boolean;
  vendorIncentive: boolean;
  fullColor: boolean;
  customPaper: boolean;
  individualItem: string;
  individualDigital: boolean;
}

export const DEFAULT_CONFIG: DraftConfig = {
  pkg: "sweet",
  mode: "fresh",
  qty: 75,
  addOns: {},
  miscAddOns: [],
  rushFee: false,
  extraRevisions: 0,
  digitalLicense: false,
  vendorIncentive: false,
  fullColor: false,
  customPaper: false,
  individualItem: "iInvite",
  individualDigital: false,
};

export const CURRENT_SCHEMA_VERSION = 2 as const;

export interface Draft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  client: DraftClientInfo;
  config: DraftConfig;
  assumptionsSnapshot: QuoteState;
  cachedTotal: number;
  schemaVersion: 1 | 2;
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

// Migrate a draft (or DraftConfig fragment) so that legacy `iDrinkTop` add-on
// quantities are rewritten as `iWedgeTop`. Idempotent — safe to call repeatedly.
function migrateAddOns(addOns: Record<string, number> | undefined): Record<string, number> {
  const next: Record<string, number> = { ...(addOns ?? {}) };
  if ("iDrinkTop" in next) {
    const qty = next.iDrinkTop;
    delete next.iDrinkTop;
    if (qty > 0) next.iWedgeTop = (next.iWedgeTop ?? 0) + qty;
  }
  return next;
}

function migrateConfig(c: DraftConfig): DraftConfig {
  return {
    ...DEFAULT_CONFIG,
    ...c,
    addOns: migrateAddOns(c.addOns),
    miscAddOns: Array.isArray(c.miscAddOns) ? c.miscAddOns : [],
  };
}

export function migrateDraft(d: Draft): Draft {
  return {
    ...d,
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
          (d.schemaVersion === 1 || d.schemaVersion === 2) &&
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
      config: migrateConfig({ ...DEFAULT_CONFIG, ...parsed.config }),
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
    config: migrateConfig({ ...DEFAULT_CONFIG, ...d.config }),
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
