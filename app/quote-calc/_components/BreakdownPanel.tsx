"use client";

import { useState } from "react";
import {
  PackageResult,
  AddOnResult,
  CatalogItem,
  PkgKey,
  PricingMode,
  QuoteState,
  PACKAGES,
  ITEM_CATALOG,
  fmt$,
  fmt$2,
  fmtPct,
} from "@/lib/quote-calc-logic";
import { cn } from "@/utils";

interface SelectedAddOn {
  key: string;
  label: string;
  result: AddOnResult;
}

interface Props {
  pkg: PkgKey;
  mode: PricingMode;
  qty: number;
  assumptions: QuoteState;
  baseResult: PackageResult;
  selectedAddOns: SelectedAddOn[];
  rushFee: boolean;
  extraRevisions: number;
  digitalLicense: boolean;
}

function Row({
  label,
  math,
  value,
  dim,
  bold,
  indent,
}: {
  label: string;
  math?: string;
  value: string;
  dim?: boolean;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-2 py-1",
        indent && "pl-3",
        dim && "text-muted-foreground",
        bold && "font-semibold"
      )}
    >
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm", bold ? "text-foreground" : dim ? "text-muted-foreground" : "text-foreground/80")}>
          {label}
        </span>
        {math && (
          <span className="ml-2 text-xs font-mono text-muted-foreground/70 tabular-nums">{math}</span>
        )}
      </div>
      <span className={cn("font-mono tabular-nums text-sm shrink-0", bold ? "text-foreground" : "text-foreground/80")}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-1">{children}</p>
  );
}

function Divider({ strong }: { strong?: boolean }) {
  return <hr className={cn("my-2", strong ? "border-foreground/40 border" : "border-border")} />;
}

export function BreakdownPanel({
  pkg,
  mode,
  qty,
  assumptions,
  baseResult,
  selectedAddOns,
  rushFee,
  extraRevisions,
  digitalLicense,
}: Props) {
  const [copied, setCopied] = useState(false);

  const pkgDef = PACKAGES[pkg];

  // Digital license bonus applies to item fees
  const digitalBonus = digitalLicense ? baseResult.itemFees * 0.3 : 0;
  const effectiveItemFees = baseResult.itemFees + digitalBonus;
  const basePriceAdjusted = baseResult.price - baseResult.itemFees + effectiveItemFees;

  // Add-ons total
  const addOnsSubtotal = selectedAddOns.reduce((s, a) => s + a.result.price, 0);
  const addOnsPrintCost = selectedAddOns.reduce((s, a) => s + a.result.printCost, 0);

  // Revisions
  const revisionsTotal = extraRevisions * assumptions.feeR;

  // Subtotal before rush
  const subtotalBeforeRush = basePriceAdjusted + addOnsSubtotal + revisionsTotal;

  // Rush
  const rushAmount = rushFee ? subtotalBeforeRush * 0.3 : 0;
  const finalPrice = subtotalBeforeRush + rushAmount;

  // Costs
  const totalPrintCost = baseResult.printCost + addOnsPrintCost;
  const yourCosts = baseResult.cogs + addOnsPrintCost + baseResult.laborCost;
  const netProfit = finalPrice - yourCosts;
  const netMargin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;

  const marginDiff = netMargin - assumptions.target;
  const marginBadge =
    marginDiff >= 0
      ? "bg-green-100 text-green-800 border border-green-200"
      : marginDiff >= -5
      ? "bg-amber-100 text-amber-800 border border-amber-200"
      : "bg-red-100 text-red-800 border border-red-200";
  const marginIcon = marginDiff >= 0 ? "✓" : marginDiff >= -5 ? "≈" : "↓";
  const marginLabel =
    marginDiff >= 0
      ? `${Math.round(marginDiff)} pts above target`
      : marginDiff >= -5
      ? `${Math.round(Math.abs(marginDiff))} pts below target`
      : `${Math.round(Math.abs(marginDiff))} pts below target`;

  function copyQuoteSummary() {
    const addOnNames = selectedAddOns.map((a) => a.label).join(", ");
    const packageItems = pkgDef.items
      .map((k) => ITEM_CATALOG.find((i) => i.key === k)?.label)
      .filter(Boolean)
      .join(", ");

    const lines = [
      "GutierrezByJanelle — Quote Summary",
      "─────────────────────────────────────",
      `Package:     ${pkgDef.name}`,
      `Mode:        ${mode === "fresh" ? "Custom design (fresh artwork)" : "Reuse existing design"}`,
      `Quantity:    ${qty} households`,
      `Includes:    ${packageItems}`,
      addOnNames ? `Add-ons:     ${addOnNames}` : null,
      extraRevisions > 0 ? `Revisions:   ${extraRevisions} extra round${extraRevisions > 1 ? "s" : ""}` : null,
      rushFee ? `Rush fee:    Yes (+30%)" ` : null,
      digitalLicense ? "Digital file license included" : null,
      "─────────────────────────────────────",
      `Total:       ${fmt$(Math.round(finalPrice))}`,
      "",
      "Prices are estimates. Final quote may vary based on design complexity and final details.",
      "— GutierrezByJanelle",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 sticky top-4">
      {/* Big total */}
      <div className="text-center mb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Quote</p>
        <p className="font-squarepeg text-5xl">{fmt$(Math.round(finalPrice))}</p>
        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mt-2", marginBadge)}>
          <span>{marginIcon}</span>
          <span>{fmtPct(netMargin)} net margin · {marginLabel}</span>
        </div>
      </div>

      <Divider strong />

      {/* Breakdown */}
      <div>
        {/* Printing */}
        {baseResult.printLines.length > 0 && (
          <>
            <SectionLabel>Printing</SectionLabel>
            {baseResult.printLines.map((line, i) => (
              <Row
                key={i}
                indent
                label={line.label}
                math={`${line.qty} × ${fmt$2(line.costPer)} × ${line.markup.toFixed(2)}×`}
                value={fmt$2(line.revenue)}
                dim
              />
            ))}
            {baseResult.printLines.length > 1 && (
              <Row label="Print subtotal" value={fmt$2(baseResult.printRevenue)} dim />
            )}
          </>
        )}

        {/* DIY Digital — labor */}
        {pkg === "diy" && (
          <>
            <SectionLabel>Labor</SectionLabel>
            <Row
              indent
              label="Design & export"
              math={`${baseResult.hours}h × ${fmt$(assumptions.hourly)}/hr`}
              value={fmt$2(baseResult.laborCost)}
              dim
            />
          </>
        )}

        {/* Shipping */}
        {baseResult.shipRevenue > 0 && (
          <>
            <SectionLabel>Shipping</SectionLabel>
            <Row
              indent
              label="Flat rate shipping"
              math={`${fmt$(assumptions.shipBase)} × ${(1 + assumptions.shipProfit / 100).toFixed(2)}×`}
              value={fmt$2(baseResult.shipRevenue)}
              dim
            />
          </>
        )}

        {/* Design / item fees */}
        {baseResult.feeLines.length > 0 && (
          <>
            <SectionLabel>{mode === "fresh" ? "Design Fees (fresh artwork)" : "Item Fees (reuse existing)"}</SectionLabel>
            {baseResult.feeLines.map((line, i) => (
              <Row key={i} indent label={line.label} value={fmt$2(line.amount)} dim />
            ))}
            {digitalLicense && (
              <Row
                indent
                label="Digital file license ×1.3"
                math={`${fmt$2(baseResult.itemFees)} × 1.3`}
                value={`+${fmt$2(digitalBonus)}`}
                dim
              />
            )}
            {baseResult.feeLines.length > 1 && (
              <Row label="Fees subtotal" value={fmt$2(effectiveItemFees)} dim />
            )}
          </>
        )}

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <>
            <SectionLabel>Add-ons</SectionLabel>
            {selectedAddOns.map(({ key, label, result }) => (
              <div key={key} className="pl-3 py-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-foreground/80">{label}</span>
                  <span className="font-mono tabular-nums text-sm text-foreground/80">{fmt$2(result.price)}</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground/70 tabular-nums">
                  {result.qty} units × {fmt$2(result.costPer)} × {result.markup.toFixed(2)}×
                  {result.itemFee > 0 ? ` + fee ${fmt$2(result.itemFee)}` : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Extras */}
        {extraRevisions > 0 && (
          <>
            <SectionLabel>Extras</SectionLabel>
            <Row
              indent
              label={`Revision rounds ×${extraRevisions}`}
              math={`${extraRevisions} × ${fmt$(assumptions.feeR)}`}
              value={`+${fmt$2(revisionsTotal)}`}
              dim
            />
          </>
        )}

        {rushFee && (
          <>
            {extraRevisions === 0 && <SectionLabel>Extras</SectionLabel>}
            <Row
              indent
              label="Rush fee (+30%)"
              math={`${fmt$2(subtotalBeforeRush)} × 1.30`}
              value={`+${fmt$2(rushAmount)}`}
              dim
            />
          </>
        )}

        <Divider strong />
        <Row label="Total client pays" value={fmt$2(finalPrice)} bold />
        <Divider />

        {/* Your costs */}
        <SectionLabel>Your costs</SectionLabel>
        {totalPrintCost > 0 && (
          <Row indent label="Print cost (ink + paper)" value={fmt$2(totalPrintCost)} dim />
        )}
        {baseResult.shipCost > 0 && (
          <Row indent label="Shipping cost (carrier)" value={fmt$2(baseResult.shipCost)} dim />
        )}
        {baseResult.pkgMaterials > 0 && (
          <Row indent label="Packaging materials" value={fmt$2(baseResult.pkgMaterials)} dim />
        )}
        <Row
          indent
          label="Labor"
          math={`${baseResult.hours}h × ${fmt$(assumptions.hourly)}/hr`}
          value={fmt$2(baseResult.laborCost)}
          dim
        />
        <Row label="Total your costs" value={fmt$2(yourCosts)} dim />

        <Divider />
        <Row
          label="Net profit"
          value={fmt$2(netProfit)}
          bold
        />
        <p
          className={cn(
            "text-xs text-right mt-0.5 tabular-nums font-mono",
            marginDiff >= 0 ? "text-green-700" : marginDiff >= -5 ? "text-amber-700" : "text-red-700"
          )}
        >
          {fmtPct(netMargin)} net margin (target {fmtPct(assumptions.target)})
        </p>
      </div>

      {/* Copy button */}
      <button
        onClick={copyQuoteSummary}
        className="mt-5 w-full rounded-lg border border-border py-2.5 text-sm normal-case tracking-normal hover:bg-muted transition-colors"
      >
        {copied ? "✓ Copied to clipboard!" : "Copy client quote summary"}
      </button>
    </div>
  );
}
