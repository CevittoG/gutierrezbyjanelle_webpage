"use client";

import { CatalogItem, QuoteState, hmToMin, timeToHM } from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface Props {
  item: CatalogItem;
  assumptions: QuoteState;
  onUpdate: (key: keyof QuoteState, value: number) => void;
  layout: "table" | "card";
}

function BigTimeInput({
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
  const inputClass = cn(
    "h-11 w-14 rounded border border-border bg-background px-1 text-right text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring",
    disabled && "opacity-50 cursor-not-allowed"
  );
  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="number"
        inputMode="numeric"
        value={h}
        min={0}
        max={20}
        disabled={disabled}
        onChange={(e) => onUpdate(stateKey, hmToMin(parseInt(e.target.value) || 0, m))}
        aria-label="Hours"
        className={inputClass}
      />
      <span className="text-xs text-muted-foreground">h</span>
      <input
        type="number"
        inputMode="numeric"
        value={m}
        min={0}
        max={59}
        disabled={disabled}
        onChange={(e) => onUpdate(stateKey, hmToMin(h, parseInt(e.target.value) || 0))}
        aria-label="Minutes"
        className={inputClass}
      />
      <span className="text-xs text-muted-foreground">m</span>
    </div>
  );
}

function SheetInput({
  stateKey,
  value,
  onUpdate,
}: {
  stateKey: keyof QuoteState;
  value: number;
  onUpdate: (key: keyof QuoteState, value: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      min={0}
      max={500}
      step={0.05}
      onChange={(e) => onUpdate(stateKey, parseFloat(e.target.value) || 0)}
      aria-label="Sheet cost"
      className="h-11 w-20 rounded border border-border bg-background px-2 text-right text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function YieldInput({
  stateKey,
  value,
  onUpdate,
}: {
  stateKey: keyof QuoteState;
  value: number;
  onUpdate: (key: keyof QuoteState, value: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      min={1}
      max={100}
      step={1}
      onChange={(e) => onUpdate(stateKey, parseInt(e.target.value) || 1)}
      aria-label="Yield"
      className="h-11 w-16 rounded border border-border bg-background px-2 text-right text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function ItemAssumptionRow({ item, assumptions, onUpdate, layout }: Props) {
  const isEnvelope = item.key === "iEnvelope";
  const dtKey = `${item.key}_dt` as keyof QuoteState;
  const ptKey = `${item.key}_pt` as keyof QuoteState;
  const scKey = `${item.key}_sc` as keyof QuoteState;
  const yKey = `${item.key}_y` as keyof QuoteState;

  const dtValue = assumptions[dtKey] as number;
  const ptValue = assumptions[ptKey] as number;
  const scValue = assumptions[scKey] as number;
  const yValue = assumptions[yKey] as number;

  if (layout === "table") {
    return (
      <tr className="border-b border-border/40 hover:bg-muted/20">
        <td className="py-2 pr-2 font-medium normal-case tracking-normal whitespace-nowrap">{item.label}</td>
        <td className="py-2 px-1">
          {isEnvelope ? (
            <span className="text-muted-foreground/50 block text-right">-</span>
          ) : (
            <BigTimeInput stateKey={dtKey} value={dtValue} onUpdate={onUpdate} />
          )}
        </td>
        <td className="py-2 px-1">
          <BigTimeInput stateKey={ptKey} value={ptValue} onUpdate={onUpdate} />
        </td>
        <td className="py-2 px-1 text-right">
          <SheetInput stateKey={scKey} value={scValue} onUpdate={onUpdate} />
        </td>
        <td className="py-2 pl-1 text-right">
          <YieldInput stateKey={yKey} value={yValue} onUpdate={onUpdate} />
        </td>
      </tr>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
      <p className="text-sm font-semibold normal-case tracking-normal">{item.label}</p>
      <div className="grid grid-cols-1 gap-2">
        {!isEnvelope && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground normal-case tracking-normal">Design time</span>
            <BigTimeInput stateKey={dtKey} value={dtValue} onUpdate={onUpdate} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground normal-case tracking-normal">Prod time / unit</span>
          <BigTimeInput stateKey={ptKey} value={ptValue} onUpdate={onUpdate} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground normal-case tracking-normal">Sheet $</span>
          <SheetInput stateKey={scKey} value={scValue} onUpdate={onUpdate} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground normal-case tracking-normal">Yield per sheet</span>
          <YieldInput stateKey={yKey} value={yValue} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
}
