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

const SHEET_TAB = "Quotes";
const FIRST_DATA_ROW = 2; // row 1 = headers
const RANGE_ALL = `${SHEET_TAB}!A${FIRST_DATA_ROW}:M`;
const NUM_COLS = 13; // A..M

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

export { SheetsUnconfiguredError, NUM_COLS };
