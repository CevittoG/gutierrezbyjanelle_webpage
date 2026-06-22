// Server-only: Google Sheets persistence for quote-calc drafts.
//
// Memory-conscious: we use only `google-auth-library` (~1MB) for JWT signing
// and call the Sheets v4 REST API directly with fetch. The full `googleapis`
// package is intentionally avoided — Render's 512MB tier can't afford it.
//
// Access tokens are cached at module scope until expiry, so each request to
// /api/drafts costs at most one outbound fetch to Google.

import "server-only";
import { timingSafeEqual } from "crypto";
import { JWT } from "google-auth-library";
import type { Draft } from "./quote-calc-drafts";
import { normalizeIncomingDraft } from "./quote-calc-drafts";
import type {
  ConfigWarning,
  RemoteConfig,
  RemoteItem,
  RemoteSetting,
} from "./quote-calc-config";
import type { LinkStatus, PortalMeta, ProjectStage } from "./quote-calc-portal";
import { nextStage } from "./quote-calc-portal";
import { packagesDisplayName, summarizeLineItems } from "./quote-calc-summary";

const SHEET_TAB = "Quotes";
const FIRST_DATA_ROW = 2; // row 1 = headers
// Draft data (A–M) is written by the draft pipeline. Portal metadata (N–U) is
// written only by the portal accessors below, so a quote save never clobbers a
// public token / lifecycle state. The header spans the full A–U width.
const HEADER_RANGE = `${SHEET_TAB}!A1:U1`;
const NUM_COLS = 13; // A..M (draft readable columns)

// --- Phase 2: human-readable Quotes tab + separate _data payload tab ---
//
// "Quotes" schema (header row in A1:R1):
//   A  Quote ID    | B  Status      | C  Client       | D  Event type
//   E  Event date  | F  Quote name  | G  Package      | H  Quantity
//   I  Line items  | J  Total       | K  Hidden notes | L  Created
//   M  Updated
//   (the client-facing note lives only in the _data Draft JSON, not a column)
//   --- Phase 3 portal metadata (server-managed; Janelle-editable) ---
//   N  Drive folder | O  Public token | P  Link status | Q  Expires
//   --- Phase 4 lifecycle (server-managed; Janelle-editable) ---
//   R  Approved at  | S  Stage        | T  Approved by | U  Deposit paid ($)
//
// New "_data" tab (header row in A1:B1): A Quote ID | B Payload (JSON)
//
// We auto-detect by looking at cell A1:
//   "Quote ID"           → new schema (this module's canonical format)
//   anything else / blank → legacy schema (col M held the Draft JSON)
//
// Reads support both schemas so existing data keeps loading. Writes always
// produce the new schema; the first write after a deploy auto-migrates any
// legacy rows over so subsequent reads use the readable path.

const NEW_SCHEMA_A1 = "Quote ID";
const NEW_HEADER_ROW: Row = [
  "Quote ID",
  "Status",
  "Client",
  "Event type",
  "Event date",
  "Quote name",
  "Package",
  "Quantity",
  "Line items",
  "Total",
  "Hidden notes",
  "Created",
  "Updated",
  // Phase 3 portal metadata (N–Q).
  "Drive folder",
  "Public token",
  "Link status",
  "Expires",
  // Phase 4 lifecycle (R–U).
  "Approved at",
  "Stage",
  "Approved by",
  "Deposit paid",
];

const DATA_TAB = "_data";
const DATA_RANGE = `${DATA_TAB}!A2:B`;
const DATA_HEADER_RANGE = `${DATA_TAB}!A1:B1`;
const DATA_HEADER_ROW: Row = ["Quote ID", "Payload"];

type Schema = "new" | "legacy" | "empty";

// Column indexes for each schema. Keep in sync with NEW_HEADER_ROW above
// and with the original draftToRow output.
const NEW_COL = {
  id: 0,
  status: 1,
  client: 2,
  eventType: 3,
  eventDate: 4,
  name: 5,
  pkg: 6,
  qty: 7,
  lineItems: 8,
  total: 9,
  notes: 10,
  createdAt: 11,
  updatedAt: 12,
} as const;
const LEGACY_COL = {
  id: 0,
  name: 1,
  status: 2,
  payload: 12,
} as const;

// Phase 3 portal metadata + Phase 4 lifecycle columns (0-indexed; N–U).
const PORTAL_COL = {
  driveFolderId: 13, // N
  publicToken: 14, // O
  linkStatus: 15, // P
  expiresAt: 16, // Q
  approvedAt: 17, // R
  stage: 18, // S
  approvedBy: 19, // T
  depositPaid: 20, // U
} as const;

// 0-indexed column → A1 letter. Valid for the A–U range we use (0–20).
function colLetter(index: number): string {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

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
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        // Phase 3: create the per-quote subfolder (drive.file) and read the
        // proofs Janelle uploads into it (drive.readonly — those files are
        // owned by her, so drive.file alone can't see them).
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
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

async function readRange(docId: string, range: string): Promise<Row[]> {
  const res = await sheetsFetch(
    `${docId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
  );
  if (res.status === 400 || res.status === 404) {
    // Range refers to a tab that doesn't exist. Treat as empty so callers
    // can decide whether to create it.
    return [];
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets read failed (${range}): ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: Row[] };
  return data.values ?? [];
}

async function readQuotesTab(
  docId: string,
): Promise<{ schema: Schema; header: Row; rows: Row[] }> {
  const all = await readRange(docId, `${SHEET_TAB}!A1:R`);
  if (all.length === 0) return { schema: "empty", header: [], rows: [] };
  const header = all[0] ?? [];
  const rows = all.slice(1);
  const a1 = String(header[0] ?? "").trim();
  const schema: Schema = a1 === NEW_SCHEMA_A1 ? "new" : "legacy";
  return { schema, header, rows };
}

// --- Legacy format (pre-Phase 2) ---

function rowToDraftLegacy(row: Row): Draft | null {
  const status = String(row[LEGACY_COL.status] ?? "");
  if (status === "archived") return null;
  const payload = row[LEGACY_COL.payload];
  if (typeof payload !== "string" || !payload) return null;
  try {
    return normalizeIncomingDraft(JSON.parse(payload));
  } catch {
    return null;
  }
}

// --- New format (Phase 2) ---

function draftToReadableRow(
  d: Draft,
  status: "active" | "archived" = "active",
): Row {
  return [
    d.id,
    status,
    d.client.name,
    d.client.eventType,
    d.client.eventDate,
    d.name,
    packagesDisplayName(d.config.packages),
    d.config.packages.map((p) => p.qty).join(", "),
    summarizeLineItems(d),
    Math.round(d.cachedTotal),
    d.client.notes,
    d.createdAt,
    d.updatedAt,
  ];
}

function draftToPayloadRow(d: Draft): Row {
  return [d.id, JSON.stringify(d)];
}

// Reads new-schema rows + the matching JSON payload from the _data tab, then
// reconstructs a full Draft. Rows whose payload is missing or unparseable are
// skipped (with a warning) so the rest of the list still loads.
async function readDraftsNewSchema(
  docId: string,
  rows: Row[],
): Promise<Draft[]> {
  const dataRows = await readRange(docId, DATA_RANGE);
  const payloadById = new Map<string, string>();
  for (const r of dataRows) {
    const id = String(r[0] ?? "").trim();
    const payload = r[1];
    if (id && typeof payload === "string") payloadById.set(id, payload);
  }

  const out: Draft[] = [];
  for (const row of rows) {
    const id = String(row[NEW_COL.id] ?? "").trim();
    if (!id) continue;
    const status = String(row[NEW_COL.status] ?? "").trim();
    if (status === "archived") continue;
    const payload = payloadById.get(id);
    if (!payload) {
      console.warn(`[sheets] Quote ${id}: no payload in _data — skipping.`);
      continue;
    }
    try {
      const draft = normalizeIncomingDraft(JSON.parse(payload));
      if (draft) out.push(draft);
    } catch {
      console.warn(`[sheets] Quote ${id}: payload is not valid JSON — skipping.`);
    }
  }
  return out;
}

// --- Schema upgrade (one-shot, on first write after Phase 2 deploys) ---

async function fetchSpreadsheetMeta(docId: string): Promise<{ sheets: { title: string }[] }> {
  const res = await sheetsFetch(`${docId}?fields=sheets.properties.title`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets meta read failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    sheets?: { properties?: { title?: string } }[];
  };
  return {
    sheets: (data.sheets ?? [])
      .map((s) => ({ title: s.properties?.title ?? "" }))
      .filter((s) => s.title),
  };
}

async function ensureDataTabExists(docId: string): Promise<void> {
  const meta = await fetchSpreadsheetMeta(docId);
  if (meta.sheets.some((s) => s.title === DATA_TAB)) return;
  const res = await sheetsFetch(`${docId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: DATA_TAB, hidden: true } } }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets create-tab failed: ${res.status} ${body.slice(0, 200)}`);
  }
  // Write the _data header row right after creation.
  await writeRange(docId, DATA_HEADER_RANGE, [DATA_HEADER_ROW]);
}

async function writeRange(docId: string, range: string, values: Row[]): Promise<void> {
  const res = await sheetsFetch(
    `${docId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ range, majorDimension: "ROWS", values }) },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets write failed (${range}): ${res.status} ${body.slice(0, 200)}`);
  }
}

async function clearRange(docId: string, range: string): Promise<void> {
  const res = await sheetsFetch(
    `${docId}/values/${encodeURIComponent(range)}:clear`,
    { method: "POST", body: "{}" },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets clear failed (${range}): ${res.status} ${body.slice(0, 200)}`);
  }
}

// Migrate Quotes from the legacy schema (JSON in col M) to the new readable
// schema + _data payload tab. Idempotent — calling on an already-new sheet
// is a no-op. Throws on partial failure; callers should retry safely.
async function migrateLegacyQuotesTab(
  docId: string,
  legacyRows: Row[],
): Promise<void> {
  // Recover the full Draft from each legacy row's JSON; preserve status.
  const recovered: { draft: Draft; status: "active" | "archived" }[] = [];
  for (const row of legacyRows) {
    const status: "active" | "archived" =
      String(row[LEGACY_COL.status] ?? "") === "archived" ? "archived" : "active";
    const payload = row[LEGACY_COL.payload];
    if (typeof payload !== "string" || !payload) continue;
    try {
      const draft = normalizeIncomingDraft(JSON.parse(payload));
      if (draft) recovered.push({ draft, status });
    } catch {
      // Drop unparseable rows — they were already broken.
    }
  }

  await ensureDataTabExists(docId);

  // Wipe existing data rows (incl. any stale portal columns) so column
  // meanings don't get mixed.
  await clearRange(docId, `${SHEET_TAB}!A2:U`);

  // Write new header.
  await writeRange(docId, HEADER_RANGE, [NEW_HEADER_ROW]);

  if (recovered.length > 0) {
    const readable = recovered.map(({ draft, status }) =>
      draftToReadableRow(draft, status),
    );
    const payloads = recovered.map(({ draft }) => draftToPayloadRow(draft));
    await writeRange(docId, `${SHEET_TAB}!A2:M${1 + recovered.length}`, readable);
    await writeRange(docId, `${DATA_TAB}!A2:B${1 + recovered.length}`, payloads);
  }
}

// Ensure the Sheet is in the new schema. Returns the post-upgrade view of
// the Quotes tab so callers can locate-or-append against fresh state.
async function ensureNewSchema(
  docId: string,
): Promise<{ rows: Row[] }> {
  const view = await readQuotesTab(docId);
  if (view.schema === "new") {
    // Backfill the wider A–R header on a sheet that was migrated before Phase 3
    // added the portal columns. One-time; idempotent once the header is full.
    if (view.header.length < NEW_HEADER_ROW.length) {
      await writeRange(docId, HEADER_RANGE, [NEW_HEADER_ROW]);
    }
    return { rows: view.rows };
  }

  if (view.schema === "empty") {
    // Brand-new sheet: just write headers + create _data tab.
    await ensureDataTabExists(docId);
    await writeRange(docId, HEADER_RANGE, [NEW_HEADER_ROW]);
    return { rows: [] };
  }

  // Legacy schema with existing rows — migrate them.
  await migrateLegacyQuotesTab(docId, view.rows);
  const after = await readQuotesTab(docId);
  return { rows: after.rows };
}

// --- Public API ---

export async function listDrafts(): Promise<Draft[]> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { schema, rows } = await readQuotesTab(cfg.docId);
  if (schema === "empty") return [];
  if (schema === "legacy") {
    const out: Draft[] = [];
    for (const row of rows) {
      const d = rowToDraftLegacy(row);
      if (d) out.push(d);
    }
    return out;
  }
  return readDraftsNewSchema(cfg.docId, rows);
}

export async function upsertDraftRow(draft: Draft): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { rows } = await ensureNewSchema(cfg.docId);
  const idx = rows.findIndex((row) => String(row[NEW_COL.id] ?? "") === draft.id);
  const readable = [draftToReadableRow(draft, "active")];
  const payload = [draftToPayloadRow(draft)];

  if (idx >= 0) {
    const rowNumber = FIRST_DATA_ROW + idx;
    await writeRange(
      cfg.docId,
      `${SHEET_TAB}!A${rowNumber}:M${rowNumber}`,
      readable,
    );
  } else {
    const range = `${SHEET_TAB}!A:M`;
    const res = await sheetsFetch(
      `${cfg.docId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ range, majorDimension: "ROWS", values: readable }) },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets append failed: ${res.status} ${body.slice(0, 200)}`);
    }
  }

  // Upsert the payload row in _data by id. Append on miss, overwrite on hit.
  await upsertDataPayload(cfg.docId, draft.id, payload[0]);
}

async function upsertDataPayload(docId: string, id: string, row: Row): Promise<void> {
  const dataRows = await readRange(docId, DATA_RANGE);
  const idx = dataRows.findIndex((r) => String(r[0] ?? "") === id);
  if (idx >= 0) {
    const rowNumber = 2 + idx;
    await writeRange(docId, `${DATA_TAB}!A${rowNumber}:B${rowNumber}`, [row]);
    return;
  }
  const range = `${DATA_TAB}!A:B`;
  const res = await sheetsFetch(
    `${docId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ range, majorDimension: "ROWS", values: [row] }) },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets payload append failed: ${res.status} ${body.slice(0, 200)}`);
  }
}

export async function archiveDraftRow(id: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { schema, rows } = await readQuotesTab(cfg.docId);
  if (schema === "empty") return false;

  const idCol = schema === "new" ? NEW_COL.id : LEGACY_COL.id;
  const statusCol = schema === "new" ? NEW_COL.status : LEGACY_COL.status;
  const statusLetter = String.fromCharCode("A".charCodeAt(0) + statusCol);

  const idx = rows.findIndex((row) => String(row[idCol] ?? "") === id);
  if (idx < 0) return false;
  const rowNumber = FIRST_DATA_ROW + idx;
  await writeRange(
    cfg.docId,
    `${SHEET_TAB}!${statusLetter}${rowNumber}:${statusLetter}${rowNumber}`,
    [["archived"]],
  );
  return true;
}

// Read a single Draft by id straight from the _data payload tab, regardless of
// archive status. Used by the public portal (token → id → payload) so it never
// has to load the whole draft list.
export async function getDraftById(id: string): Promise<Draft | null> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const dataRows = await readRange(cfg.docId, DATA_RANGE);
  const row = dataRows.find((r) => String(r[0] ?? "").trim() === id);
  if (!row) return null;
  const payload = row[1];
  if (typeof payload !== "string" || !payload) return null;
  try {
    return normalizeIncomingDraft(JSON.parse(payload));
  } catch {
    return null;
  }
}

// --- Phase 3: portal metadata (columns N–R) ---
//
// Token resolution happens on every public-portal hit, so the N–R columns are
// cached at module scope (~30s). Revocation/expiry edits in the Sheet take
// effect within the TTL — effectively instant for a manual edit, while a link
// shared widely never hammers the Sheets API.

const PORTAL_CACHE_TTL_MS = 30_000;

interface PortalCacheEntry {
  metaById: Map<string, PortalMeta>;
  expiresAt: number;
}
let cachedPortal: PortalCacheEntry | null = null;
let inflightPortal: Promise<Map<string, PortalMeta>> | null = null;

function rowToPortalMeta(row: Row): PortalMeta | null {
  const id = String(row[NEW_COL.id] ?? "").trim();
  if (!id) return null;
  const status = String(row[PORTAL_COL.linkStatus] ?? "").trim().toLowerCase();
  const linkStatus: LinkStatus =
    status === "active" || status === "revoked" ? (status as LinkStatus) : "";
  return {
    id,
    driveFolderId: String(row[PORTAL_COL.driveFolderId] ?? "").trim(),
    publicToken: String(row[PORTAL_COL.publicToken] ?? "").trim(),
    linkStatus,
    expiresAt: String(row[PORTAL_COL.expiresAt] ?? "").trim(),
    approvedAt: String(row[PORTAL_COL.approvedAt] ?? "").trim(),
    stage: String(row[PORTAL_COL.stage] ?? "").trim(),
    approvedBy: String(row[PORTAL_COL.approvedBy] ?? "").trim(),
    depositPaid: parseNumber(row[PORTAL_COL.depositPaid]) ?? 0,
  };
}

async function loadPortalMeta(force = false): Promise<Map<string, PortalMeta>> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();

  const now = Date.now();
  if (!force && cachedPortal && cachedPortal.expiresAt > now) {
    return cachedPortal.metaById;
  }
  if (inflightPortal) return inflightPortal;

  inflightPortal = (async () => {
    const rows = await readRange(cfg.docId, `${SHEET_TAB}!A${FIRST_DATA_ROW}:U`);
    const metaById = new Map<string, PortalMeta>();
    for (const row of rows) {
      const meta = rowToPortalMeta(row);
      if (meta) metaById.set(meta.id, meta);
    }
    cachedPortal = { metaById, expiresAt: Date.now() + PORTAL_CACHE_TTL_MS };
    return metaById;
  })().finally(() => {
    inflightPortal = null;
  });

  return inflightPortal;
}

function invalidatePortalCache(): void {
  cachedPortal = null;
}

// Map of Quote ID → portal metadata, for the admin Explorer's join with
// listDrafts(). Includes quotes that have no public link yet.
export async function listPortalMeta(options?: { force?: boolean }): Promise<Map<string, PortalMeta>> {
  return loadPortalMeta(options?.force);
}

export async function getPortalMetaById(
  id: string,
  options?: { force?: boolean },
): Promise<PortalMeta | null> {
  const map = await loadPortalMeta(options?.force);
  return map.get(id) ?? null;
}

// Resolve a public token to its quote. Constant-time compare over the small set
// of issued tokens. Returns the metadata regardless of status/expiry; the
// caller decides whether the link is live (see isLinkActive in quote-calc-portal).
export async function findByPublicToken(token: string): Promise<PortalMeta | null> {
  const raw = (token ?? "").trim();
  if (!raw) return null;
  const map = await loadPortalMeta();
  const candidate = Buffer.from(raw);
  for (const meta of Array.from(map.values())) {
    if (!meta.publicToken) continue;
    const stored = Buffer.from(meta.publicToken);
    if (stored.length === candidate.length && timingSafeEqual(stored, candidate)) {
      return meta;
    }
  }
  return null;
}

// Write a contiguous run of portal cells (N–R) on the row for `id`. Locates the
// row by id via the new schema, so it never collides with the draft A–M write.
async function writePortalCells(
  id: string,
  startCol: number,
  values: (string | number)[],
): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const { rows } = await ensureNewSchema(cfg.docId);
  const idx = rows.findIndex((row) => String(row[NEW_COL.id] ?? "") === id);
  if (idx < 0) return false;
  const rowNumber = FIRST_DATA_ROW + idx;
  const startLetter = colLetter(startCol);
  const endLetter = colLetter(startCol + values.length - 1);
  await writeRange(
    cfg.docId,
    `${SHEET_TAB}!${startLetter}${rowNumber}:${endLetter}${rowNumber}`,
    [values],
  );
  invalidatePortalCache();
  return true;
}

export async function setDriveFolderId(id: string, folderId: string): Promise<boolean> {
  return writePortalCells(id, PORTAL_COL.driveFolderId, [folderId]);
}

// Generate/regenerate a public link: write token + active status + (optional) expiry.
export async function activatePublicLink(
  id: string,
  token: string,
  expiresAt = "",
): Promise<boolean> {
  return writePortalCells(id, PORTAL_COL.publicToken, [token, "active", expiresAt]);
}

export async function revokePublicLink(id: string): Promise<boolean> {
  return writePortalCells(id, PORTAL_COL.linkStatus, ["revoked"]);
}

// --- Phase 4: lifecycle stage + client approval (columns R–T) ---

// Set the project stage (column S). Caller validates `stage` against STAGE_ORDER.
export async function setProjectStage(id: string, stage: ProjectStage): Promise<boolean> {
  return writePortalCells(id, PORTAL_COL.stage, [stage]);
}

// Record the client's proof approval and auto-advance the stage. Writes the
// contiguous R–T run in one call: R=approved-at timestamp, S=next stage,
// T=approver name. `fromStage` is the stage at approval time (expected "approval").
export async function recordApproval(
  id: string,
  name: string,
  fromStage: ProjectStage,
): Promise<boolean> {
  const approvedAt = new Date().toISOString();
  const advanced = nextStage(fromStage);
  return writePortalCells(id, PORTAL_COL.approvedAt, [approvedAt, advanced, name]);
}

// Record how much of the deposit the client has paid (column U). Display-only:
// the client portal shows it and derives the remaining balance from it.
export async function setDepositPaid(id: string, amount: number): Promise<boolean> {
  const safe = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
  return writePortalCells(id, PORTAL_COL.depositPaid, [safe]);
}

// Update a quote's private hidden notes (admin-only). Writes both the readable
// column K and the `_data` Draft JSON so the calculator and the sheet agree.
// Does not touch any other draft field or the row's status.
export async function updateHiddenNotes(id: string, notes: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsUnconfiguredError();
  const draft = await getDraftById(id);
  if (!draft) return false;
  const updated: Draft = {
    ...draft,
    client: { ...draft.client, notes },
    updatedAt: new Date().toISOString(),
  };
  await upsertDataPayload(cfg.docId, id, draftToPayloadRow(updated));
  // Readable mirror in column K (locates the row by id; cache invalidation is a
  // harmless no-op for a non-portal column).
  return writePortalCells(id, NEW_COL.notes, [notes]);
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

export { SheetsUnconfiguredError, NUM_COLS, getAccessToken as getGoogleAccessToken };
