// API: POST /quote-calc/api/drafts/freeze → one-time batch conversion of every
// pre-v5 quote to v5 (docs/quote-builder-redesign.md §8.5). Idempotent; reports
// { converted, skipped, parityFailures, unreadable, dashboardCorrections }.
// Run by Janelle once after deploy, after recording a few client-link totals.

import { NextResponse } from "next/server";
import { freezeLegacyDrafts, isSheetsConfigured } from "@/lib/quote-calc-sheets";
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
    const report = await freezeLegacyDrafts();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.warn("[/quote-calc/api/drafts/freeze POST] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
