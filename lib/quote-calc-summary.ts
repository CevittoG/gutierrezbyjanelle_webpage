// Human-readable summarizer for a saved Draft, used to populate the "Line items"
// column on the Quotes sheet tab.
//
// Pure function — no IO. Uses bundled `ITEM_CATALOG` / `PACKAGES` labels by
// default; pass a live catalog in if you want the summary to reflect names
// Janelle has renamed in the Items tab.

import type { Draft, DraftConfig, QuoteLine } from "./quote-calc-drafts";
import { CatalogItem, ITEM_CATALOG, PACKAGES } from "./quote-calc-logic";
import { countedMiscLines } from "./quote-calc-totals";

function labelFor(key: string, catalog: CatalogItem[], fallback?: string): string {
  return fallback || catalog.find((i) => i.key === key)?.label || key;
}

function fmtMoney(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function summarizeLineItems(
  d: Draft,
  catalog: CatalogItem[] = ITEM_CATALOG,
): string {
  const lines: string[] = [];

  // One block per quote line: a single item, or a bundle (header + its pieces).
  for (const line of d.config.lines) {
    if (line.kind === "item") {
      const label = labelFor(line.itemKey ?? "", catalog);
      const suffix = line.digital ? " (digital)" : "";
      lines.push(`${label}${suffix} — ${line.qty}`);
    } else {
      const pkgDef = line.pkg ? PACKAGES[line.pkg] : undefined;
      lines.push(`${pkgDef?.name ?? line.pkg ?? "Package"} — ${line.qty}`);
      for (const it of pkgDef?.items ?? []) {
        if (typeof it === "string") {
          lines.push(`  • ${labelFor(it, catalog)}`);
        } else {
          lines.push(`  • ${labelFor(it.key, catalog, it.displayLabel)}`);
        }
      }
    }
  }

  // Misc add-ons (free-form name + qty + unit price) — same counting rule as the engine.
  for (const m of countedMiscLines(d.config.miscAddOns, d.config.pricingVersion)) {
    const suffix = m.digital ? ", digital" : "";
    lines.push(`+ ${m.label} × ${m.qty} @ ${fmtMoney(m.unitPrice)} = ${fmtMoney(m.total)} (misc${suffix})`);
  }

  // Pricing modifiers worth surfacing.
  if (d.config.rushFee) lines.push("⚡ Rush fee applied");
  if (d.config.digitalLicense) lines.push("✓ Digital license");
  if (d.config.vendorIncentive) lines.push("✓ Vendor incentive");
  if (d.config.customDiscountPtg > 0) lines.push(`✓ Custom discount ${d.config.customDiscountPtg}%`);
  if (d.config.familyFriendsPtg > 0) lines.push(`✓ Family & friends discount ${d.config.familyFriendsPtg}%`);
  if (d.config.fullColor) lines.push("✓ Full color");
  if (d.config.customPaper) lines.push("✓ Custom paper");
  if (d.config.mode === "reuse") lines.push("↺ Reuse pricing");
  if (d.config.extraRevisions > 0) {
    lines.push(`✎ ${d.config.extraRevisions} extra revision${d.config.extraRevisions === 1 ? "" : "s"}`);
  }

  return lines.join("\n");
}

// Joined, human-readable line names for a quote. Collapses repeats into a count
// (e.g. "Games ×2 + Sweet Suite"). A quote with no catalog lines (custom add-ons
// only) falls back to `fallbackNames` — the add-on names — before "—".
export function packagesDisplayName(
  lines: QuoteLine[],
  catalog: CatalogItem[] = ITEM_CATALOG,
  fallbackNames: string[] = [],
): string {
  if (!lines || lines.length === 0) {
    return fallbackNames.length > 0 ? fallbackNames.join(" + ") : "—";
  }
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const l of lines) {
    const name =
      l.kind === "item"
        ? labelFor(l.itemKey ?? "", catalog)
        : (l.pkg ? PACKAGES[l.pkg]?.name : undefined) ?? l.pkg ?? "Package";
    if (!counts.has(name)) order.push(name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return order
    .map((name) => {
      const n = counts.get(name) ?? 1;
      return n > 1 ? `${name} ×${n}` : name;
    })
    .join(" + ");
}

// The quote's display name for the dashboard, the Sheet, and the client page:
// its catalog lines, or — for a custom-add-ons-only quote — the add-on names.
export function quoteDisplayName(
  config: Pick<DraftConfig, "lines" | "miscAddOns" | "pricingVersion">,
): string {
  const miscNames = countedMiscLines(config.miscAddOns, config.pricingVersion).map((m) => m.label);
  return packagesDisplayName(config.lines, ITEM_CATALOG, miscNames);
}
