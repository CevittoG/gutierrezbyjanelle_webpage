// Money helpers shared by the engine and every surface (pure).

/** Round to cents, away from float noise (1.005 → 1.01). */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100;
}

/**
 * The one client-facing money format (§6.3): cents only when the value isn't a
 * whole dollar. `wholeDollars` keeps the old whole-dollar display for quotes
 * converted from the old calculator, so what a client already saw never moves.
 */
export function formatMoney(n: number, opts?: { wholeDollars?: boolean; signed?: boolean }): string {
  const v = opts?.wholeDollars ? Math.round(n) : round2(n);
  const abs = Math.abs(v);
  const cents = !opts?.wholeDollars && Math.round(abs * 100) % 100 !== 0;
  const body = "$" + abs.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  if (v < 0) return "−" + body;
  return opts?.signed && v > 0 ? "+" + body : body;
}

/** Always two decimals (unit prices, admin math). */
export function formatMoney2(n: number): string {
  const v = round2(n);
  const body = "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? "−" + body : body;
}

/** A percentage with at most one decimal ("12%", "9.6%"). */
export function formatPct(n: number): string {
  const v = Math.round(n * 10) / 10;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + "%";
}
