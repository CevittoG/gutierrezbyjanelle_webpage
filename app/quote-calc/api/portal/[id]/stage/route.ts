// API: POST /quote-calc/api/portal/[id]/stage
// Set a quote's lifecycle stage (column S). Cookie-gated — Janelle drives the
// project forward from the Profile Overview page. The stage also derives the
// client-facing deposit/balance "paid" status, so advancing it is how a payment
// received offline gets reflected on the client portal.

import { NextResponse } from "next/server";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, setProjectStage } from "@/lib/quote-calc-sheets";
import { STAGE_ORDER, type ProjectStage } from "@/lib/quote-calc-portal";

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

  let stage = "";
  try {
    const body = (await req.json()) as { stage?: string };
    stage = (body.stage ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!(STAGE_ORDER as string[]).includes(stage)) {
    return NextResponse.json({ ok: false, error: "invalid_stage" }, { status: 400 });
  }

  try {
    const found = await setProjectStage(id, stage as ProjectStage);
    if (!found) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, stage });
  } catch (err) {
    console.warn("[/quote-calc/api/portal/stage] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
