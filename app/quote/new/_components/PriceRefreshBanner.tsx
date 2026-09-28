"use client";

// §8.3: a saved quote keeps the prices it was quoted at. When the price book
// has moved since, this says so and lets Janelle apply changes selectively.
// Never automatic.

import { useState } from "react";
import { formatMoney2 } from "@/lib/money";
import type { PriceChange } from "@/lib/quote-engine";

function day(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? "" : t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PriceRefreshBanner({
  changes,
  pricedAt,
  onApply,
}: {
  changes: PriceChange[];
  pricedAt: string;
  onApply: (selected: PriceChange[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(changes.map((c) => c.key)));
  if (changes.length === 0) return null;
  const when = day(pricedAt);
  return (
    <div className="rounded-lg border border-border bg-card p-4" role="status">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 min-w-[14rem] text-sm">
          <span aria-hidden className="font-medium">! </span>
          {changes.length} price{changes.length === 1 ? "" : "s"} changed since this quote was priced
          {when ? ` (${when})` : ""}. The quote keeps its prices until you apply them.
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="h-11 px-4 rounded-md border border-border text-sm hover:bg-muted"
        >
          {open ? "Hide" : "Review"}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <ul className="space-y-1">
            {changes.map((c) => (
              <li key={c.key}>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-foreground"
                    checked={picked.has(c.key)}
                    onChange={(e) => {
                      const next = new Set(picked);
                      if (e.target.checked) next.add(c.key);
                      else next.delete(c.key);
                      setPicked(next);
                    }}
                  />
                  <span className="min-w-0 flex-1 break-words">
                    {c.lineName}
                    <span className="text-muted-foreground">
                      {" "}
                      · {c.field === "designFee" ? "design fee" : c.field === "option" ? "option" : "price"}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums whitespace-nowrap text-xs">
                    {formatMoney2(c.from)} → {formatMoney2(c.to)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={picked.size === 0}
            onClick={() => onApply(changes.filter((c) => picked.has(c.key)))}
            className="h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:bg-ring transition-colors disabled:opacity-50"
          >
            Apply {picked.size} change{picked.size === 1 ? "" : "s"}
          </button>
        </div>
      )}
    </div>
  );
}
