export async function POST(req: Request) {
  const { password } = await req.json();

  if (!process.env.QUOTE_CALC_PASSWORD) {
    return Response.json({ ok: false, error: "Server misconfigured — QUOTE_CALC_PASSWORD not set." }, { status: 500 });
  }

  if (password !== process.env.QUOTE_CALC_PASSWORD) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    "quote_auth=1; Path=/quote-calc; HttpOnly; SameSite=Strict; Max-Age=86400"
  );
  return res;
}
