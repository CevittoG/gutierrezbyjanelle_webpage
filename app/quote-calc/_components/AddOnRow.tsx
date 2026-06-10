"use client";

import { AddOnResult, CatalogItem, fmt$, getItemQty } from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface Props {
  item: CatalogItem;
  qty: number;
  packageQty: number;
  preview: AddOnResult;
  onChange: (qty: number) => void;
  catalog?: CatalogItem[];
}

const STEP = 1;
const MAX = 9999;

export function AddOnRow({ item, qty, packageQty, preview, onChange, catalog }: Props) {
  const isSelected = qty > 0;
  const suggested = getItemQty(item.key, packageQty, catalog);

  function set(next: number) {
    onChange(Math.max(0, Math.min(MAX, Math.round(next))));
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isSelected ? "border-foreground/40 bg-muted" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{item.label}</p>
          {item.notes && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-mono tabular-nums font-medium">
            {isSelected ? fmt$(Math.round(preview.price)) : "—"}
          </p>
          {isSelected && (
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              {qty} {qty === 1 ? "piece" : "pieces"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <button
          type="button"
          onClick={() => set(suggested)}
          disabled={suggested === qty || suggested === 0}
          className={cn(
            "text-xs rounded-full px-3 py-1 border transition-colors",
            "border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          title={`Suggested for ${packageQty} households`}
        >
          Suggest {suggested}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => set(qty - STEP)}
            disabled={qty === 0}
            aria-label="Decrease quantity"
            className="h-11 w-11 rounded-full border border-border flex items-center justify-center text-base hover:bg-muted disabled:opacity-30 transition-colors"
          >
            -
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX}
            step={STEP}
            value={qty}
            onChange={(e) => set(parseInt(e.target.value) || 0)}
            aria-label={`${item.label} quantity`}
            className="h-11 w-20 rounded-lg border border-border bg-background px-2 text-center text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => set(qty + STEP)}
            aria-label="Increase quantity"
            className="h-11 w-11 rounded-full border border-border flex items-center justify-center text-base hover:bg-muted transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
