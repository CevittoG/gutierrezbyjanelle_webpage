// API: POST /quote-calc/api/portal/[id]/deposit
// Record how much of the deposit a client has paid (column U). Cookie-gated —
// there are no online payments, so Janelle enters the amount she received. The
// value drives the deposit-paid / balance-remaining figures on the client portal.

import { NextResponse } from "next/server";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, setDepositPaid } from "@/lib/quote-calc-sheets";

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

  let amount = 0;
  try {
    const body = (await req.json()) as { amount?: number | string };
    amount = Math.max(Number(body.amount) || 0, 0);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const found = await setDepositPaid(id, amount);
    if (!found) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, amount });
  } catch (err) {
    console.warn("[/quote-calc/api/portal/deposit] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
