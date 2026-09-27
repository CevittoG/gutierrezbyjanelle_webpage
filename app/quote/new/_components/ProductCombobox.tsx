"use client";

// "Add from price book": a searchable combobox over active, priced products,
// grouped by category, showing price and unit. Replaces the old <select>.
// ARIA combobox + listbox; ↑/↓ to move, Enter to add, Esc to close.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { formatMoney2 } from "@/lib/money";
import { pickableProducts, type PriceBook, type Product } from "@/lib/quote-pricebook";
import { cn } from "@/utils";

function unitLabel(p: Product): string {
  const parts = [`${formatMoney2(p.price ?? 0)} / pc`];
  if (p.designFee > 0) parts.push(`+ ${formatMoney2(p.designFee)} design`);
  return parts.join(" ");
}

export function ProductCombobox({
  priceBook,
  onPick,
  label = "Add from price book",
  compact,
}: {
  priceBook: PriceBook;
  onPick: (p: Product) => void;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pickableProducts(priceBook).filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.id.includes(q),
    );
  }, [priceBook, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of results) map.set(p.category, [...(map.get(p.category) ?? []), p]);
    return Array.from(map.entries());
  }, [results]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(p: Product) {
    onPick(p);
    setQuery("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={cn(
          "h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors",
          compact && "px-3 text-muted-foreground",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden /> {label}
      </button>
    );
  }

  let flatIndex = -1;
  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
          aria-label={label}
          placeholder="Search products or categories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(results.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (results[active]) pick(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-base focus:outline-none"
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Products"
        className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-border bg-card py-1 shadow-[0_6px_18px_-8px_hsl(var(--accent)/0.5)]"
      >
        {results.length === 0 && (
          <li className="px-3 py-3 text-sm text-muted-foreground">No product matches. Add a custom line instead.</li>
        )}
        {grouped.map(([category, products]) => (
          <li key={category} role="presentation">
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{category}</p>
            <ul role="presentation">
              {products.map((p) => {
                flatIndex++;
                const i = flatIndex;
                return (
                  <li
                    key={p.id}
                    id={`${listId}-${p.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(p);
                    }}
                    className={cn(
                      "flex min-h-[44px] cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm",
                      i === active && "bg-muted",
                    )}
                  >
                    <span className="min-w-0 break-words">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {unitLabel(p)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
