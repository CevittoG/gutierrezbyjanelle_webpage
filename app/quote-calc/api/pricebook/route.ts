// API: GET /quote-calc/api/pricebook → the merged price book (Products,
// Options, Packages, Settings) + warnings naming the tab and row.
// `?refresh=1` bypasses the 60s module cache after a Sheet edit.

import { NextRequest, NextResponse } from "next/server";
import { isSheetsConfigured, listPriceBook } from "@/lib/quote-calc-sheets";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { mergePriceBook } from "@/lib/quote-pricebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isQuoteAuthValid()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Sheets not configured", reason: "unconfigured" },
      { status: 503 },
    );
  }
  const force = req.nextUrl.searchParams.get("refresh") === "1";
  try {
    const merged = mergePriceBook(await listPriceBook({ force }));
    return NextResponse.json({ ok: true, merged, loadedAt: new Date().toISOString() });
  } catch (err) {
    console.warn("[/quote-calc/api/pricebook GET] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
