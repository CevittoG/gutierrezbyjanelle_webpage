import type { QuoteState } from "./legacy/logic";
import type { DraftConfig } from "./legacy/types";
import { migrateConfig, withSnapshotDefaults } from "./legacy/migrate";

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
