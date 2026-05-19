"use client";

import { useState } from "react";
import { DEFAULTS, ITEM_CATALOG, QuoteState } from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface Props {
  assumptions: QuoteState;
  onUpdate: (key: keyof QuoteState, value: number) => void;
  onReset: () => void;
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
            onChange={(e) => onUpdate(stateKey, parseFloat(e.target.value) || 0)}
            className="w-20 rounded border border-border bg-background px-2 py-1 text-right text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground normal-case tracking-normal leading-snug">{description}</p>
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

export function AssumptionsPanel({ assumptions, onUpdate, onReset }: Props) {
  const [open, setOpen] = useState(false);

  const mainItems = ITEM_CATALOG.slice(0, 9);
  const addOnItems = ITEM_CATALOG.slice(9);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div>
          <span className="text-sm font-semibold normal-case tracking-normal">⚙ Adjust assumptions</span>
          <span className="text-xs text-muted-foreground ml-2 normal-case tracking-normal">
            Material costs · markups · design fees · hours
          </span>
        </div>
        <span className={cn("text-muted-foreground transition-transform duration-200", open && "rotate-180")}>▼</span>
      </button>

      {open && (
        <div className="px-5 pb-6 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
            {/* Column 1 — Material costs & Markup */}
            <div>
              <SectionHeader>Material &amp; Production</SectionHeader>
              <div className="space-y-4">
                <NumInput label="Ink + paper per sheet" description="Your cost per printed card" stateKey="paper" value={assumptions.paper} min={0.01} max={2} step={0.01} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Envelope cost" description="Per envelope (outer + inner)" stateKey="env" value={assumptions.env} min={0.05} max={2} step={0.05} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Packaging materials" description="Per order — box, tissue, ribbon, etc." stateKey="pkg" value={assumptions.pkg} min={0} max={50} step={1} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Your hourly rate" description="Target earnings per hour of design work" stateKey="hourly" value={assumptions.hourly} min={15} max={250} step={5} prefix="$" onUpdate={onUpdate} />
              </div>

              <SectionHeader>Markup Levers</SectionHeader>
              <div className="space-y-4">
                <NumInput label="Shipping base cost" description="What you pay the carrier (USPS / UPS)" stateKey="shipBase" value={assumptions.shipBase} min={0} max={100} step={1} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Printing markup" description="100% = charge 2× your print cost" stateKey="printProfit" value={assumptions.printProfit} min={0} max={500} step={5} suffix="%" onUpdate={onUpdate} />
                <NumInput label="Shipping markup" description="Covers handling time (25% is typical)" stateKey="shipProfit" value={assumptions.shipProfit} min={0} max={200} step={5} suffix="%" onUpdate={onUpdate} />
              </div>
            </div>

            {/* Column 2 — Design fees & Hours */}
            <div>
              <SectionHeader>Design Fees</SectionHeader>
              <div className="space-y-4">
                <NumInput label="Custom design fee" description="Charged once for fresh-from-scratch artwork" stateKey="feeC" value={assumptions.feeC} min={50} max={1000} step={25} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Revision round fee" description="Each round beyond the first free one" stateKey="feeR" value={assumptions.feeR} min={0} max={300} step={5} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Template reuse base fee" description="Adapting your own past design (name/color swap)" stateKey="feeT" value={assumptions.feeT} min={0} max={500} step={5} prefix="$" onUpdate={onUpdate} />
                <NumInput label="Target net margin" description="Used to color-code your margin status in the breakdown" stateKey="target" value={assumptions.target} min={10} max={90} step={5} suffix="%" onUpdate={onUpdate} />
              </div>

              <SectionHeader>Hours Per Package</SectionHeader>
              <div className="space-y-4">
                <NumInput label="DIY Digital hours" description="Design + export time for PDF delivery" stateKey="hDIY" value={assumptions.hDIY} min={1} max={20} step={1} suffix="h" onUpdate={onUpdate} />
                <NumInput label="Sweet Suite hours" description="Design + print prep + coordination" stateKey="hSweet" value={assumptions.hSweet} min={1} max={40} step={1} suffix="h" onUpdate={onUpdate} />
                <NumInput label="Deluxe Suite hours" description="Full design + all day-of items" stateKey="hDeluxe" value={assumptions.hDeluxe} min={1} max={60} step={1} suffix="h" onUpdate={onUpdate} />
              </div>
            </div>

            {/* Column 3 — Per-item pricing */}
            <div className="md:col-span-2 lg:col-span-1">
              <SectionHeader>Per-Item Pricing</SectionHeader>
              <p className="text-xs text-muted-foreground normal-case tracking-normal mb-3 leading-relaxed">
                <strong>Design fee</strong> — charged once for fresh artwork.{" "}
                <strong>Reuse price</strong> — charged when adapting an existing design.{" "}
                <strong>Print cost</strong> — your cost per unit.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-2 text-muted-foreground font-semibold normal-case tracking-normal">Item</th>
                      <th className="text-right py-1.5 px-1 text-muted-foreground font-semibold normal-case tracking-normal">Design $</th>
                      <th className="text-right py-1.5 px-1 text-muted-foreground font-semibold normal-case tracking-normal">Reuse $</th>
                      <th className="text-right py-1.5 pl-1 text-muted-foreground font-semibold normal-case tracking-normal">Print $/unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ITEM_CATALOG.map((item) => {
                      const isEnvelope = item.key === "iEnvelope";
                      return (
                        <tr key={item.key} className="border-b border-border/40 hover:bg-muted/20">
                          <td className="py-1.5 pr-2 font-medium normal-case tracking-normal whitespace-nowrap">{item.label}</td>
                          <td className="py-1.5 px-1 text-right">
                            {isEnvelope ? (
                              <span className="text-muted-foreground/50">—</span>
                            ) : (
                              <input
                                type="number"
                                value={assumptions[`${item.key}_d` as keyof QuoteState] as number}
                                min={0} max={2000} step={5}
                                onChange={(e) => onUpdate(`${item.key}_d` as keyof QuoteState, parseFloat(e.target.value) || 0)}
                                className="w-16 rounded border border-border bg-background px-1 py-0.5 text-right font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                              />
                            )}
                          </td>
                          <td className="py-1.5 px-1 text-right">
                            {isEnvelope ? (
                              <span className="text-muted-foreground/50">—</span>
                            ) : (
                              <input
                                type="number"
                                value={assumptions[`${item.key}_r` as keyof QuoteState] as number}
                                min={0} max={500} step={0.5}
                                onChange={(e) => onUpdate(`${item.key}_r` as keyof QuoteState, parseFloat(e.target.value) || 0)}
                                className="w-16 rounded border border-border bg-background px-1 py-0.5 text-right font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                              />
                            )}
                          </td>
                          <td className="py-1.5 pl-1 text-right">
                            <input
                              type="number"
                              value={assumptions[`${item.key}_p` as keyof QuoteState] as number}
                              min={0} max={500} step={0.05}
                              onChange={(e) => onUpdate(`${item.key}_p` as keyof QuoteState, parseFloat(e.target.value) || 0)}
                              className="w-16 rounded border border-border bg-background px-1 py-0.5 text-right font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 normal-case tracking-normal transition-colors"
            >
              Reset all assumptions to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
