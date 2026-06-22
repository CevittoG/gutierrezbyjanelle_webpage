"use client";

import { useRef, useState } from "react";
import {
  CatalogItem,
  ITEM_CATALOG,
  QuoteState,
  timeToHM,
  hmToMin,
  saveDefaults,
  clearSavedDefaults,
  exportSettings,
  importSettings,
} from "@/lib/quote-calc-logic";
import { cn } from "@/utils";
import { ItemAssumptionRow } from "./ItemAssumptionRow";

interface Props {
  assumptions: QuoteState;
  onUpdate: (key: keyof QuoteState, value: number) => void;
  onReset: () => void;
  onLoad: (s: QuoteState) => void;
  catalog?: CatalogItem[];
}

function NumInput({
  label,
  description,
  stateKey,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  disabled,
  onUpdate,
}: {
  label: string;
  description: string;
  stateKey: keyof QuoteState;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  onUpdate: (key: keyof QuoteState, value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold text-foreground leading-tight">{label}</label>
        <div className="flex items-center gap-1 shrink-0">
          {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => onUpdate(stateKey, parseFloat(e.target.value) || 0)}
            className={cn(
              "w-20 rounded border border-border bg-background px-2 py-1 text-right text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground normal-case tracking-normal leading-snug">{description}</p>
    </div>
  );
}

function TimeInput({
  stateKey,
  value,
  disabled,
  onUpdate,
}: {
  stateKey: keyof QuoteState;
  value: number;
  disabled?: boolean;
  onUpdate: (key: keyof QuoteState, value: number) => void;
}) {
  const { h, m } = timeToHM(value);
  return (
    <div className="inline-flex items-center gap-0.5">
      <input
        type="number"
        value={h}
        min={0}
        max={20}
        disabled={disabled}
        onChange={(e) => onUpdate(stateKey, hmToMin(parseInt(e.target.value) || 0, m))}
        className={cn(
          "w-10 rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <span className="text-xs text-muted-foreground">h</span>
      <input
        type="number"
        value={m}
        min={0}
        max={59}
        disabled={disabled}
        onChange={(e) => onUpdate(stateKey, hmToMin(h, parseInt(e.target.value) || 0))}
        className={cn(
          "w-10 rounded border border-border bg-background px-1 py-0.5 text-right text-xs font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <span className="text-xs text-muted-foreground">m</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-5 mb-3 pb-1.5 border-b border-border">
      {children}
    </h4>
  );
}

export function AssumptionsPanel({ assumptions, onUpdate, onReset, onLoad, catalog = ITEM_CATALOG }: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    saveDefaults(assumptions);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    clearSavedDefaults();
    onReset();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await importSettings(file);
      onLoad(loaded);
    } catch {
      alert("Could not read settings file. Make sure it is a valid JSON export.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div>
          <span className="text-sm font-semibold normal-case tracking-normal">Adjust assumptions</span>
          <span className="text-xs text-muted-foreground ml-2 normal-case tracking-normal">
            Labor rates · overhead · discounts · per-item costs
          </span>
        </div>
        <span className={cn("text-muted-foreground transition-transform duration-200", open && "rotate-180")}>
          &#9660;
        </span>
      </button>

      {open && (
        <div className="px-5 pb-6 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
            {/* Column 1 — Cost structure */}
            <div>
              <SectionHeader>Cost Structure</SectionHeader>
              <div className="space-y-4">
                <NumInput label="Hourly rate" description="Your labor rate for design and production" stateKey="hourly" value={assumptions.hourly} min={15} max={250} step={5} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Admin overhead" description="Marketing, website, customer management, etc." stateKey="adminPtg" value={assumptions.adminPtg} min={0} max={100} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Target profit" description="Desired profit margin on top of costs + admin" stateKey="targetProfitPtg" value={assumptions.targetProfitPtg} min={0} max={100} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Error margin (materials)" description="Buffer for misprints and paper waste" stateKey="errorMarginPtg" value={assumptions.errorMarginPtg} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Packaging materials" description="Box, tissue, ribbon per physical order" stateKey="packagingCost" value={assumptions.packagingCost} min={0} max={50} step={1} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Reuse design factor" description="Fraction of design time when reusing (0.25 = 25%)" stateKey="reuseFactor" value={assumptions.reuseFactor} min={0.05} max={1} step={0.05} suffix="x" onUpdate={onUpdate} />
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <label className="text-xs font-semibold text-foreground leading-tight">Revision time per round</label>
                    <TimeInput stateKey="revisionMin" value={assumptions.revisionMin} onUpdate={onUpdate} />
                  </div>
                  <p className="text-xs text-muted-foreground normal-case tracking-normal leading-snug">Added to design labor per extra revision</p>
                </div>
              </div>
            </div>

            {/* Column 2 — Package discounts + Extras */}
            <div>
              <SectionHeader>Wedding Discounts</SectionHeader>
              <div className="space-y-4">
                <NumInput label="DIY Digital" description="Digital-only bundle discount" stateKey="discountDiy" value={assumptions.discountDiy} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Sweet Suite" description="Core invite suite discount" stateKey="discountSweet" value={assumptions.discountSweet} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Signature Suite" description="Full experience discount" stateKey="discountSignature" value={assumptions.discountSignature} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
              </div>

              <SectionHeader>Event Discounts</SectionHeader>
              <div className="space-y-4">
                <NumInput label="The Basics" description="Invite + thank yous discount" stateKey="discountEventBasics" value={assumptions.discountEventBasics} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Add Some Fun" description="Mid-tier event discount" stateKey="discountEventFun" value={assumptions.discountEventFun} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Give Me the Works" description="Full event suite discount" stateKey="discountEventWorks" value={assumptions.discountEventWorks} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
              </div>

              <SectionHeader>Extras</SectionHeader>
              <div className="space-y-4">
                <NumInput label="Vendor incentive" description="Referral discount stacked on top of package discount" stateKey="vendorIncentivePtg" value={assumptions.vendorIncentivePtg} min={0} max={50} step={1} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Full color factor" description="Sheet cost multiplier for heavy ink coverage" stateKey="fullColorFactor" value={assumptions.fullColorFactor} min={1} max={3} step={0.1} suffix="x" onUpdate={onUpdate} />
                <NumInput label="Custom paper factor" description="Sheet cost multiplier for premium / specialty paper" stateKey="customPaperFactor" value={assumptions.customPaperFactor} min={1} max={3} step={0.1} suffix="x" onUpdate={onUpdate} />
                <NumInput label="Digital file license" description="Design labor premium when client receives source files" stateKey="digitalLicensePtg" value={assumptions.digitalLicensePtg} min={0} max={100} step={5} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Rush fee" description="Surcharge for turnaround under 7 days" stateKey="rushFeePtg" value={assumptions.rushFeePtg} min={0} max={100} step={5} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Deposit (fixed)" description="Flat upfront payment the client pays to start proofs. Shown on the client quote; never changes the total." stateKey="depositAmount" value={assumptions.depositAmount} min={0} max={5000} step={25} prefix="$" onUpdate={onUpdate} />
              </div>
            </div>

            {/* Column 3 — Per-item table */}
            <div className="md:col-span-2 lg:col-span-1">
              <SectionHeader>Per-Item Costs</SectionHeader>
              <p className="text-xs text-muted-foreground normal-case tracking-normal mb-3 leading-relaxed">
                <strong>Design time</strong> — one-time creative labor.{" "}
                <strong>Prod time</strong> — per unit (print/cut/review).{" "}
                <strong>Sheet $</strong> — material cost per sheet.{" "}
                <strong>Yield</strong> — units per sheet.
              </p>
              {/* Mobile: card list */}
              <div className="space-y-2 md:hidden">
                {catalog.map((item) => (
                  <ItemAssumptionRow
                    key={item.key}
                    item={item}
                    assumptions={assumptions}
                    onUpdate={onUpdate}
                    layout="card"
                  />
                ))}
              </div>

              {/* Tablet+: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 text-muted-foreground font-semibold normal-case tracking-normal">Item</th>
                      <th className="text-right py-2 px-1 text-muted-foreground font-semibold normal-case tracking-normal">Design time</th>
                      <th className="text-right py-2 px-1 text-muted-foreground font-semibold normal-case tracking-normal">Prod time</th>
                      <th className="text-right py-2 px-1 text-muted-foreground font-semibold normal-case tracking-normal">Sheet $</th>
                      <th className="text-right py-2 pl-1 text-muted-foreground font-semibold normal-case tracking-normal">Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((item) => (
                      <ItemAssumptionRow
                        key={item.key}
                        item={item}
                        assumptions={assumptions}
                        onUpdate={onUpdate}
                        layout="table"
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-3">
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 normal-case tracking-normal transition-colors"
            >
              Reset to defaults
            </button>
            <span className="text-border">|</span>
            <button
              onClick={handleSave}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 normal-case tracking-normal transition-colors"
            >
              {saved ? "Saved!" : "Save as my defaults"}
            </button>
            <span className="text-border">|</span>
            <button
              onClick={() => exportSettings(assumptions)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 normal-case tracking-normal transition-colors"
            >
              Export JSON
            </button>
            <span className="text-border">|</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 normal-case tracking-normal transition-colors"
            >
              Import JSON
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </div>
      )}
    </div>
  );
}
