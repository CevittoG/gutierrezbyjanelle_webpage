"use client";

import { Trash2 } from "lucide-react";
import { MiscAddOn, newId } from "@/lib/quote-calc-drafts";
import { fmt$ } from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface Props {
  items: MiscAddOn[];
  onChange: (next: MiscAddOn[]) => void;
}

export function MiscAddOnSection({ items, onChange }: Props) {
  function patch(id: string, fields: Partial<MiscAddOn>) {
    onChange(items.map((m) => (m.id === id ? { ...m, ...fields } : m)));
  }

  function add() {
    onChange([
      ...items,
      { id: newId(), label: "", qty: 1, unitPrice: 0 },
    ]);
  }

  function remove(id: string) {
    onChange(items.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        One-off requests outside the standard catalog. Enter the selling price per unit — added to the
        client total as-is, with no markup.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No custom items yet — tap "Add custom item" to include a special request.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const rowTotal = Math.max(0, m.qty) * Math.max(0, m.unitPrice);
            return (
              <div
                key={m.id}
                className="rounded-lg border border-border bg-card p-3 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={m.label}
                    placeholder="e.g. Hand-tied ribbons"
                    onChange={(e) => patch(m.id, { label: e.target.value })}
                    className="flex-1 h-11 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Custom item name"
                  />
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    aria-label="Remove custom item"
                    className="h-11 w-11 rounded-md hover:bg-muted text-muted-foreground hover:text-red-700 flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => patch(m.id, { qty: Math.max(0, m.qty - 1) })}
                      disabled={m.qty <= 0}
                      aria-label="Decrease quantity"
                      className="h-11 w-11 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={9999}
                      value={m.qty}
                      onChange={(e) => patch(m.id, { qty: Math.max(0, parseInt(e.target.value) || 0) })}
                      aria-label="Quantity"
                      className="h-11 w-20 rounded-lg border border-border bg-background px-2 text-center text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => patch(m.id, { qty: m.qty + 1 })}
                      aria-label="Increase quantity"
                      className="h-11 w-11 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      value={m.unitPrice}
                      onChange={(e) => patch(m.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                      aria-label="Unit price"
                      className="h-11 w-24 rounded-lg border border-border bg-background px-2 text-right text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">per unit</span>
                  </div>

                  <div className="text-right shrink-0 min-w-[5rem]">
                    <p className={cn(
                      "text-sm font-mono tabular-nums font-medium",
                      rowTotal > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {fmt$(Math.round(rowTotal))}
                    </p>
                    <p className="text-xs text-muted-foreground">subtotal</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="w-full h-11 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
      >
        + Add custom item
      </button>
    </div>
  );
}
