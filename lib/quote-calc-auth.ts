// Server-only session helpers for the /quote-calc gate.
//
// The legacy cookie was a constant (`quote_auth=1`), trivially forgeable by
// anyone sending `Cookie: quote_auth=1`. This module replaces it with a
// self-verifying signed cookie:
//
//   value = base64url(payload) + "." + base64url(hmac_sha256(secret, payload))
//   payload = { exp: <unix-seconds> }
//
// Verification is HMAC + expiry check, in constant time. No server-side
// session store — Render is stateless.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const QUOTE_AUTH_COOKIE = "quote_auth";
// Site-wide path: the gated tools now live across /quotes, /quote/new and the
// /quote-calc/api routes, so the session cookie must be sent to all of them.
// (Was "/quote-calc", which scoped the cookie too narrowly for the new routes.)
export const QUOTE_AUTH_PATH = "/";
export const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h, matches the prior Max-Age

type SessionPayload = { exp: number };

function getSecret(): string {
  const secret = process.env.QUOTE_CALC_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "QUOTE_CALC_SESSION_SECRET is missing or too short (need ≥32 chars).",
    );
  }
  return secret;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payloadB64: string, secret: string): string {
  return b64urlEncode(createHmac("sha256", secret).update(payloadB64).digest());
}

export function signSession(ttlSeconds = DEFAULT_TTL_SECONDS): {
  value: string;
  expSeconds: number;
} {
  const secret = getSecret();
  const expSeconds = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload: SessionPayload = { exp: expSeconds };
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(payloadB64, secret);
  return { value: `${payloadB64}.${sig}`, expSeconds };
}

export function verifySession(raw: string | undefined): boolean {
  if (!raw || typeof raw !== "string") return false;
  const dot = raw.indexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return false;
  const payloadB64 = raw.slice(0, dot);
  const sigB64 = raw.slice(dot + 1);

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }

  const expectedSig = sign(payloadB64, secret);
  const a = Buffer.from(sigB64);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as SessionPayload;
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number") return false;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return false;

  return true;
}

export function isQuoteAuthValid(): boolean {
  return verifySession(cookies().get(QUOTE_AUTH_COOKIE)?.value);
}

export function buildSessionCookieHeader(
  value: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string {
  const flags = [
    `${QUOTE_AUTH_COOKIE}=${value}`,
    `Path=${QUOTE_AUTH_PATH}`,
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${ttlSeconds}`,
  ];
  if (process.env.NODE_ENV === "production") flags.push("Secure");
  return flags.join("; ");
}

export function buildClearCookieHeader(): string {
  const flags = [
    `${QUOTE_AUTH_COOKIE}=`,
    `Path=${QUOTE_AUTH_PATH}`,
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production") flags.push("Secure");
  return flags.join("; ");
}
