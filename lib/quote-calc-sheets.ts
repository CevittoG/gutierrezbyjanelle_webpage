// Server-only: Google Sheets persistence for quote-calc drafts.
//
// Memory-conscious: we use only `google-auth-library` (~1MB) for JWT signing
// and call the Sheets v4 REST API directly with fetch. The full `googleapis`
// package is intentionally avoided — Render's 512MB tier can't afford it.
//
// Access tokens are cached at module scope until expiry, so each request to
// /api/drafts costs at most one outbound fetch to Google.

import "server-only";
import { JWT } from "google-auth-library";
import type { Draft } from "./quote-calc-drafts";
import { normalizeIncomingDraft } from "./quote-calc-drafts";
import type {
  ConfigWarning,
  RemoteConfig,
  RemoteItem,
  RemoteSetting,
} from "./quote-calc-config";

const SHEET_TAB = "Quotes";
const FIRST_DATA_ROW = 2; // row 1 = headers
const RANGE_ALL = `${SHEET_TAB}!A${FIRST_DATA_ROW}:M`;
const NUM_COLS = 13; // A..M

// --- Phase 1: config tabs ---
const SETTINGS_TAB = "Settings";
const SETTINGS_RANGE = `${SETTINGS_TAB}!A2:B`;
const ITEMS_TAB = "Items";
// A: key, B: label, C: designMin, D: prodMin, E: sheetCost, F: yield, G: qty, H: fixed
const ITEMS_RANGE = `${ITEMS_TAB}!A2:H`;
const CONFIG_CACHE_TTL_MS = 60_000;

type Row = (string | number)[];

interface SheetsConfig {
  email: string;
  privateKey: string;
  docId: string;
}

function getConfig(): SheetsConfig | null {
  const email = process.env.GOOGLE_SHEETS_SA_EMAIL;
  const rawKey = process.env.GOOGLE_SHEETS_SA_PRIVATE_KEY;
  const docId = process.env.GOOGLE_SHEETS_DOC_ID;
  if (!email || !rawKey || !docId) return null;
  // Render and most hosting platforms store the PEM with escaped newlines.
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { email, privateKey, docId };
}

export function isSheetsConfigured(): boolean {
  return getConfig() !== null;
}

// --- Token cache ---

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}
let cachedToken: CachedToken | null = null;
let inflightToken: Promise<string> | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }
  if (inflightToken) return inflightToken;

  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();

  inflightToken = (async () => {
    const jwt = new JWT({
      email: cfg.email,
      key: cfg.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const res = await jwt.authorize();
    if (!res.access_token) throw new Error("Google Auth: no access_token returned");
    const expiresInMs = res.expiry_date ? Math.max(0, res.expiry_date - Date.now()) : 3500 * 1000;
    cachedToken = {
      token: res.access_token,
      expiresAt: Date.now() + expiresInMs,
    };
    return res.access_token;
  })().finally(() => {
    inflightToken = null;
  });

  return inflightToken;
}

// --- Sheets REST helpers ---

class SheetsUnconfiguredError extends Error {
  constructor() {
    super("Sheets not configured");
    this.name = "SheetsUnconfiguredError";
  }
}

async function sheetsFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

async function readAllRows(docId: string): Promise<{ rows: Row[]; rangeUsed: string }> {
  const res = await sheetsFetch(
    `${docId}/values/${encodeURIComponent(RANGE_ALL)}?majorDimension=ROWS`,
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets read failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: Row[]; range?: string };
  return { rows: data.values ?? [], rangeUsed: data.range ?? RANGE_ALL };
}

function rowToDraft(row: Row): Draft | null {
  const status = String(row[2] ?? "");
  if (status === "archived") return null;
  const payload = row[12];
  if (typeof payload !== "string" || !payload) return null;
  try {
    const parsed = JSON.parse(payload);
    return normalizeIncomingDraft(parsed);
  } catch {
    return null;
  }
}

function draftToRow(d: Draft, status: "active" | "archived" = "active"): Row {
  return [
    d.id,
    d.name,
    status,
    d.client.name,
    d.client.eventDate,
    d.client.eventType,
    d.config.pkg,
    d.config.qty,
    d.cachedTotal,
    d.createdAt,
    d.updatedAt,
    d.client.notes,
    JSON.stringify(d),
  ];
}

// --- Public API ---

export async function listDrafts(): Promise<Draft[]> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { rows } = await readAllRows(cfg.docId);
  const out: Draft[] = [];
  for (const row of rows) {
    const d = rowToDraft(row);
    if (d) out.push(d);
  }
  return out;
}

export async function upsertDraftRow(draft: Draft): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { rows } = await readAllRows(cfg.docId);
  const idx = rows.findIndex((row) => String(row[0] ?? "") === draft.id);
  const values: Row[] = [draftToRow(draft, "active")];

  if (idx >= 0) {
    const rowNumber = FIRST_DATA_ROW + idx;
    const range = `${SHEET_TAB}!A${rowNumber}:M${rowNumber}`;
    const res = await sheetsFetch(
      `${cfg.docId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      { method: "PUT", body: JSON.stringify({ range, majorDimension: "ROWS", values }) },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets update failed: ${res.status} ${body.slice(0, 200)}`);
    }
  } else {
    const range = `${SHEET_TAB}!A:M`;
    const res = await sheetsFetch(
      `${cfg.docId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ range, majorDimension: "ROWS", values }) },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets append failed: ${res.status} ${body.slice(0, 200)}`);
    }
  }
}

export async function archiveDraftRow(id: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { rows } = await readAllRows(cfg.docId);
  const idx = rows.findIndex((row) => String(row[0] ?? "") === id);
  if (idx < 0) return false;
  const rowNumber = FIRST_DATA_ROW + idx;
  // Only update column C (status) — preserves the rest of the row for history.
  const range = `${SHEET_TAB}!C${rowNumber}:C${rowNumber}`;
  const res = await sheetsFetch(
    `${cfg.docId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ range, majorDimension: "ROWS", values: [["archived"]] }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets archive failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return true;
}

// --- Config (Items + Settings) reader ---

interface ConfigCacheEntry {
  config: RemoteConfig;
  expiresAt: number;
}
let cachedConfig: ConfigCacheEntry | null = null;
let inflightConfig: Promise<RemoteConfig> | null = null;

function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // Tolerate "$1.50", "10%", "1,250" — Janelle is editing this in Sheets.
  const cleaned = trimmed.replace(/[$,%\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function fetchSheetRange(docId: string, range: string): Promise<Row[] | "tab-missing"> {
  const res = await sheetsFetch(
    `${docId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
  );
  if (res.status === 400 || res.status === 404) {
    // Sheets returns 400 when the tab name doesn't exist.
    return "tab-missing";
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets read failed (${range}): ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: Row[] };
  return data.values ?? [];
}

async function readConfigFromSheet(cfg: SheetsConfig): Promise<RemoteConfig> {
  const warnings: ConfigWarning[] = [];
  const settings: RemoteSetting[] = [];
  const items: RemoteItem[] = [];

  const [settingsRes, itemsRes] = await Promise.all([
    fetchSheetRange(cfg.docId, SETTINGS_RANGE).catch((err): "fetch-failed" => {
      warnings.push({
        kind: "fetch-failed",
        tab: "Settings",
        sheetRow: null,
        detail: err instanceof Error ? err.message : String(err),
      });
      return "fetch-failed";
    }),
    fetchSheetRange(cfg.docId, ITEMS_RANGE).catch((err): "fetch-failed" => {
      warnings.push({
        kind: "fetch-failed",
        tab: "Items",
        sheetRow: null,
        detail: err instanceof Error ? err.message : String(err),
      });
      return "fetch-failed";
    }),
  ]);

  if (settingsRes === "tab-missing") {
    warnings.push({
      kind: "tab-missing",
      tab: "Settings",
      sheetRow: null,
      detail: 'No tab named "Settings" found in the Sheet.',
    });
  } else if (Array.isArray(settingsRes)) {
    if (settingsRes.length === 0) {
      warnings.push({
        kind: "empty",
        tab: "Settings",
        sheetRow: null,
        detail: 'The "Settings" tab has no data rows.',
      });
    }
    settingsRes.forEach((row, i) => {
      const sheetRow = i + 2; // skip header row
      const key = String(row[0] ?? "").trim();
      if (!key) return; // silent skip on blank rows
      const value = parseNumber(row[1]);
      if (value === null) {
        warnings.push({
          kind: "invalid-row",
          tab: "Settings",
          sheetRow,
          detail: `Row ${sheetRow} (${key}): value "${row[1] ?? ""}" is not a number.`,
        });
        return;
      }
      settings.push({ key, value, sheetRow });
    });
  }

  if (itemsRes === "tab-missing") {
    warnings.push({
      kind: "tab-missing",
      tab: "Items",
      sheetRow: null,
      detail: 'No tab named "Items" found in the Sheet.',
    });
  } else if (Array.isArray(itemsRes)) {
    if (itemsRes.length === 0) {
      warnings.push({
        kind: "empty",
        tab: "Items",
        sheetRow: null,
        detail: 'The "Items" tab has no data rows.',
      });
    }
    itemsRes.forEach((row, i) => {
      const sheetRow = i + 2;
      const key = String(row[0] ?? "").trim();
      if (!key) return;
      const label = String(row[1] ?? "").trim();
      const designMin = parseNumber(row[2]);
      const prodMin = parseNumber(row[3]);
      const sheetCost = parseNumber(row[4]);
      const yieldVal = parseNumber(row[5]);
      const qty = parseNumber(row[6]);
      const fixedRaw = row[7];
      const fixed =
        fixedRaw === undefined || fixedRaw === null || String(fixedRaw).trim() === ""
          ? null
          : parseNumber(fixedRaw);
      if (
        designMin === null ||
        prodMin === null ||
        sheetCost === null ||
        yieldVal === null ||
        qty === null
      ) {
        warnings.push({
          kind: "invalid-row",
          tab: "Items",
          sheetRow,
          detail: `Row ${sheetRow} (${key}): one or more numeric columns are blank or non-numeric.`,
        });
        return;
      }
      items.push({
        key,
        label,
        designMin,
        prodMin,
        sheetCost,
        yield: yieldVal,
        qty,
        fixed: fixed ?? null,
        sheetRow,
      });
    });
  }

  return { settings, items, warnings };
}

export async function listConfig(options?: { force?: boolean }): Promise<RemoteConfig> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();

  const now = Date.now();
  if (!options?.force && cachedConfig && cachedConfig.expiresAt > now) {
    return cachedConfig.config;
  }
  if (inflightConfig) return inflightConfig;

  inflightConfig = (async () => {
    const result = await readConfigFromSheet(cfg);
    cachedConfig = { config: result, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
    return result;
  })().finally(() => {
    inflightConfig = null;
  });

  return inflightConfig;
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
}

export { SheetsUnconfiguredError, NUM_COLS };
