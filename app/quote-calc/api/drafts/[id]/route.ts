// API: DELETE /quote-calc/api/drafts/[id]  → soft-archive a draft (sets status=archived)
//
// Mounted under /quote-calc so the auth cookie (Path=/quote-calc) is sent.

import { NextResponse } from "next/server";
import { archiveDraftRow, isSheetsConfigured } from "@/lib/quote-calc-sheets";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  if (!isQuoteAuthValid()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Sheets not configured", reason: "unconfigured" },
      { status: 503 },
    );
  }
  const { id } = ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  try {
    const found = await archiveDraftRow(id);
    return NextResponse.json({ ok: true, found });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts DELETE] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
