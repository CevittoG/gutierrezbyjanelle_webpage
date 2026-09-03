// API: POST /quote-calc/api/drafts/[id]/restore  → un-archive a draft (status=active)
//
// The mirror of the DELETE handler one level up. Deletion on the dashboard is a
// soft archive, so this is what makes it reversible.

import { NextResponse } from "next/server";
import { isSheetsConfigured, restoreDraftRow } from "@/lib/quote-calc-sheets";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

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
  const { id } = ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  try {
    const found = await restoreDraftRow(id);
    return NextResponse.json({ ok: true, found });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts/[id]/restore POST] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
