"use client";

// "Show math" (collapsed): the formula behind every figure, for checking a
// quote. Replaces the old cost-accounting BreakdownPanel. Admin only.

import { formatMoney2, formatPct } from "@/lib/money";
import type { QuoteTotals } from "@/lib/quote-engine";
import type { DraftConfigV5 } from "@/lib/quote-types";

export function ShowMath({ config, totals }: { config: DraftConfigV5; totals: QuoteTotals }) {
  const byId = new Map(totals.lines.map((l) => [l.id, l]));
  const m = formatMoney2;
  return (
    <details className="text-xs">
      <summary className="flex min-h-[44px] cursor-pointer select-none items-center text-muted-foreground hover:text-foreground">
        Show math
      </summary>
      <ul className="mt-1 space-y-1.5 font-mono tabular-nums text-[11px] leading-relaxed">
        {config.lines.map((l) => {
          const t = byId.get(l.id);
          if (!t) return null;
          const perPiece = l.options.filter((o) => o.kind === "per-piece").reduce((s, o) => s + o.amount, 0);
          const parts =
            l.kind === "product" && l.digital
              ? [`${m(l.unitPrice)} file`]
              : [`${l.qty} × ${m(l.unitPrice)}${perPiece ? ` + ${m(perPiece)}` : ""} = ${m(t.pieces)}`];
          if (t.options) parts.push(`options ${m(t.options)}`);
          if (t.design) parts.push(`design ${m(t.design)}${l.reuseDesign ? ` (${formatPct(config.reuseDesignPct)})` : ""}`);
          return (
            <li key={l.id} className="break-words">
              <span className="font-anybody normal-case">{l.name || "Custom item"}</span>: {parts.join(" + ")} → {m(t.total)}
            </li>
          );
        })}
        {totals.groups.map((g) => (
          <li key={g.id}>
            <span className="font-anybody normal-case">{g.name}</span>: {m(g.subtotal)} × {formatPct(g.bundlePct)} = −{m(g.savings)}
          </li>
        ))}
        <li>items {m(totals.itemsSubtotal)} − suite savings {m(totals.bundleSavings)} + services {m(totals.services.total)} = base {m(totals.base)}</li>
        {totals.discount && <li>discount: {totals.discount.label} = −{m(totals.discount.amount)}</li>}
        {totals.rush && <li>rush: ({m(totals.base)} − {m(totals.discount?.amount ?? 0)}) × {formatPct(totals.rush.pct)} = {m(totals.rush.amount)}</li>}
        {totals.adjustment && <li>adjustment: {m(totals.adjustment.amount)}</li>}
        {totals.shipping !== null && <li>shipping: {m(totals.shipping)}</li>}
        <li className="text-foreground">total {m(totals.total)}</li>
      </ul>
    </details>
  );
}
