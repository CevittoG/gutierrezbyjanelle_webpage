// API: GET /quote-calc/api/config  → returns the merged Settings + Items
// payload from the Google Sheet (Phase 1 of docs/quote-calc-roadmap.md).
//
// `?refresh=1` bypasses the module-level cache so a manual reload picks up
// edits Janelle just made in the Sheet without waiting for the TTL.

import { NextRequest, NextResponse } from "next/server";
import {
  isSheetsConfigured,
  listConfig,
} from "@/lib/quote-calc-sheets";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

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
    const config = await listConfig({ force });
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.warn("[/quote-calc/api/config GET] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
