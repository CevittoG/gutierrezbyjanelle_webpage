// API: GET /quote-calc/api/drafts  → list active drafts
// API: POST /quote-calc/api/drafts → upsert a single draft
//
// Mounted under /quote-calc so the auth cookie (Path=/quote-calc) is sent.

import { NextRequest, NextResponse } from "next/server";
import {
  isSheetsConfigured,
  listDrafts,
  upsertDraftRow,
} from "@/lib/quote-calc-sheets";
import { normalizeIncomingDraft } from "@/lib/quote-calc-drafts";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(): NextResponse | null {
  if (!isQuoteAuthValid()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function unconfigured(): NextResponse {
  return NextResponse.json(
    { ok: false, error: "Sheets not configured", reason: "unconfigured" },
    { status: 503 },
  );
}

export async function GET() {
  const fail = checkAuth();
  if (fail) return fail;
  if (!isSheetsConfigured()) return unconfigured();
  try {
    const drafts = await listDrafts();
    return NextResponse.json({ ok: true, drafts });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts GET] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const fail = checkAuth();
  if (fail) return fail;
  if (!isSheetsConfigured()) return unconfigured();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const draft = normalizeIncomingDraft(body);
  if (!draft) {
    return NextResponse.json({ ok: false, error: "invalid_draft" }, { status: 400 });
  }
  try {
    await upsertDraftRow(draft);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts POST] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
