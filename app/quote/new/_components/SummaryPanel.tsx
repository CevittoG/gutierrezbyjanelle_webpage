"use client";

// The builder's summary (§9.2 ⑥). Top: the client view, rendered from the
// same projector and list as /q, so what Janelle sees is what the client
// gets. Then "Set total…", the health card, "Show math", and the copyable
// client summary with truthful percentages.

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { InvestmentList } from "@/components/quote-app/InvestmentList";
import { HealthCard } from "@/components/quote-app/HealthCard";
import { formatMoney } from "@/lib/money";
import type { QuoteTotals } from "@/lib/quote-engine";
import type { QuoteHealth } from "@/lib/quote-health";
import type { PublicQuote } from "@/lib/quote-calc-portal";
import type { DraftConfigV5, HealthSnapshot } from "@/lib/quote-types";
import { SetTotalDialog } from "./SetTotalDialog";
import { ShowMath } from "./ShowMath";

export function clientSummaryText(q: PublicQuote): string {
  const money = (n: number) => formatMoney(n, { wholeDollars: q.wholeDollars });
  const out: string[] = [`${siteConfig.name} · Quote${q.clientName ? ` for ${q.clientName}` : ""}`, q.title, ""];
  for (const g of q.groups) {
    out.push(`${g.name}: ${money(g.subtotal)}`);
    for (const p of g.pieces) out.push(`  · ${p.name}${p.qty !== null ? ` × ${p.qty}` : " (digital file)"}`);
    if (g.savings > 0) out.push(`  Suite savings (${g.savingsPct}%): −${money(g.savings)}`);
  }
  for (const x of q.extras) out.push(`${x.name}${x.qty !== null ? ` × ${x.qty}` : ""}: ${money(x.price)}`);
  for (const s of q.services) out.push(`${s.label}: ${money(s.price)}`);
  if (q.discount) out.push(`${q.discount.label}: −${money(q.discount.amount)}`);
  if (q.rush) out.push(`${q.rush.label}: +${money(q.rush.amount)}`);
  if (q.adjustment) out.push(`${q.adjustment.label}: ${formatMoney(q.adjustment.amount, { signed: true, wholeDollars: q.wholeDollars })}`);
  if (q.shipping !== null) out.push(`Shipping: ${money(q.shipping)}`);
  out.push("", `Total: ${money(q.total)}`);
  if (q.depositExpected > 0) out.push(`Deposit to begin: ${money(q.depositExpected)}`);
  if (q.shipping === null && q.anyPhysical) out.push("Shipping is added later, from the carrier quote.");
  out.push("", `${siteConfig.name}`);
  return out.join("\n");
}

export function SummaryPanel({
  quote,
  totals,
  health,
  config,
  healthFallback,
  onConfig,
}: {
  quote: PublicQuote;
  totals: QuoteTotals;
  health: QuoteHealth;
  config: DraftConfigV5;
  healthFallback: HealthSnapshot;
  onConfig: (next: DraftConfigV5) => void;
}) {
  const [setting, setSetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const money = (n: number) => formatMoney(n, { wholeDollars: quote.wholeDollars });

  function copy() {
    void navigator.clipboard.writeText(clientSummaryText(quote)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="space-y-5 normal-case tracking-normal">
      <section aria-labelledby="client-view-heading">
        <p id="client-view-heading" className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Client view
        </p>
        <InvestmentList quote={quote} compact />
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
          <span className="font-squarepeg text-5xl leading-none tabular-nums whitespace-nowrap">{money(totals.total)}</span>
        </div>
        {quote.depositExpected > 0 && (
          <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
            Deposit {money(quote.depositExpected)} · balance {money(Math.max(totals.total - quote.depositExpected, 0))}
          </p>
        )}
        {quote.shipping === null && quote.anyPhysical && (
          <p className="mt-1 text-right text-xs text-muted-foreground">Shipping added later</p>
        )}
        <div className="mt-3">
          {setting ? (
            <SetTotalDialog config={config} healthFallback={healthFallback} onApply={onConfig} onClose={() => setSetting(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setSetting(true)}
              className="h-11 w-full rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
            >
              Set total…
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="health-heading" className="border-t border-border pt-4">
        <p id="health-heading" className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Health · only you see this
        </p>
        <HealthCard health={health} />
        <ShowMath config={config} totals={totals} />
      </section>

      <button
        type="button"
        onClick={copy}
        className="h-11 w-full rounded-md border border-border text-sm hover:bg-muted transition-colors"
      >
        {copied ? "Copied" : "Copy client summary"}
      </button>
    </div>
  );
}
