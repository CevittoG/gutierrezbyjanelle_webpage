// API: POST /quote-calc/api/pricebook/seed → one-time creation of the
// Products / Options / Packages tabs from the bundled seed, plus any missing
// Settings keys. Never overwrites a tab that has rows or a key that exists, so
// running it twice is a no-op. Triggered by Janelle from the Price book page.

import { NextResponse } from "next/server";
import { isSheetsConfigured, seedPriceBookTabs } from "@/lib/quote-calc-sheets";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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
    const report = await seedPriceBookTabs();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.warn("[/quote-calc/api/pricebook/seed POST] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
