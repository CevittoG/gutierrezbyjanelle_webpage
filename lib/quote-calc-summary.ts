// Human-readable summary of a v5 quote for the Quotes tab (column I), priced
// line by line so Janelle can read a quote straight from the Sheet
// (docs/quote-builder-redesign.md §5.6). Pure function, no IO.

import { formatMoney, formatMoney2 } from "./money";
import { computeTotals, lineTotal, quoteDisplayName, type QuoteTotals } from "./quote-engine";
import type { DraftConfigV5, QuoteLineV5 } from "./quote-types";

export { quoteDisplayName };

function linePriced(l: QuoteLineV5, reusePct: number, money: (n: number) => string): string {
  const t = lineTotal(l, reusePct, (n) => n);
  const opts = l.options.length > 0 ? ` (${l.options.map((o) => o.name).join(", ")})` : "";
  if (l.kind === "product" && l.digital) return `${l.name}${opts}: digital file = ${money(t.total)}`;
  const qty = l.qty === 1 && (l.includes?.length || l.system) ? "" : `${l.qty} × ${formatMoney2(l.unitPrice)}`;
  const design = t.design > 0 ? ` + ${formatMoney(t.design)} design${l.reuseDesign ? " (reused)" : ""}` : "";
  const detail = l.detail ? ` [${l.detail}]` : "";
  const math = qty || design ? `${qty}${design} = ` : "";
  return `${l.name}${detail}${opts}: ${math.replace(/^ \+ /, "")}${money(t.total)}`;
}

export function summarizeLinesV5(config: DraftConfigV5, totals: QuoteTotals = computeTotals(config)): string {
  const money = (n: number) => formatMoney(n, { wholeDollars: !!config.legacy });
  const out: string[] = [];
  const grouped = new Set<string>();

  for (const g of totals.groups) {
    const members = config.lines.filter((l) => l.groupId === g.id);
    members.forEach((l) => grouped.add(l.id));
    out.push(`${g.name}: ${money(g.subtotal)}`);
    for (const l of members) out.push(`  • ${linePriced(l, config.reuseDesignPct, money)}`);
    if (g.savings > 0) out.push(`  Suite savings (${g.bundlePct}%): −${money(g.savings)}`);
  }
  for (const l of config.lines) {
    if (!grouped.has(l.id)) out.push(linePriced(l, config.reuseDesignPct, money));
  }
  const s = totals.services;
  if (s.revisions > 0) out.push(`Extra revision rounds ×${config.services.extraRevisions}: ${money(s.revisions)}`);
  if (s.license > 0) out.push(`File license: ${money(s.license)}`);
  if (s.packaging > 0) out.push(`Packaging & handling: ${money(s.packaging)}`);
  if (totals.discount) out.push(`${totals.discount.label}: −${money(totals.discount.amount)}`);
  if (totals.rush) out.push(`${totals.rush.label}: +${money(totals.rush.amount)}`);
  if (totals.adjustment) out.push(`${totals.adjustment.label}: ${formatMoney(totals.adjustment.amount, { signed: true, wholeDollars: !!config.legacy })}`);
  if (totals.shipping !== null) out.push(`Shipping: ${money(totals.shipping)}`);
  if (config.legacy) out.push("(Converted from the old calculator; totals preserved.)");
  return out.join("\n");
}
