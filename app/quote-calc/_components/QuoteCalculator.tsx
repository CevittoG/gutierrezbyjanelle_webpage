"use client";

import { useMemo, useState } from "react";
import {
  ADD_ON_KEYS,
  DEFAULTS,
  ITEM_CATALOG,
  PACKAGES,
  PkgKey,
  PricingMode,
  QuoteState,
  calcAddOn,
  calcPackage,
  fmt$,
  fmt$2,
} from "@/lib/quote-calc-logic";
import { cn } from "@/utils";
import { BreakdownPanel } from "./BreakdownPanel";
import { AssumptionsPanel } from "./AssumptionsPanel";

const PKG_KEYS: PkgKey[] = ["individual", "diy", "sweet", "deluxe"];

export function QuoteCalculator() {
  const [pkg, setPkg] = useState<PkgKey>("sweet");
  const [mode, setMode] = useState<PricingMode>("fresh");
  const [qty, setQty] = useState(75);
  const [addOns, setAddOns] = useState<Set<string>>(new Set());
  const [rushFee, setRushFee] = useState(false);
  const [extraRevisions, setExtraRevisions] = useState(0);
  const [digitalLicense, setDigitalLicense] = useState(false);
  const [assumptions, setAssumptions] = useState<QuoteState>({ ...DEFAULTS });

  function updateAssumption(key: keyof QuoteState, value: number) {
    setAssumptions((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAddOn(key: string) {
    setAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const baseResult = useMemo(
    () => calcPackage(pkg, qty, mode, assumptions),
    [pkg, qty, mode, assumptions]
  );

  const selectedAddOns = useMemo(
    () =>
      ADD_ON_KEYS.filter((k) => addOns.has(k)).map((k) => ({
        key: k,
        label: ITEM_CATALOG.find((i) => i.key === k)!.label,
        result: calcAddOn(k, qty, mode, assumptions),
      })),
    [addOns, qty, mode, assumptions]
  );

  // Per-add-on price preview for the checklist
  const addOnPreviews = useMemo(
    () =>
      Object.fromEntries(
        ADD_ON_KEYS.map((k) => [k, calcAddOn(k, qty, mode, assumptions)])
      ),
    [qty, mode, assumptions]
  );

  return (
    <div className="container py-8 px-4 md:px-8 normal-case tracking-normal">
      {/* Page header */}
      <div className="mb-7">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Internal tool · not indexed
        </p>
        <h1 className="font-squarepeg text-4xl md:text-5xl mb-1">Quote Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Configure a package, adjust assumptions, and see every dollar exposed in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ─── Left: configuration panel ─── */}
        <div className="lg:col-span-3 space-y-5">

          {/* 1. Package selector */}
          <Section title="Package">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PKG_KEYS.map((key) => {
                const def = PACKAGES[key];
                const isSelected = pkg === key;
                const previewResult = calcPackage(key, qty, mode, assumptions);
                return (
                  <button
                    key={key}
                    onClick={() => setPkg(key)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all duration-150",
                      isSelected ? def.selectedColorClass : def.colorClass + " hover:brightness-95"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-squarepeg text-xl leading-tight">{def.name}</span>
                      {isSelected && (
                        <span className="shrink-0 text-xs rounded-full bg-foreground text-background px-2 py-0.5 font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{def.tagline}</p>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{def.description}</p>
                    <p className="text-sm font-mono font-semibold mt-3 tabular-nums">
                      {fmt$(Math.round(previewResult.price))}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 2. Mode + Quantity */}
          <Section title="Configuration">
            <div className="space-y-4">
              {/* Mode toggle */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Pricing mode
                </label>
                <div className="inline-flex rounded-lg border border-border overflow-hidden">
                  {(["fresh", "reuse"] as PricingMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "px-5 py-2 text-sm font-medium transition-colors",
                        mode === m
                          ? "bg-foreground text-background"
                          : "bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      {m === "fresh" ? "Fresh design" : "Reuse existing"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {mode === "fresh"
                    ? "Charging design fees — new original artwork from scratch."
                    : "Adapting an existing design — lower cost, fewer hours, reuse prices apply."}
                </p>
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor="qty"
                  className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2"
                >
                  Quantity — households / guests invited
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="qty"
                    type="number"
                    value={qty}
                    min={10}
                    max={500}
                    step={5}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">households</span>
                  <span className="text-xs text-muted-foreground/60">
                    (~{(qty * 2.1).toFixed(0)} individual items at ×2 multiplier)
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* 3. Add-ons */}
          <Section title="Add-ons">
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Sold à la carte on top of any package. Prices update live with your quantity and mode.
            </p>
            <div className="space-y-2">
              {ADD_ON_KEYS.map((key) => {
                const item = ITEM_CATALOG.find((i) => i.key === key)!;
                const preview = addOnPreviews[key];
                const isChecked = addOns.has(key);
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      isChecked
                        ? "border-foreground/40 bg-muted"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAddOn(key)}
                      className="h-4 w-4 rounded accent-foreground cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.notes}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono tabular-nums font-medium">
                        {fmt$(Math.round(preview.price))}
                      </span>
                      {preview.itemFee > 0 && (
                        <div className="text-xs text-muted-foreground font-mono tabular-nums">
                          {fmt$2(preview.printRevenue)} print + {fmt$2(preview.itemFee)} fee
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* 4. Extras */}
          <Section title="Extras">
            <div className="space-y-3">
              {/* Rush fee */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  rushFee ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={rushFee}
                  onChange={(e) => setRushFee(e.target.checked)}
                  className="h-4 w-4 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Rush fee +30%</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Turnaround under 7 days — applied to the full quote total.
                  </p>
                </div>
              </label>

              {/* Revision rounds */}
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
                <div className="flex-1">
                  <span className="text-sm font-medium">Extra revision rounds</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    First round is free. Each extra round adds {fmt$(assumptions.feeR)}.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExtraRevisions((v) => Math.max(0, v - 1))}
                    disabled={extraRevisions === 0}
                    className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm tabular-nums">{extraRevisions}</span>
                  <button
                    onClick={() => setExtraRevisions((v) => Math.min(5, v + 1))}
                    disabled={extraRevisions === 5}
                    className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Digital file license */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  digitalLicense ? "border-foreground/40 bg-muted" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={digitalLicense}
                  onChange={(e) => setDigitalLicense(e.target.checked)}
                  className="h-4 w-4 rounded accent-foreground cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Digital file license</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Print-ready files · unlimited copies — design fees ×1.3.
                  </p>
                </div>
              </label>
            </div>
          </Section>
        </div>

        {/* ─── Right: price breakdown ─── */}
        <div className="lg:col-span-2">
          <BreakdownPanel
            pkg={pkg}
            mode={mode}
            qty={qty}
            assumptions={assumptions}
            baseResult={baseResult}
            selectedAddOns={selectedAddOns}
            rushFee={rushFee}
            extraRevisions={extraRevisions}
            digitalLicense={digitalLicense}
          />
        </div>
      </div>

      {/* ─── Assumptions panel (full width, collapsible) ─── */}
      <div className="mt-6">
        <AssumptionsPanel
          assumptions={assumptions}
          onUpdate={updateAssumption}
          onReset={() => setAssumptions({ ...DEFAULTS })}
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}
