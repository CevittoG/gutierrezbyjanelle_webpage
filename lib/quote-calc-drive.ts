// Server-only: Google Drive v3 access for the Phase 3 client portal.
//
// Same memory discipline as the Sheets module — no `googleapis`, just the
// shared service-account JWT (from quote-calc-sheets) and direct REST via
// fetch. The app does two things in Drive and nothing else:
//   1. CREATE one empty subfolder per quote (a metadata-only call — no file
//      content is ever uploaded or buffered, so Render's RAM ceiling is safe).
//   2. READ the proofs Janelle uploads into that folder, and stream them
//      through a server proxy (never exposing raw Drive URLs publicly).
//
// Scopes used (set on the JWT in quote-calc-sheets): drive.file for the create,
// drive.readonly for listing/reading Janelle-owned proofs.

import "server-only";
import type { Draft } from "./quote-calc-drafts";
import {
  getGoogleAccessToken,
  getPortalMetaById,
  setDriveFolderId,
} from "./quote-calc-sheets";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const LIST_CACHE_TTL_MS = 60_000;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export type DriveFileKind = "image" | "pdf" | "other";

export function driveFileKind(mimeType: string): DriveFileKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

/** The root `GBJ Quotes` folder under which per-quote subfolders are created. */
export function getQuotesParentFolderId(): string | null {
  const id = process.env.GBJ_QUOTES_DRIVE_PARENT_ID?.trim();
  return id ? id : null;
}

/** Optional: an email to grant Editor on each created subfolder (R3 hardening). */
function getQuotesOwnerEmail(): string | null {
  const email = process.env.GBJ_QUOTES_OWNER_EMAIL?.trim();
  return email ? email : null;
}

export function folderWebLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

async function driveFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getGoogleAccessToken();
  return fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

// --- Create (drive.file) ---

// Create an empty subfolder under `parentId`. Returns the new folder id.
export async function createQuoteSubfolder(parentId: string, name: string): Promise<string> {
  const res = await driveFetch(`/files?fields=id&supportsAllDrives=true`, {
    method: "POST",
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive create-folder failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("Drive create-folder returned no id");
  return data.id;
}

// Best-effort: grant Janelle Editor on a folder the SA created, so she can
// upload into it even if Drive's permission inheritance is flaky on consumer
// accounts. No-op when GBJ_QUOTES_OWNER_EMAIL is unset.
export async function ensureSubfolderShared(folderId: string): Promise<void> {
  const email = getQuotesOwnerEmail();
  if (!email) return;
  const res = await driveFetch(
    `/files/${encodeURIComponent(folderId)}/permissions?sendNotificationEmail=false&fields=id&supportsAllDrives=true`,
    {
      method: "POST",
      body: JSON.stringify({ role: "writer", type: "user", emailAddress: email }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive share-folder failed: ${res.status} ${body.slice(0, 200)}`);
  }
}

// --- List (drive.readonly), cached per folder ---

interface ListCacheEntry {
  files: DriveFile[];
  expiresAt: number;
}
const listCache = new Map<string, ListCacheEntry>();
const inflightList = new Map<string, Promise<DriveFile[]>>();

export async function listFolderFiles(
  folderId: string,
  options?: { force?: boolean },
): Promise<DriveFile[]> {
  const now = Date.now();
  if (!options?.force) {
    const hit = listCache.get(folderId);
    if (hit && hit.expiresAt > now) return hit.files;
  }
  const inflight = inflightList.get(folderId);
  if (inflight) return inflight;

  const p = (async () => {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent("files(id,name,mimeType,modifiedTime)");
    const res = await driveFetch(
      `/files?q=${q}&fields=${fields}&pageSize=1000&orderBy=folder,name` +
        `&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Drive list failed: ${res.status} ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { files?: DriveFile[] };
    const files = (data.files ?? []).filter((f) => f.id && f.name);
    listCache.set(folderId, { files, expiresAt: Date.now() + LIST_CACHE_TTL_MS });
    return files;
  })().finally(() => {
    inflightList.delete(folderId);
  });

  inflightList.set(folderId, p);
  return p;
}

// --- Stream a single file (drive.readonly) ---

export interface DriveStream {
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
  contentLength: string | null;
}

// Streams the raw bytes of a file via alt=media. The caller re-streams the
// body to the client — nothing is buffered in our process.
export async function streamFile(fileId: string): Promise<DriveStream> {
  const res = await driveFetch(
    `/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive stream failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return {
    body: res.body,
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
    contentLength: res.headers.get("content-length"),
  };
}

// --- Orchestration: ensure a quote has its Drive subfolder ---

function quoteFolderName(draft: Draft): string {
  const client = (draft.client.name ?? "").trim();
  const name = (draft.name ?? "").trim() || "Untitled quote";
  return client ? `${client} — ${name}` : name;
}

// Create the per-quote subfolder if the feature is on and the quote doesn't
// already have one, then register its id on the Sheet row. Idempotent via the
// stored folder id. Returns the folder id, or null when the feature is off.
// Throws on a Drive/Sheets error — the caller treats this as best-effort.
export async function ensureQuoteFolder(draft: Draft): Promise<string | null> {
  const parentId = getQuotesParentFolderId();
  if (!parentId) return null; // GBJ_QUOTES_DRIVE_PARENT_ID unset → feature off

  // Read fresh so a stale cache can't trigger a duplicate folder.
  const existing = await getPortalMetaById(draft.id, { force: true });
  if (existing?.driveFolderId) return existing.driveFolderId;

  const folderId = await createQuoteSubfolder(parentId, quoteFolderName(draft));
  try {
    await ensureSubfolderShared(folderId);
  } catch (err) {
    // Sharing is hardening only; the folder already exists.
    console.warn("[drive] ensureSubfolderShared failed (folder still created):", err);
  }
  await setDriveFolderId(draft.id, folderId);
  return folderId;
}
