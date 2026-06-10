import {
  buildClearCookieHeader,
  buildSessionCookieHeader,
  DEFAULT_TTL_SECONDS,
  signSession,
} from "@/lib/quote-calc-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";

  if (!process.env.QUOTE_CALC_PASSWORD) {
    return Response.json(
      { ok: false, error: "Server misconfigured — QUOTE_CALC_PASSWORD not set." },
      { status: 500 },
    );
  }
  if (!process.env.QUOTE_CALC_SESSION_SECRET) {
    return Response.json(
      { ok: false, error: "Server misconfigured — QUOTE_CALC_SESSION_SECRET not set." },
      { status: 500 },
    );
  }

  if (password !== process.env.QUOTE_CALC_PASSWORD) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let signed: ReturnType<typeof signSession>;
  try {
    signed = signSession(DEFAULT_TTL_SECONDS);
  } catch (err) {
    console.warn("[/api/quote-auth] signing failed", err);
    return Response.json(
      { ok: false, error: "Server misconfigured — session secret invalid." },
      { status: 500 },
    );
  }

  const res = Response.json({ ok: true, expSeconds: signed.expSeconds });
  res.headers.set("Set-Cookie", buildSessionCookieHeader(signed.value, DEFAULT_TTL_SECONDS));
  return res;
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", buildClearCookieHeader());
  return res;
}
