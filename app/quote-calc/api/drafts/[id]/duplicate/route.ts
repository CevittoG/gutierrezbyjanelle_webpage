// API: POST /quote-calc/api/drafts/[id]/duplicate → a copy of the quote with a
// fresh id (§10.1): same client, event and lines, stored in the same schema as
// the original (so its total is identical). No portal link, no Drive folder,
// lifecycle back at the start.

import { NextResponse } from "next/server";
import { getStoredDraftById, isSheetsConfigured, upsertDraftRow } from "@/lib/quote-calc-sheets";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { newId, type StoredDraft } from "@/lib/quote-calc-drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  if (!isQuoteAuthValid()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Sheets not configured", reason: "unconfigured" },
      { status: 503 },
    );
  }
  try {
    const original = await getStoredDraftById(ctx.params.id);
    if (!original) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const now = new Date().toISOString();
    const copy: StoredDraft = {
      ...original,
      id: newId(),
      name: `${original.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await upsertDraftRow(copy);
    return NextResponse.json({ ok: true, id: copy.id });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts duplicate] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
