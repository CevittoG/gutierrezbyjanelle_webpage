// API: POST /quote-calc/api/portal/[id]/revoke
// Revoke a quote's public link (sets link status = revoked). Cookie-gated.
// The token row is kept so the same link can't be reactivated by accident —
// regenerating issues a brand-new token.

import { NextResponse } from "next/server";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, revokePublicLink } from "@/lib/quote-calc-sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  if (!isQuoteAuthValid()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSheetsConfigured()) {
    return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 503 });
  }
  const { id } = ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  try {
    const found = await revokePublicLink(id);
    if (!found) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[/quote-calc/api/portal/revoke] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
