"use client";

// One invoice-style line (§9.2 ③): name, qty (🔗 linked to the guest count or
// typed), unit price (with a "custom" badge against the price-book price),
// design fee + per-line "Reuse design", option chips, physical/digital, the
// line total, and a ⋯ menu. Names wrap; money never does.

import { useEffect, useRef, useState } from "react";
import { Link2, Link2Off, MoreHorizontal, RotateCcw } from "lucide-react";
import { formatMoney, formatMoney2, formatPct } from "@/lib/money";
import {
  duplicateLine,
  moveLineToGroup,
  relinkLine,
  removeLine,
  setLineDigital,
  setLineQty,
  toggleOption,
  updateLine,
  type LineTotal,
} from "@/lib/quote-engine";
import { findProduct, optionsFor, type PriceBook } from "@/lib/quote-pricebook";
import { OptionChips } from "./OptionChips";
import type { DraftConfigV5, QuoteGroup, QuoteLineV5 } from "@/lib/quote-types";
import { cn } from "@/utils";
import { NumberField, Segmented } from "./fields";

export type Apply = (fn: (c: DraftConfigV5) => DraftConfigV5) => void;

export function LineRow({
  line,
  total,
  config,
  priceBook,
  groups,
  apply,
  wholeDollars,
  autoFocusName,
}: {
  line: QuoteLineV5;
  total: LineTotal | undefined;
  config: DraftConfigV5;
  priceBook: PriceBook;
  groups: QuoteGroup[];
  apply: Apply;
  wholeDollars: boolean;
  autoFocusName?: boolean;
}) {
  const product = findProduct(priceBook, line.productId);
  const available = line.kind === "product" && product ? optionsFor(priceBook, product) : [];
  const digitalFile = line.kind === "product" && line.digital;
  const canDigital = line.kind === "custom" || (!!product && product.digitalPrice !== null);
  const customPrice = line.listUnitPrice !== undefined && Math.abs(line.unitPrice - line.listUnitPrice) > 0.0001;
  const needsPrice = line.kind === "product" && !!product && product.price === null && line.unitPrice === 0;
  const showDesign = !digitalFile && (line.designFee > 0 || (product?.designFee ?? 0) > 0);
  const linkable = line.kind === "product" && !!product && product.qtyBasis !== "fixed";
  const [editDetail, setEditDetail] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusName) nameRef.current?.focus();
  }, [autoFocusName]);

  const set = (patch: Partial<QuoteLineV5>) => apply((c) => updateLine(c, line.id, patch));
  const money = (n: number) => formatMoney(n, { wholeDollars });

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            ref={nameRef}
            value={line.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={line.kind === "custom" ? "Custom item name" : "Name"}
            aria-label="Line name"
            className="h-11 w-full rounded-md border border-transparent bg-transparent px-2 -mx-2 text-sm hover:border-border focus:border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {line.kind === "product" && product && <span>from price book</span>}
            {line.kind === "product" && !product && !line.productId && <span>fixed price</span>}
            {line.kind === "custom" && <span>custom line</span>}
            {needsPrice && (
              <span className="rounded-full border border-border px-2 py-0.5 text-foreground">set price</span>
            )}
            {line.detail && !editDetail && <span className="break-words">· {line.detail}</span>}
          </p>
          {line.includes && line.includes.length > 0 && (
            <ul className="mt-1 text-xs text-muted-foreground">
              {line.includes.map((inc, i) => (
                <li key={i}>· {inc}</li>
              ))}
            </ul>
          )}
        </div>
        <span className="pt-2.5 font-mono text-sm tabular-nums whitespace-nowrap">{money(total?.total ?? 0)}</span>
        <LineMenu
          line={line}
          groups={groups}
          onDuplicate={() => apply((c) => duplicateLine(c, line.id))}
          onMove={(gid) => apply((c) => moveLineToGroup(c, line.id, gid))}
          onEditDetail={() => setEditDetail(true)}
          onRemove={() => apply((c) => removeLine(c, line.id))}
        />
      </div>

      {editDetail && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={line.detail ?? ""}
            onChange={(e) => set({ detail: e.target.value || undefined })}
            onKeyDown={(e) => e.key === "Enter" && setEditDetail(false)}
            placeholder="Detail shown to the client, e.g. 5×7 · cotton paper"
            aria-label="Detail line"
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="button" onClick={() => setEditDetail(false)} className="h-11 rounded-md border border-border px-3 text-sm hover:bg-muted">
            Done
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Quantity */}
        {digitalFile ? (
          <span className="h-11 inline-flex items-center text-xs text-muted-foreground">Digital file · qty not used</span>
        ) : (
          <div className="flex items-center gap-1">
            <NumberField
              label={`Quantity for ${line.name || "line"}`}
              value={line.qty}
              decimals={0}
              onChange={(n) => apply((c) => setLineQty(c, line.id, n))}
              className="w-24"
            />
            {linkable && (
              <button
                type="button"
                onClick={() =>
                  apply((c) => (line.qtyLink ? updateLine(c, line.id, { qtyLink: null }) : relinkLine(c, line.id, priceBook)))
                }
                aria-pressed={!!line.qtyLink}
                aria-label={
                  line.qtyLink
                    ? `Follows ${line.qtyLink.basis}s (${line.qtyLink.per} per). Click to set it by hand.`
                    : "Typed by hand. Click to follow the guest count again."
                }
                title={line.qtyLink ? `${line.qtyLink.per} per ${line.qtyLink.basis}` : "Re-link to the guest count"}
                className={cn(
                  "h-11 w-11 inline-flex items-center justify-center rounded-md border transition-colors",
                  line.qtyLink ? "border-foreground/40 text-foreground" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {line.qtyLink ? <Link2 className="h-4 w-4" aria-hidden /> : <Link2Off className="h-4 w-4" aria-hidden />}
              </button>
            )}
          </div>
        )}

        {/* Unit price */}
        <div className="flex flex-wrap items-center gap-1.5">
          <NumberField
            label={`${digitalFile ? "File price" : "Unit price"} for ${line.name || "line"}`}
            value={line.unitPrice}
            prefix="$"
            onChange={(n) => set({ unitPrice: n })}
            className="w-28"
          />
          <span className="text-xs text-muted-foreground">{digitalFile ? "file" : "/ pc"}</span>
          {customPrice && (
            <>
              <span className="rounded-full border border-accent bg-accent-soft px-2 py-0.5 text-xs">custom</span>
              <span className="text-xs text-muted-foreground tabular-nums">list {formatMoney2(line.listUnitPrice!)}</span>
              <button
                type="button"
                onClick={() => set({ unitPrice: line.listUnitPrice! })}
                aria-label="Reset to the price-book price"
                title="Reset to the price-book price"
                className="h-11 w-11 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </>
          )}
        </div>

        {/* Design fee */}
        {showDesign && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">+ design</span>
            <NumberField
              label={`Design fee for ${line.name || "line"}`}
              value={line.designFee}
              prefix="$"
              onChange={(n) => set({ designFee: n })}
              className="w-24"
            />
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!line.reuseDesign}
                onChange={(e) => set({ reuseDesign: e.target.checked })}
                className="h-5 w-5 accent-foreground"
              />
              Reuse design ({formatPct(config.reuseDesignPct)})
            </label>
          </div>
        )}

        {/* Physical / digital */}
        {canDigital && (
          <Segmented
            label="Delivery"
            size="sm"
            value={line.digital ? "digital" : "physical"}
            options={[
              { value: "physical", label: "Printed" },
              { value: "digital", label: "Digital" },
            ]}
            onChange={(v) => apply((c) => setLineDigital(c, line.id, v === "digital", priceBook))}
          />
        )}
      </div>

      {(available.length > 0 || line.options.length > 0) && (
        <div className="mt-2">
          <OptionChips
            available={available}
            selected={line.options}
            onToggle={(o) => apply((c) => toggleOption(c, line.id, o))}
            onRemove={(id) => set({ options: line.options.filter((o) => o.id !== id) })}
          />
        </div>
      )}
    </li>
  );
}

function LineMenu({
  line,
  groups,
  onDuplicate,
  onMove,
  onEditDetail,
  onRemove,
}: {
  line: QuoteLineV5;
  groups: QuoteGroup[];
  onDuplicate: () => void;
  onMove: (groupId: string | undefined) => void;
  onEditDetail: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = (label: string, fn: () => void, key?: string) => (
    <button
      key={key ?? label}
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        fn();
      }}
      className="flex min-h-[44px] w-full items-center px-3 text-left text-sm hover:bg-muted"
    >
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More for ${line.name || "this line"}`}
        onClick={() => setOpen((o) => !o)}
        className="h-11 w-11 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-border bg-card py-1 shadow-[0_6px_18px_-8px_hsl(var(--accent)/0.5)]"
        >
          {item("Duplicate", onDuplicate)}
          {line.groupId && item("Move out of the suite", () => onMove(undefined))}
          {groups
            .filter((g) => g.id !== line.groupId)
            .map((g) => item(`Move into ${g.name}`, () => onMove(g.id), `move-${g.id}`))}
          {item(line.detail ? "Edit detail line" : "Add a detail line", onEditDetail)}
          {item("Remove", onRemove)}
        </div>
      )}
    </div>
  );
}
