"use client";

// Upgrades from the Options tab that apply to this product (appliesTo). A
// chip toggles the option onto the line; the selected state is the Powder
// Rose accent (state only).

import { Check } from "lucide-react";
import { formatMoney2, formatPct } from "@/lib/money";
import type { ProductOption } from "@/lib/quote-pricebook";
import type { LineOption } from "@/lib/quote-types";
import { cn } from "@/utils";

function amountLabel(o: { kind: ProductOption["kind"]; amount: number | null }): string {
  const a = o.amount ?? 0;
  if (o.kind === "percent") return `+${formatPct(a)}`;
  if (o.kind === "per-piece") return `+${formatMoney2(a)}/pc`;
  return `+${formatMoney2(a)}`;
}

export function OptionChips({
  available,
  selected,
  onToggle,
  onRemove,
}: {
  available: ProductOption[];
  selected: LineOption[];
  onToggle: (o: ProductOption) => void;
  onRemove: (id: string) => void;
}) {
  // Options already on the line that the price book no longer offers stay visible.
  const orphans = selected.filter((s) => !available.some((a) => a.id === s.id));
  if (available.length === 0 && orphans.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Options">
      {available.map((o) => {
        const on = selected.find((s) => s.id === o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={!!on}
            onClick={() => onToggle(o)}
            className={cn(
              "h-11 sm:h-9 inline-flex items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
              on ? "border-accent bg-accent-soft text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden />}
            {o.name}
            <span className="tabular-nums">{amountLabel(on ?? o)}</span>
          </button>
        );
      })}
      {orphans.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed
          onClick={() => onRemove(o.id)}
          className="h-11 sm:h-9 inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 text-xs"
          title="No longer in the price book; kept on this quote. Click to remove."
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          {o.name} <span className="tabular-nums">{amountLabel(o)}</span>
        </button>
      ))}
    </div>
  );
}
