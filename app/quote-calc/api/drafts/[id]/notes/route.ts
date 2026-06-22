// API: POST /quote-calc/api/drafts/[id]/notes
// Update a quote's private hidden notes (admin-only). Cookie-gated. Writes the
// readable column K and the _data Draft JSON; touches no other draft field.

import { NextResponse } from "next/server";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, updateHiddenNotes } from "@/lib/quote-calc-sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  if (!isQuoteAuthValid()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSheetsConfigured()) {
    return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 503 });
  }
  const { id } = ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  let notes = "";
  try {
    const body = (await req.json()) as { notes?: string };
    notes = (body.notes ?? "").toString().slice(0, 5000);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const found = await updateHiddenNotes(id, notes);
    if (!found) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts/notes] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
