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

export interface DraftConfig {
  pkg: PkgKey;
  mode: PricingMode;
  qty: number;
  addOns: Record<string, number>;
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
  rushFee: false,
  extraRevisions: 0,
  digitalLicense: false,
  vendorIncentive: false,
  fullColor: false,
  customPaper: false,
  individualItem: "iInvite",
  individualDigital: false,
};

export interface Draft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  client: DraftClientInfo;
  config: DraftConfig;
  assumptionsSnapshot: QuoteState;
  cachedTotal: number;
  schemaVersion: 1;
}

const DRAFTS_KEY = "quote-calc-drafts";
const LAST_KEY = "quote-calc-last";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadDrafts(): Draft[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d): d is Draft => {
      return d && typeof d === "object" && d.schemaVersion === 1 && typeof d.id === "string";
    });
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
    schemaVersion: 1,
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
    // Backfill any missing addOns keys as empty
    return {
      client: { ...EMPTY_CLIENT_INFO, ...parsed.client },
      config: { ...DEFAULT_CONFIG, ...parsed.config, addOns: { ...(parsed.config.addOns ?? {}) } },
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
