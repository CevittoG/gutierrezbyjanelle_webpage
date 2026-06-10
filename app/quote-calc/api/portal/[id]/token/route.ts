// API: POST /quote-calc/api/portal/[id]/token
// Generate (or regenerate) a quote's public link: writes a fresh 128-bit token,
// sets link status = active. Cookie-gated (Path=/quote-calc).

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { activatePublicLink, isSheetsConfigured } from "@/lib/quote-calc-sheets";

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

  const token = randomBytes(16).toString("base64url"); // 128-bit, URL-safe
  try {
    const found = await activatePublicLink(id, token);
    if (!found) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    console.warn("[/quote-calc/api/portal/token] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
