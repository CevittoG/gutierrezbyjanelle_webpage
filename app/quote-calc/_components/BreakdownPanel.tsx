"use client";

import { useState } from "react";
import {
  CatalogItem,
  PricingMode,
  QuoteState,
  PACKAGES,
  ITEM_CATALOG,
  fmt$,
  fmt$2,
  fmtPct,
  fmtTime,
} from "@/lib/quote-calc-logic";
import type { PackageLineResult, QuoteBreakdown } from "@/lib/quote-calc-totals";
import { cn } from "@/utils";

interface Props {
  breakdown: QuoteBreakdown;
  mode: PricingMode;
  assumptions: QuoteState;
  extraRevisions: number;
  digitalLicense: boolean;
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

// The package name as shown on a line, with the chosen item appended for
// Individual Item lines so two such lines read distinctly.
function lineTitle(line: PackageLineResult, catalog: CatalogItem[]): string {
  const name = PACKAGES[line.pkg]?.name ?? line.pkg;
  if (line.pkg === "individual") {
    const item = catalog.find((i) => i.key === (line.individualItem ?? "iInvite"))?.label;
    return item ? `${name} · ${item}` : name;
  }
  return name;
}

// Per-line cost buildup: variable costs → markups → adjustments → line total.
function PackageLineBlock({
  line,
  assumptions,
  mode,
  digitalLicense,
  extraRevisions,
  sheetNote,
  showHeader,
  catalog,
}: {
  line: PackageLineResult;
  assumptions: QuoteState;
  mode: PricingMode;
  digitalLicense: boolean;
  extraRevisions: number;
  sheetNote: string;
  showHeader: boolean;
  catalog: CatalogItem[];
}) {
  const r = line.result;
  const isReuse = mode === "reuse";
  const dlFactor = assumptions.digitalLicensePtg / 100;

  const displayFullDesign = r.totalFullDesignLabor + (digitalLicense ? r.totalFullDesignLabor * dlFactor : 0);
  const displayFullVariable = r.totalFullVariable + (digitalLicense ? r.totalFullDesignLabor * dlFactor : 0);
  const reuseDisplaySavings = isReuse ? r.reuseDiscount + (digitalLicense ? r.reuseDiscount * dlFactor : 0) : 0;
  const combinedDiscountPtg =
    r.discountPtg + r.vendorIncentivePtg + r.packageDiscountPtg + r.familyFriendsPtg;
  const activeDiscountCount =
    (r.discountPtg > 0 ? 1 : 0) +
    (r.vendorIncentivePtg > 0 ? 1 : 0) +
    (r.packageDiscountPtg > 0 ? 1 : 0) +
    (r.familyFriendsPtg > 0 ? 1 : 0);

  return (
    <div className={cn(showHeader && "rounded-lg border border-border bg-muted/20 p-3 mt-3")}>
      {showHeader && (
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="font-squarepeg text-lg leading-tight">{lineTitle(line, catalog)}</span>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">{line.qty} qty</span>
        </div>
      )}

      {/* ─── VARIABLE COSTS (show full design, no reuse applied) ─── */}
      <SectionLabel>Variable Costs</SectionLabel>

      {displayFullDesign > 0 && (
        <>
          <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Design labor</p>
          {r.itemBreakdown.filter((b) => b.fullDesignLabor > 0).map((b, i) => (
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
            <Row indent label={`Digital file license x${(1 + dlFactor).toFixed(1)}`} math={`${fmt$2(r.totalFullDesignLabor)} × ${assumptions.digitalLicensePtg}%`} value={`+${fmt$2(r.totalFullDesignLabor * dlFactor)}`} dim />
          )}
          <Row label="Design subtotal" value={fmt$2(displayFullDesign)} dim />
        </>
      )}

      {!r.isDigital && r.totalProductionLabor > 0 && (
        <>
          <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Production labor</p>
          {r.itemBreakdown.filter((b) => b.productionLabor > 0).map((b, i) => (
            <Row
              key={i}
              indent
              label={b.label}
              math={`${b.qty} x ${fmtTime(b.prodMin)} x $${assumptions.hourly}/hr`}
              value={fmt$2(b.productionLabor)}
              dim
            />
          ))}
          <Row label="Production subtotal" value={fmt$2(r.totalProductionLabor)} dim />
        </>
      )}

      {!r.isDigital && r.totalMaterials > 0 && (
        <>
          <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">
            Materials{sheetNote}
          </p>
          {r.itemBreakdown.filter((b) => b.materialsCost > 0).map((b, i) => (
            <Row
              key={i}
              indent
              label={b.label}
              math={`${b.qty} x $${b.materialPerUnitBase.toFixed(2)}/u x ${(1 + assumptions.errorMarginPtg / 100).toFixed(2)} err`}
              value={fmt$2(b.materialsCost)}
              dim
            />
          ))}
          <Row label="Materials subtotal" value={fmt$2(r.totalMaterials)} dim />
        </>
      )}

      {r.packaging > 0 && (
        <Row indent label="Packaging" value={fmt$2(r.packaging)} dim />
      )}

      {r.revisionLabor > 0 && (
        <Row
          indent
          label={`Revision rounds x${extraRevisions}`}
          math={`${extraRevisions} x ${fmtTime(assumptions.revisionMin)} x $${assumptions.hourly}/hr`}
          value={fmt$2(r.revisionLabor)}
          dim
        />
      )}

      <Divider />
      <Row label="Variable cost total" value={fmt$2(displayFullVariable)} dim />

      {/* ─── MARKUPS ─── */}
      <SectionLabel>Markups</SectionLabel>
      <Row indent label={`Admin overhead (${fmtPct(assumptions.adminPtg)})`} value={`+${fmt$2(line.adjustedAdmin)}`} dim />
      <Row indent label={`Target profit (${fmtPct(assumptions.targetProfitPtg)})`} value={`+${fmt$2(line.adjustedProfit)}`} dim />

      {/* ─── ADJUSTMENTS ─── */}
      {(reuseDisplaySavings > 0 || activeDiscountCount > 0) && (
        <SectionLabel>Adjustments</SectionLabel>
      )}

      {isReuse && reuseDisplaySavings > 0 && (
        <Row
          indent
          label={`Reuse design (x${assumptions.reuseFactor})`}
          math={`${fmt$2(displayFullDesign)} × ${(1 - assumptions.reuseFactor).toFixed(2)}`}
          value={`-${fmt$2(reuseDisplaySavings)}`}
          dim
        />
      )}

      {r.discountPtg > 0 && (
        <Row
          indent
          label={`${PACKAGES[line.pkg]?.name ?? line.pkg} discount (-${fmtPct(r.discountPtg)})`}
          value={`-${fmt$2(line.discountAmount)}`}
          dim
        />
      )}

      {r.vendorIncentivePtg > 0 && (
        <Row
          indent
          label={`Vendor incentive (-${fmtPct(r.vendorIncentivePtg)})`}
          value={`-${fmt$2(line.vendorAmount)}`}
          dim
        />
      )}

      {r.packageDiscountPtg > 0 && (
        <Row
          indent
          label={`Package discount (-${fmtPct(r.packageDiscountPtg)})`}
          value={`-${fmt$2(line.packageDiscountAmount)}`}
          dim
        />
      )}

      {r.familyFriendsPtg > 0 && (
        <Row
          indent
          label={`Family & friends discount (-${fmtPct(r.familyFriendsPtg)})`}
          value={`-${fmt$2(line.familyFriendsAmount)}`}
          dim
        />
      )}

      {activeDiscountCount > 1 && (
        <Row indent label="Combined discount" value={`-${fmtPct(combinedDiscountPtg)}`} dim />
      )}

      <Divider />
      <Row label="Line total" value={fmt$2(line.linePrice)} bold />
    </div>
  );
}

export function BreakdownPanel({
  breakdown,
  mode,
  assumptions,
  extraRevisions,
  digitalLicense,
  fullColor,
  customPaper,
  catalog = ITEM_CATALOG,
  embedded,
}: Props) {
  const [copied, setCopied] = useState(false);

  const lines = breakdown.packageLines;
  const multiLine = lines.length > 1;

  // Sheet cost note (full color / custom paper apply quote-wide).
  const sheetNotes: string[] = [];
  if (fullColor) sheetNotes.push(`full color x${assumptions.fullColorFactor}`);
  if (customPaper) sheetNotes.push(`custom paper x${assumptions.customPaperFactor}`);
  const sheetNote = sheetNotes.length > 0 ? ` (${sheetNotes.join(", ")})` : "";

  // Aggregates across all package lines.
  const sum = (sel: (l: PackageLineResult) => number) => lines.reduce((s, l) => s + sel(l), 0);
  const aggDesignLabor = sum((l) => l.result.totalDesignLabor);
  const aggDigitalBonus = breakdown.digitalBonus;
  const aggProductionLabor = sum((l) => l.result.totalProductionLabor);
  const aggMaterialsPackaging = sum((l) => l.result.totalMaterials + l.result.packaging);
  const aggRevisionLabor = sum((l) => l.result.revisionLabor);
  const anyPhysical = lines.some((l) => !l.result.isDigital);

  // Add-ons
  const addOnLines = breakdown.addOnLines;
  const visibleMisc = breakdown.miscLines;
  const addOnsMaterials = addOnLines.reduce((s, a) => s + a.result.materialsCost, 0);
  const addOnsLabor = addOnLines.reduce((s, a) => s + a.result.designLabor + a.result.productionLabor, 0);

  const subtotalBeforeRush = breakdown.subtotalBeforeRush;
  const rushAmount = breakdown.rushAmount;
  const finalPrice = breakdown.finalPrice;

  // Your costs
  const yourCosts =
    sum((l) => l.result.totalDirectCosts + l.result.totalLaborCost + l.digitalBonus) +
    addOnsMaterials +
    addOnsLabor;
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

  function copyQuoteSummary() {
    const packageLabels = lines
      .map((l) => `${lineTitle(l, catalog)} (${l.qty})`)
      .join(", ");
    const includeNames = lines
      .flatMap((l) => {
        if (l.pkg === "individual") {
          const item = catalog.find((i) => i.key === (l.individualItem ?? "iInvite"))?.label;
          return item ? [item] : [];
        }
        return PACKAGES[l.pkg].items.map((it) =>
          typeof it === "string"
            ? catalog.find((i) => i.key === it)?.label
            : it.displayLabel || catalog.find((i) => i.key === it.key)?.label,
        );
      })
      .filter(Boolean)
      .join(", ");
    const addOnNames = addOnLines.map((a) => `${a.label} (${a.qty})`).join(", ");
    const miscNames = visibleMisc
      .map((m) => `${m.label || "Custom item"} (${m.qty} × $${m.unitPrice.toFixed(2)})`)
      .join(", ");

    const summaryLines = [
      "GutierrezByJanelle - Quote Summary",
      String.fromCharCode(9472).repeat(37),
      `Packages:    ${packageLabels}`,
      `Mode:        ${mode === "fresh" ? "Custom design (fresh artwork)" : "Reuse existing design"}`,
      `Includes:    ${includeNames}`,
      addOnNames ? `Add-ons:     ${addOnNames}` : null,
      miscNames ? `Custom:      ${miscNames}` : null,
      extraRevisions > 0 ? `Revisions:   ${extraRevisions} extra round${extraRevisions > 1 ? "s" : ""}` : null,
      rushAmount > 0 ? `Rush fee:    Yes (+${assumptions.rushFeePtg}%)` : null,
      digitalLicense ? "Digital file license included" : null,
      lines[0]?.result.vendorIncentivePtg ? `Vendor referral discount: ${lines[0].result.vendorIncentivePtg}%` : null,
      lines[0]?.result.packageDiscountPtg ? `Package discount: ${lines[0].result.packageDiscountPtg}%` : null,
      lines[0]?.result.familyFriendsPtg ? `Family & friends discount: ${lines[0].result.familyFriendsPtg}%` : null,
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

    navigator.clipboard.writeText(summaryLines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div
      className={cn(
        embedded
          ? ""
          : "rounded-xl border border-border bg-card p-5 sticky top-20"
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
        {/* Per-package buildup */}
        {multiLine && (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {lines.length} packages
          </p>
        )}
        {lines.map((l) => (
          <PackageLineBlock
            key={l.id}
            line={l}
            assumptions={assumptions}
            mode={mode}
            digitalLicense={digitalLicense}
            extraRevisions={extraRevisions}
            sheetNote={sheetNote}
            showHeader={multiLine}
            catalog={catalog}
          />
        ))}

        {multiLine && (
          <>
            <Divider />
            <Row label="Packages subtotal" value={fmt$2(breakdown.basePriceAdjusted)} dim />
          </>
        )}

        {/* Add-ons */}
        {(addOnLines.length > 0 || visibleMisc.length > 0) && (
          <>
            <SectionLabel>Add-ons</SectionLabel>
            {addOnLines.map(({ key, label, qty: addOnQty, result }) => (
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
                value={`+${fmt$2(m.total)}`}
                dim
              />
            ))}
          </>
        )}

        {/* Rush */}
        {rushAmount > 0 && (
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
        {anyPhysical && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2 normal-case tracking-normal">
            Remember to add shipping based on carrier quote
          </p>
        )}

        <Divider />

        {/* ─── YOUR COSTS (aggregate) ─── */}
        <SectionLabel>Your costs</SectionLabel>

        {aggDesignLabor > 0 && (
          <Row indent label="Design labor" value={fmt$2(aggDesignLabor)} dim />
        )}

        {digitalLicense && aggDigitalBonus > 0 && (
          <Row indent label="Digital license" value={fmt$2(aggDigitalBonus)} dim />
        )}

        {aggProductionLabor > 0 && (
          <Row indent label="Production labor" value={fmt$2(aggProductionLabor)} dim />
        )}

        {aggMaterialsPackaging > 0 && (
          <Row indent label="Materials + packaging" value={fmt$2(aggMaterialsPackaging)} dim />
        )}

        {aggRevisionLabor > 0 && (
          <Row
            indent
            label="Revisions"
            math={`${extraRevisions} × ${fmtTime(assumptions.revisionMin)} × $${assumptions.hourly}/hr`}
            value={fmt$2(aggRevisionLabor)}
            dim
          />
        )}

        {(addOnsMaterials + addOnsLabor) > 0 && (
          <Row indent label="Add-on costs" value={fmt$2(addOnsMaterials + addOnsLabor)} dim />
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
