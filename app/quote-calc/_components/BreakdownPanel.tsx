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
  fmtTime,
} from "@/lib/quote-calc-logic";
import { MiscAddOn } from "@/lib/quote-calc-drafts";
import { cn } from "@/utils";

interface SelectedAddOn {
  key: string;
  label: string;
  qty: number;
  result: AddOnResult;
}

interface Props {
  pkg: PkgKey;
  mode: PricingMode;
  qty: number;
  assumptions: QuoteState;
  baseResult: PackageResult;
  selectedAddOns: SelectedAddOn[];
  miscAddOns: MiscAddOn[];
  rushFee: boolean;
  extraRevisions: number;
  digitalLicense: boolean;
  vendorIncentive: boolean;
  fullColor: boolean;
  customPaper: boolean;
  /** Catalog at the time the breakdown is rendered. Falls back to bundled defaults. */
  catalog?: CatalogItem[];
  /** When true, render without the sticky/card chrome (used inside the mobile sheet). */
  embedded?: boolean;
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
  miscAddOns,
  rushFee,
  extraRevisions,
  digitalLicense,
  vendorIncentive,
  fullColor,
  customPaper,
  catalog = ITEM_CATALOG,
  embedded,
}: Props) {
  const [copied, setCopied] = useState(false);

  const pkgDef = PACKAGES[pkg];
  const isReuse = mode === "reuse";

  const dlFactor = assumptions.digitalLicensePtg / 100;

  // Digital license bonus: configurable % on design labor (applied to actual, not full)
  const digitalBonus = digitalLicense ? baseResult.totalDesignLabor * dlFactor : 0;

  // Recalculate with digital bonus
  const adjustedVariable = baseResult.totalVariable + digitalBonus;
  const adjustedAdmin = adjustedVariable * (assumptions.adminPtg / 100);
  const adjustedProfit = (adjustedVariable + adjustedAdmin) * (assumptions.targetProfitPtg / 100);
  const adjustedBeforeDiscount = adjustedVariable + adjustedAdmin + adjustedProfit;

  const discountAmount = adjustedBeforeDiscount * (baseResult.discountPtg / 100);
  const vendorAmount = adjustedBeforeDiscount * (baseResult.vendorIncentivePtg / 100);
  const combinedDiscountPtg = baseResult.discountPtg + baseResult.vendorIncentivePtg;
  const basePriceAdjusted = adjustedBeforeDiscount * (1 - combinedDiscountPtg / 100);

  // For display: full design labor (no reuse) + digital bonus
  const displayFullDesign = baseResult.totalFullDesignLabor + (digitalLicense ? baseResult.totalFullDesignLabor * dlFactor : 0);
  const displayFullVariable = baseResult.totalFullVariable + (digitalLicense ? baseResult.totalFullDesignLabor * dlFactor : 0);
  const reuseDisplaySavings = isReuse ? baseResult.reuseDiscount + (digitalLicense ? baseResult.reuseDiscount * dlFactor : 0) : 0;

  // Summary totals for YOUR COSTS formulas
  const totalDesignMin = baseResult.itemBreakdown.reduce((s, b) => s + b.designMin, 0);
  const totalProdMinQty = baseResult.itemBreakdown.reduce((s, b) => s + b.prodMin * b.qty, 0);

  // Add-ons
  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.result.price, 0);
  const addOnsMaterials = selectedAddOns.reduce((s, a) => s + a.result.materialsCost, 0);
  const addOnsLabor = selectedAddOns.reduce((s, a) => s + a.result.designLabor + a.result.productionLabor, 0);

  // Misc add-ons (selling price, no markup)
  const visibleMisc = miscAddOns.filter((m) => m.qty > 0 && m.unitPrice > 0);
  const miscTotal = visibleMisc.reduce((s, m) => s + m.qty * m.unitPrice, 0);

  // Rush
  const subtotalBeforeRush = basePriceAdjusted + addOnsTotal;
  const rushAmount = rushFee ? subtotalBeforeRush * (assumptions.rushFeePtg / 100) : 0;
  const finalPrice = subtotalBeforeRush + rushAmount + miscTotal;

  // Your costs
  const totalDirectCosts = baseResult.totalDirectCosts + addOnsMaterials;
  const totalLabor = baseResult.totalLaborCost + addOnsLabor + digitalBonus;
  const yourCosts = totalDirectCosts + totalLabor;
  const netProfit = finalPrice - yourCosts;
  const netMargin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;

  const marginTarget = assumptions.targetProfitPtg;
  const marginDiff = netMargin - marginTarget;
  const marginBadge =
    marginDiff >= 0
      ? "bg-green-100 text-green-800 border border-green-200"
      : marginDiff >= -5
      ? "bg-amber-100 text-amber-800 border border-amber-200"
      : "bg-red-100 text-red-800 border border-red-200";
  const marginIcon = marginDiff >= 0 ? "+" : marginDiff >= -5 ? "~" : "-";
  const marginLabel = `${Math.abs(Math.round(marginDiff))} pts ${marginDiff >= 0 ? "above" : "below"} target`;

  // Sheet cost note
  const sheetNotes: string[] = [];
  if (fullColor) sheetNotes.push(`full color x${assumptions.fullColorFactor}`);
  if (customPaper) sheetNotes.push(`custom paper x${assumptions.customPaperFactor}`);
  const sheetNote = sheetNotes.length > 0 ? ` (${sheetNotes.join(", ")})` : "";

  function copyQuoteSummary() {
    const packageItems = pkgDef.items
      .map((it) => {
        if (typeof it === "string") {
          return catalog.find((i) => i.key === it)?.label;
        }
        return it.displayLabel || catalog.find((i) => i.key === it.key)?.label;
      })
      .filter(Boolean)
      .join(", ");
    const addOnNames = selectedAddOns.map((a) => `${a.label} (${a.qty})`).join(", ");
    const miscNames = visibleMisc
      .map((m) => `${m.label || "Custom item"} (${m.qty} × $${m.unitPrice.toFixed(2)})`)
      .join(", ");

    const lines = [
      "GutierrezByJanelle - Quote Summary",
      String.fromCharCode(9472).repeat(37),
      `Package:     ${pkgDef.name}`,
      `Mode:        ${mode === "fresh" ? "Custom design (fresh artwork)" : "Reuse existing design"}`,
      `Quantity:    ${qty} households`,
      `Includes:    ${packageItems}`,
      addOnNames ? `Add-ons:     ${addOnNames}` : null,
      miscNames ? `Custom:      ${miscNames}` : null,
      extraRevisions > 0 ? `Revisions:   ${extraRevisions} extra round${extraRevisions > 1 ? "s" : ""}` : null,
      rushFee ? `Rush fee:    Yes (+${assumptions.rushFeePtg}%)` : null,
      digitalLicense ? "Digital file license included" : null,
      vendorIncentive ? `Vendor referral discount: ${assumptions.vendorIncentivePtg}%` : null,
      fullColor ? "Full color designs" : null,
      customPaper ? "Custom paper" : null,
      String.fromCharCode(9472).repeat(37),
      `Total:       ${fmt$(Math.round(finalPrice))}`,
      "",
      "* Shipping not included - added based on carrier quote.",
      "Prices are estimates. Final quote may vary based on design complexity and final details.",
      "- GutierrezByJanelle",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div
      className={cn(
        embedded
          ? ""
          : "rounded-xl border border-border bg-card p-5 sticky top-4"
      )}
    >
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

      <div>
        {/* ─── VARIABLE COSTS (show full design, no reuse applied) ─── */}
        <SectionLabel>Variable Costs</SectionLabel>

        {/* Design labor — always shown at FULL rate */}
        {displayFullDesign > 0 && (
          <>
            <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Design labor</p>
            {baseResult.itemBreakdown.filter((b) => b.fullDesignLabor > 0).map((b, i) => (
              <Row
                key={i}
                indent
                label={b.label}
                math={`${fmtTime(b.designMin)} x $${assumptions.hourly}/hr`}
                value={fmt$2(b.fullDesignLabor)}
                dim
              />
            ))}
            {digitalLicense && (
              <Row indent label={`Digital file license x${(1 + dlFactor).toFixed(1)}`} math={`${fmt$2(baseResult.totalFullDesignLabor)} × ${assumptions.digitalLicensePtg}%`} value={`+${fmt$2(baseResult.totalFullDesignLabor * dlFactor)}`} dim />
            )}
            <Row label="Design subtotal" value={fmt$2(displayFullDesign)} dim />
          </>
        )}

        {/* Production labor */}
        {!baseResult.isDigital && baseResult.totalProductionLabor > 0 && (
          <>
            <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Production labor</p>
            {baseResult.itemBreakdown.filter((b) => b.productionLabor > 0).map((b, i) => (
              <Row
                key={i}
                indent
                label={b.label}
                math={`${b.qty} x ${fmtTime(b.prodMin)} x $${assumptions.hourly}/hr`}
                value={fmt$2(b.productionLabor)}
                dim
              />
            ))}
            <Row label="Production subtotal" value={fmt$2(baseResult.totalProductionLabor)} dim />
          </>
        )}

        {/* Materials — show error margin and sheet cost multipliers */}
        {!baseResult.isDigital && baseResult.totalMaterials > 0 && (
          <>
            <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">
              Materials{sheetNote}
            </p>
            {baseResult.itemBreakdown.filter((b) => b.materialsCost > 0).map((b, i) => (
              <Row
                key={i}
                indent
                label={b.label}
                math={`${b.qty} x $${b.materialPerUnitBase.toFixed(2)}/u x ${(1 + assumptions.errorMarginPtg / 100).toFixed(2)} err`}
                value={fmt$2(b.materialsCost)}
                dim
              />
            ))}
            <Row label="Materials subtotal" value={fmt$2(baseResult.totalMaterials)} dim />
          </>
        )}

        {/* Packaging */}
        {baseResult.packaging > 0 && (
          <Row indent label="Packaging" value={fmt$2(baseResult.packaging)} dim />
        )}

        {/* Revision labor */}
        {baseResult.revisionLabor > 0 && (
          <Row
            indent
            label={`Revision rounds x${extraRevisions}`}
            math={`${extraRevisions} x ${fmtTime(assumptions.revisionMin)} x $${assumptions.hourly}/hr`}
            value={fmt$2(baseResult.revisionLabor)}
            dim
          />
        )}

        <Divider />
        <Row label="Variable cost total" value={fmt$2(displayFullVariable)} dim />

        {/* ─── MARKUPS ─── */}
        <SectionLabel>Markups</SectionLabel>
        <Row
          indent
          label={`Admin overhead (${fmtPct(assumptions.adminPtg)})`}
          value={`+${fmt$2(adjustedAdmin)}`}
          dim
        />
        <Row
          indent
          label={`Target profit (${fmtPct(assumptions.targetProfitPtg)})`}
          value={`+${fmt$2(adjustedProfit)}`}
          dim
        />

        {/* ─── ADJUSTMENTS (all discounts / surcharges) ─── */}
        <SectionLabel>Adjustments</SectionLabel>

        {isReuse && reuseDisplaySavings > 0 && (
          <Row
            indent
            label={`Reuse design (x${assumptions.reuseFactor})`}
            math={`${fmt$2(displayFullDesign)} × ${(1 - assumptions.reuseFactor).toFixed(2)}`}
            value={`-${fmt$2(reuseDisplaySavings)}`}
            dim
          />
        )}

        {baseResult.discountPtg > 0 && (
          <Row
            indent
            label={`${pkgDef.name} discount (-${fmtPct(baseResult.discountPtg)})`}
            value={`-${fmt$2(discountAmount)}`}
            dim
          />
        )}

        {baseResult.vendorIncentivePtg > 0 && (
          <Row
            indent
            label={`Vendor incentive (-${fmtPct(baseResult.vendorIncentivePtg)})`}
            value={`-${fmt$2(vendorAmount)}`}
            dim
          />
        )}

        {combinedDiscountPtg > 0 && baseResult.vendorIncentivePtg > 0 && (
          <Row
            indent
            label={`Combined discount`}
            value={`-${fmtPct(combinedDiscountPtg)}`}
            dim
          />
        )}

        {/* Add-ons */}
        {(selectedAddOns.length > 0 || visibleMisc.length > 0) && (
          <>
            <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Add-ons</p>
            {selectedAddOns.map(({ key, label, qty: addOnQty, result }) => (
              <Row
                key={key}
                indent
                label={`${label} · ${addOnQty} ${addOnQty === 1 ? "pc" : "pcs"}`}
                value={`+${fmt$2(result.price)}`}
                dim
              />
            ))}
            {visibleMisc.map((m) => (
              <Row
                key={m.id}
                indent
                label={`${m.label || "Custom item"} · ${m.qty} ${m.qty === 1 ? "pc" : "pcs"}`}
                math={`${m.qty} × $${m.unitPrice.toFixed(2)}`}
                value={`+${fmt$2(m.qty * m.unitPrice)}`}
                dim
              />
            ))}
          </>
        )}

        {/* Rush */}
        {rushFee && (
          <Row
            indent
            label={`Rush fee (+${fmtPct(assumptions.rushFeePtg)})`}
            math={`${fmt$2(subtotalBeforeRush)} x ${(1 + assumptions.rushFeePtg / 100).toFixed(2)}`}
            value={`+${fmt$2(rushAmount)}`}
            dim
          />
        )}

        <Divider strong />
        <Row label="Total client pays" value={fmt$2(finalPrice)} bold />

        {/* Shipping reminder */}
        {!baseResult.isDigital && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2 normal-case tracking-normal">
            Remember to add shipping based on carrier quote
          </p>
        )}

        <Divider />

        {/* ─── YOUR COSTS (summary with formulas) ─── */}
        <SectionLabel>Your costs</SectionLabel>

        {(baseResult.totalDesignLabor + digitalBonus) > 0 && (
          <Row
            indent
            label="Design labor"
            math={`${fmtTime(totalDesignMin)} × $${assumptions.hourly}/hr${isReuse ? ` × ${assumptions.reuseFactor}` : ""}`}
            value={fmt$2(baseResult.totalDesignLabor)}
            dim
          />
        )}

        {digitalLicense && digitalBonus > 0 && (
          <Row
            indent
            label="Digital license"
            math={`${fmt$2(baseResult.totalDesignLabor)} × ${assumptions.digitalLicensePtg}%`}
            value={fmt$2(digitalBonus)}
            dim
          />
        )}

        {!baseResult.isDigital && baseResult.totalProductionLabor > 0 && (
          <Row
            indent
            label="Production labor"
            math={`${fmtTime(totalProdMinQty)} × $${assumptions.hourly}/hr`}
            value={fmt$2(baseResult.totalProductionLabor)}
            dim
          />
        )}

        {!baseResult.isDigital && (baseResult.totalMaterials + baseResult.packaging) > 0 && (
          <Row
            indent
            label="Materials + packaging"
            value={fmt$2(baseResult.totalMaterials + baseResult.packaging)}
            dim
          />
        )}

        {baseResult.revisionLabor > 0 && (
          <Row
            indent
            label="Revisions"
            math={`${extraRevisions} × ${fmtTime(assumptions.revisionMin)} × $${assumptions.hourly}/hr`}
            value={fmt$2(baseResult.revisionLabor)}
            dim
          />
        )}

        <Divider />
        <Row label="Total your costs" value={fmt$2(yourCosts)} dim />
        {visibleMisc.length > 0 && (
          <p className="text-xs text-muted-foreground/70 italic mt-1 leading-snug">
            Custom add-ons are billed at the price you entered — treated as pure margin in this view.
          </p>
        )}

        <Divider />
        <Row label="Net profit" value={fmt$2(netProfit)} bold />
        <p
          className={cn(
            "text-xs text-right mt-0.5 tabular-nums font-mono",
            marginDiff >= 0 ? "text-green-700" : marginDiff >= -5 ? "text-amber-700" : "text-red-700"
          )}
        >
          {fmtPct(netMargin)} net margin (target {fmtPct(marginTarget)})
        </p>
      </div>

      {/* Copy button */}
      <button
        onClick={copyQuoteSummary}
        className="mt-5 w-full rounded-lg border border-border py-2.5 text-sm normal-case tracking-normal hover:bg-muted transition-colors"
      >
        {copied ? "Copied to clipboard!" : "Copy client quote summary"}
      </button>
    </div>
  );
}
