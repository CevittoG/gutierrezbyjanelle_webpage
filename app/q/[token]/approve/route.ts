// API: POST /q/[token]/approve
// The client approves their proofs. Token-gated exactly like the proof file
// proxy (findByPublicToken + isLinkActive) — no admin cookie, since this lives
// outside /quote-calc. Records the typed name + timestamp and auto-advances the
// stage (approval → balance). Idempotent: a second submit is a no-op success.
//
// The typed name is the accidental-approval guard (a checkbox alone is too easy
// to hit). It's stored as-is — no content validation, only a non-empty + length
// cap so the confirm action is meaningful.

import { NextResponse } from "next/server";
import { findByPublicToken, isSheetsConfigured, recordApproval } from "@/lib/quote-calc-sheets";
import { isLinkActive, normalizeStage } from "@/lib/quote-calc-portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: { token: string } }) {
  if (!isSheetsConfigured()) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  const { token } = ctx.params;

  const meta = await findByPublicToken(token);
  if (!meta || !isLinkActive(meta)) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let name = "";
  try {
    const body = (await req.json()) as { name?: string };
    name = (body.name ?? "").toString().trim().slice(0, 120);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });

  const stage = normalizeStage(meta.stage);
  if (stage !== "approval") {
    // Already approved/advanced ⇒ idempotent success; otherwise it's not this
    // client's turn to approve.
    if (meta.approvedBy) return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ ok: false, error: "not_awaiting_approval" }, { status: 409 });
  }

  try {
    const ok = await recordApproval(meta.id, name, "approval");
    if (!ok) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[/q/approve] failed", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
