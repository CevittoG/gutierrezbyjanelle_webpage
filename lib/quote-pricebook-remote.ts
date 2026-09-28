// Client-only wrapper around GET /quote-calc/api/pricebook, with a
// last-good cache in localStorage (docs/quote-builder-redesign.md §9.2 "Price
// book load states"): a Sheet failure falls back to the cached copy, and with
// no cache to the bundled seed. Saved quotes never depend on this — their
// prices are frozen on the quote.

import type { RemoteFailure, RemoteResult } from "./quote-calc-drafts-remote";
import { DEFAULT_PRICE_BOOK, type MergedPriceBook, type PriceBook } from "./quote-pricebook";

const CACHE_KEY = "quote-pricebook-cache";

export interface PriceBookLoad {
  merged: MergedPriceBook;
  loadedAt: string;
}

async function safeFetch(input: RequestInfo, init?: RequestInit): Promise<Response | RemoteFailure> {
  try {
    return await fetch(input, init);
  } catch {
    return { kind: "network" };
  }
}

function classify(res: Response): RemoteFailure {
  if (res.status === 401) return { kind: "unauthorized" };
  if (res.status === 503) return { kind: "unconfigured" };
  return { kind: "server" };
}

export async function fetchPriceBook(opts?: { refresh?: boolean }): Promise<RemoteResult<PriceBookLoad>> {
  const url = opts?.refresh ? "/quote-calc/api/pricebook?refresh=1" : "/quote-calc/api/pricebook";
  const r = await safeFetch(url, { credentials: "same-origin", cache: "no-store" });
  if ("kind" in r) return { ok: false, failure: r };
  if (!r.ok) return { ok: false, failure: classify(r) };
  try {
    const body = (await r.json()) as { ok?: boolean; merged?: MergedPriceBook; loadedAt?: string };
    if (!body.ok || !body.merged) return { ok: false, failure: { kind: "server" } };
    const load = { merged: body.merged, loadedAt: body.loadedAt ?? new Date().toISOString() };
    saveCachedPriceBook(load);
    return { ok: true, value: load };
  } catch {
    return { ok: false, failure: { kind: "server" } };
  }
}

export function loadCachedPriceBook(): { priceBook: PriceBook; loadedAt: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PriceBookLoad;
    if (!parsed?.merged?.priceBook?.products) return null;
    return { priceBook: parsed.merged.priceBook, loadedAt: parsed.loadedAt };
  } catch {
    return null;
  }
}

function saveCachedPriceBook(load: PriceBookLoad): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(load));
  } catch {
    // storage full or blocked: the in-memory copy still works
  }
}

export function bundledPriceBook(): PriceBook {
  return DEFAULT_PRICE_BOOK;
}

export interface SeedResult {
  created: string[];
  seeded: string[];
  settingsAppended: string[];
  skipped: string[];
}

export async function seedPriceBook(): Promise<RemoteResult<SeedResult>> {
  const r = await safeFetch("/quote-calc/api/pricebook/seed", { method: "POST", credentials: "same-origin" });
  if ("kind" in r) return { ok: false, failure: r };
  if (!r.ok) return { ok: false, failure: classify(r) };
  try {
    const body = (await r.json()) as { ok?: boolean; report?: SeedResult };
    if (!body.ok || !body.report) return { ok: false, failure: { kind: "server" } };
    return { ok: true, value: body.report };
  } catch {
    return { ok: false, failure: { kind: "server" } };
  }
}
