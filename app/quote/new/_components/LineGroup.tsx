"use client";

// A package on the quote: an editable template (§4 decision 3). The header
// carries the suite name (Square Peg), the true bundle % ("Suite savings"),
// the subtotal and ≈ $ per household for competitor comparison; every piece
// below is an ordinary, editable line.

import { X } from "lucide-react";
import { formatMoney, formatMoney2 } from "@/lib/money";
import { addProduct, removeGroup, type GroupTotal, type QuoteTotals } from "@/lib/quote-engine";
import type { PriceBook } from "@/lib/quote-pricebook";
import type { DraftConfigV5, QuoteGroup } from "@/lib/quote-types";
import { NumberField } from "./fields";
import { LineRow, type Apply } from "./LineRow";
import { ProductCombobox } from "./ProductCombobox";

export function LineGroup({
  group,
  groupTotal,
  totals,
  config,
  priceBook,
  apply,
  wholeDollars,
}: {
  group: QuoteGroup;
  groupTotal: GroupTotal | undefined;
  totals: QuoteTotals;
  config: DraftConfigV5;
  priceBook: PriceBook;
  apply: Apply;
  wholeDollars: boolean;
}) {
  const lines = config.lines.filter((l) => l.groupId === group.id);
  const lineTotal = new Map(totals.lines.map((l) => [l.id, l]));
  const subtotal = groupTotal?.subtotal ?? 0;
  const net = subtotal - (groupTotal?.savings ?? 0);
  const money = (n: number) => formatMoney(n, { wholeDollars });
  const setGroup = (patch: Partial<QuoteGroup>) =>
    apply((c) => ({ ...c, groups: c.groups.map((g) => (g.id === group.id ? { ...g, ...patch } : g)) }));

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            value={group.name}
            onChange={(e) => setGroup({ name: e.target.value })}
            aria-label="Suite name"
            className="h-11 w-full rounded-md border border-transparent bg-transparent px-2 -mx-2 font-squarepeg text-3xl leading-none hover:border-border focus:border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            {config.households} households
            {config.households > 0 && net > 0 && (
              <> · ≈ {formatMoney2(net / config.households)} per household</>
            )}
          </p>
        </div>
        <span className="pt-2.5 font-mono text-sm tabular-nums whitespace-nowrap">{money(subtotal)}</span>
        <button
          type="button"
          onClick={() => apply((c) => removeGroup(c, group.id))}
          aria-label={`Remove ${group.name} and its pieces`}
          title="Remove the suite and its pieces"
          className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <ul className="mt-2 divide-y divide-border/70">
        {lines.map((l) => (
          <LineRow
            key={l.id}
            line={l}
            total={lineTotal.get(l.id)}
            config={config}
            priceBook={priceBook}
            groups={config.groups}
            apply={apply}
            wholeDollars={wholeDollars}
          />
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <ProductCombobox
          priceBook={priceBook}
          label="Add a piece"
          compact
          onPick={(p) => apply((c) => addProduct(c, p, { groupId: group.id }))}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Suite savings</span>
          <NumberField
            label={`Suite savings percent for ${group.name}`}
            value={group.bundlePct}
            decimals={1}
            suffix="%"
            onChange={(n) => setGroup({ bundlePct: Math.min(100, n) })}
            className="w-24"
          />
          {(groupTotal?.savings ?? 0) > 0 && (
            <span className="font-mono text-sm tabular-nums whitespace-nowrap text-muted-foreground">
              −{money(groupTotal!.savings)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
