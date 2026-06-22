"use client";

import { useState } from "react";
import {
  CatalogItem,
  PricingMode,
  QuoteState,
  ITEM_CATALOG,
  fmt$,
  fmt$2,
  fmtPct,
  fmtTime,
} from "@/lib/quote-calc-logic";
import type { LineResult, QuoteBreakdown } from "@/lib/quote-calc-totals";
import { cn } from "@/utils";

interface Props {
  breakdown: QuoteBreakdown;
  mode: PricingMode;
  assumptions: QuoteState;
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

// Per-line cost buildup: variable cost → markups → the line's additive discount
// (bundle + relationship, biting labor only) → line total. Revisions, packaging,
// and the digital license are quote-level and shown once, below all the lines.
function LineBlock({
  line,
  assumptions,
  mode,
  showHeader,
}: {
  line: LineResult;
  assumptions: QuoteState;
  mode: PricingMode;
  showHeader: boolean;
}) {
  const c = line.cost;
  const isReuse = mode === "reuse";
  const reuseHint = isReuse ? ` × ${assumptions.reuseFactor} reuse` : "";

  return (
    <div className={cn(showHeader && "rounded-lg border border-border bg-muted/20 p-3 mt-3")}>
      {showHeader && (
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="font-squarepeg text-lg leading-tight">{line.label}</span>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {line.qty} {line.digital ? "design" : "qty"}
          </span>
        </div>
      )}

      {/* ─── VARIABLE COSTS ─── */}
      <SectionLabel>Variable Costs</SectionLabel>

      {c.totalDesignLabor > 0 && (
        <>
          <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Design labor</p>
          {c.itemBreakdown.filter((b) => b.designLabor > 0).map((b, i) => (
            <Row
              key={i}
              indent
              label={b.label}
              math={`${fmtTime(b.designMin)} x $${assumptions.hourly}/hr${reuseHint}`}
              value={fmt$2(b.designLabor)}
              dim
            />
          ))}
          <Row label="Design subtotal" value={fmt$2(c.totalDesignLabor)} dim />
        </>
      )}

      {!c.isDigital && c.totalProductionLabor > 0 && (
        <>
          <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Production labor</p>
          {c.itemBreakdown.filter((b) => b.productionLabor > 0).map((b, i) => (
            <Row
              key={i}
              indent
              label={b.label}
              math={`${b.qty} x ${fmtTime(b.prodMin)} x $${assumptions.hourly}/hr`}
              value={fmt$2(b.productionLabor)}
              dim
            />
          ))}
          <Row label="Production subtotal" value={fmt$2(c.totalProductionLabor)} dim />
        </>
      )}

      {!c.isDigital && c.totalMaterials > 0 && (
        <>
          <p className="text-xs text-muted-foreground/60 mt-2 mb-0.5 pl-3 uppercase tracking-wider">Materials</p>
          {c.itemBreakdown.filter((b) => b.materialsCost > 0).map((b, i) => (
            <Row
              key={i}
              indent
              label={b.label}
              math={`${b.qty} x $${b.materialPerUnitBase.toFixed(2)}/u x ${(1 + assumptions.errorMarginPtg / 100).toFixed(2)} err`}
              value={fmt$2(b.materialsCost)}
              dim
            />
          ))}
          <Row label="Materials subtotal" value={fmt$2(c.totalMaterials)} dim />
        </>
      )}

      <Divider />
      <Row label="Variable cost total" value={fmt$2(c.totalVariable)} dim />

      {/* ─── MARKUPS ─── */}
      <SectionLabel>Markups</SectionLabel>
      <Row indent label={`Admin overhead (${fmtPct(assumptions.adminPtg)})`} value={`+${fmt$2(line.admin)}`} dim />
      <Row indent label={`Target profit (${fmtPct(assumptions.targetProfitPtg)})`} value={`+${fmt$2(line.profit)}`} dim />

      {/* ─── DISCOUNTS (additive, labor-only) ─── */}
      {line.discountComponents.length > 0 && (
        <>
          <SectionLabel>Discounts · on labor {fmt$2(line.laborBase)}</SectionLabel>
          {line.discountComponents.map((d) => (
            <Row
              key={d.label}
              indent
              label={`${d.label === "Bundle" ? `${line.label} bundle` : d.label} (-${fmtPct(d.ptg)})`}
              value={`-${fmt$2(d.amount)}`}
              dim
            />
          ))}
          {line.discountComponents.length > 1 && (
            <Row
              indent
              label={`Combined (-${fmtPct(line.discountPtg)})`}
              value={`-${fmt$2(line.discountAmount)}`}
              dim
            />
          )}
        </>
      )}

      <Divider />
      <Row label="Line total" value={fmt$2(line.net)} bold />
    </div>
  );
}

export function BreakdownPanel({
  breakdown,
  mode,
  assumptions,
  catalog = ITEM_CATALOG,
  embedded,
}: Props) {
  const [copied, setCopied] = useState(false);

  const lines = breakdown.lines;
  const multiLine = lines.length > 1;
  const svc = breakdown.services;
  const hasServices = svc.servicesList > 0;

  // Your-costs aggregates (raw variable cost basis, before any markup).
  const sumL = (sel: (l: LineResult) => number) => lines.reduce((s, l) => s + sel(l), 0);
  const aggDesignLabor = breakdown.totalDesignLabor;
  const aggProductionLabor = sumL((l) => l.cost.totalProductionLabor);
  const aggMaterials = sumL((l) => l.cost.totalMaterials);

  const finalPrice = breakdown.finalPrice;
  const yourCosts = aggDesignLabor + aggProductionLabor + aggMaterials + svc.servicesVar;
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
    const lineLabels = lines.map((l) => `${l.label} (${l.qty})`).join(", ");
    const includeNames = lines
      .flatMap((l) => l.cost.itemBreakdown.map((b) => b.label))
      .filter(Boolean)
      .join(", ");
    const miscNames = breakdown.miscLines
      .map((m) => `${m.label || "Custom item"} (${m.qty} × $${m.unitPrice.toFixed(2)})`)
      .join(", ");
    const discountNames = [
      breakdown.bundleDiscountTotal > 0 ? "Bundle savings" : null,
      ...breakdown.relationshipDiscountLines.map((d) => `${d.label} ${d.ptg}%`),
    ]
      .filter(Boolean)
      .join(", ");

    const sep = String.fromCharCode(9472).repeat(37);
    const summaryLines = [
      "GutierrezByJanelle - Quote Summary",
      sep,
      `Items:       ${lineLabels}`,
      `Mode:        ${mode === "fresh" ? "Custom design (fresh artwork)" : "Reuse existing design"}`,
      `Includes:    ${includeNames}`,
      miscNames ? `Custom:      ${miscNames}` : null,
      svc.revisionCost > 0 ? "Revisions:   extra rounds included" : null,
      breakdown.rushAmount > 0 ? `Rush fee:    Yes (+${assumptions.rushFeePtg}%)` : null,
      svc.licenseVar > 0 ? "Digital file license included" : null,
      discountNames ? `Discounts:   ${discountNames}` : null,
      sep,
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
        {/* Per-line buildup */}
        {multiLine && (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {lines.length} lines
          </p>
        )}
        {lines.map((l) => (
          <LineBlock key={l.id} line={l} assumptions={assumptions} mode={mode} showHeader={multiLine} />
        ))}

        {multiLine && (
          <>
            <Divider />
            <Row label="Items subtotal" value={fmt$2(breakdown.itemsNet)} dim />
          </>
        )}

        {/* ─── PROJECT SERVICES (quote-level, once) ─── */}
        {hasServices && (
          <>
            <SectionLabel>Project services</SectionLabel>
            {svc.revisionCost > 0 && (
              <Row
                indent
                label="Revision rounds"
                math={`${fmtTime(assumptions.revisionMin)} × $${assumptions.hourly}/hr`}
                value={`+${fmt$2(svc.revisionCost)}`}
                dim
              />
            )}
            {svc.packaging > 0 && <Row indent label="Packaging (once)" value={`+${fmt$2(svc.packaging)}`} dim />}
            {svc.licenseVar > 0 && (
              <Row
                indent
                label={`Digital file license (+${fmtPct(assumptions.digitalLicensePtg)})`}
                value={`+${fmt$2(svc.licenseVar)}`}
                dim
              />
            )}
            <Row
              indent
              label={`Markup (admin + profit)`}
              value={`+${fmt$2(svc.adminAmount + svc.profitAmount)}`}
              dim
            />
            <Row label="Project services total" value={fmt$2(svc.servicesList)} dim />
          </>
        )}

        {/* Discounts are shown per line above (bundle + relationship, on labor).
            Surface the quote-wide savings once more, here, for a quick read. */}
        {breakdown.discountTotal > 0 && (
          <Row label="Total discounts" value={`-${fmt$2(breakdown.discountTotal)}`} dim />
        )}

        {/* Rush */}
        {breakdown.rushAmount > 0 && (
          <Row
            indent
            label={`Rush fee (+${fmtPct(assumptions.rushFeePtg)})`}
            math={`${fmt$2(breakdown.itemsNet + breakdown.services.servicesList)} x ${(1 + assumptions.rushFeePtg / 100).toFixed(2)}`}
            value={`+${fmt$2(breakdown.rushAmount)}`}
            dim
          />
        )}

        {/* Custom add-ons */}
        {breakdown.miscLines.length > 0 && (
          <>
            <SectionLabel>Custom add-ons</SectionLabel>
            {breakdown.miscLines.map((m) => (
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

        <Divider strong />
        <Row label="Total client pays" value={fmt$2(finalPrice)} bold />

        {/* Shipping reminder */}
        {breakdown.anyPhysical && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2 normal-case tracking-normal">
            Remember to add shipping based on carrier quote
          </p>
        )}

        <Divider />

        {/* ─── YOUR COSTS (aggregate) ─── */}
        <SectionLabel>Your costs</SectionLabel>

        {aggDesignLabor > 0 && <Row indent label="Design labor" value={fmt$2(aggDesignLabor)} dim />}
        {aggProductionLabor > 0 && <Row indent label="Production labor" value={fmt$2(aggProductionLabor)} dim />}
        {aggMaterials > 0 && <Row indent label="Materials" value={fmt$2(aggMaterials)} dim />}
        {svc.servicesVar > 0 && <Row indent label="Project services" value={fmt$2(svc.servicesVar)} dim />}

        <Divider />
        <Row label="Total your costs" value={fmt$2(yourCosts)} dim />
        {breakdown.miscLines.length > 0 && (
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
