// Client-only wrapper around GET /quote-calc/api/config.
//
// Mirrors the RemoteResult shape used by quote-calc-drafts-remote.ts so the
// calculator can treat config and drafts the same way: degrade gracefully,
// surface state without crashing.

import type { RemoteConfig } from "./quote-calc-config";
import type { RemoteFailure, RemoteResult } from "./quote-calc-drafts-remote";

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

export async function fetchRemoteConfig(opts?: {
  refresh?: boolean;
}): Promise<RemoteResult<RemoteConfig>> {
  const url = opts?.refresh
    ? "/quote-calc/api/config?refresh=1"
    : "/quote-calc/api/config";
  const r = await safeFetch(url, { credentials: "same-origin", cache: "no-store" });
  if ("kind" in r) return { ok: false, failure: r };
  if (!r.ok) return { ok: false, failure: classify(r) };
  try {
    const body = (await r.json()) as { ok?: boolean; config?: RemoteConfig };
    if (!body.ok || !body.config) return { ok: false, failure: { kind: "server" } };
    return { ok: true, value: body.config };
  } catch {
    return { ok: false, failure: { kind: "server" } };
  }
}
