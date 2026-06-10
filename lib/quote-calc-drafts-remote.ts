// Client-only wrappers around the /quote-calc/api/drafts/* routes.
//
// All calls fail soft — every helper returns a discriminated result so the UI
// can decide whether to surface "offline · saved locally", "sheet unavailable",
// or just shrug and keep going.

import type { Draft } from "./quote-calc-drafts";
import { normalizeIncomingDraft } from "./quote-calc-drafts";

export type RemoteFailure =
  | { kind: "network" }
  | { kind: "unconfigured" }
  | { kind: "unauthorized" }
  | { kind: "server" };

export type RemoteResult<T> =
  | { ok: true; value: T }
  | { ok: false; failure: RemoteFailure };

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

export async function fetchRemoteDrafts(): Promise<RemoteResult<Draft[]>> {
  const r = await safeFetch("/quote-calc/api/drafts", { credentials: "same-origin" });
  if ("kind" in r) return { ok: false, failure: r };
  if (!r.ok) return { ok: false, failure: classify(r) };
  try {
    const body = (await r.json()) as { ok?: boolean; drafts?: unknown[] };
    if (!body.ok || !Array.isArray(body.drafts)) return { ok: false, failure: { kind: "server" } };
    const drafts: Draft[] = [];
    for (const d of body.drafts) {
      const norm = normalizeIncomingDraft(d);
      if (norm) drafts.push(norm);
    }
    return { ok: true, value: drafts };
  } catch {
    return { ok: false, failure: { kind: "server" } };
  }
}

export async function pushRemoteDraft(draft: Draft): Promise<RemoteResult<true>> {
  const r = await safeFetch("/quote-calc/api/drafts", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if ("kind" in r) return { ok: false, failure: r };
  if (!r.ok) return { ok: false, failure: classify(r) };
  return { ok: true, value: true };
}

export async function archiveRemoteDraft(id: string): Promise<RemoteResult<true>> {
  const r = await safeFetch(`/quote-calc/api/drafts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if ("kind" in r) return { ok: false, failure: r };
  if (!r.ok) return { ok: false, failure: classify(r) };
  return { ok: true, value: true };
}
