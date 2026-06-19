// Human-readable summarizer for a saved Draft, used by Phase 2 of the
// roadmap to populate the "Line items" column on the Quotes sheet tab.
//
// Pure function — no IO. Uses bundled `ITEM_CATALOG` / `PACKAGES` labels by
// default; pass a live catalog in if you want the summary to reflect names
// Janelle has renamed in the Items tab.

import type { Draft, PackageLine } from "./quote-calc-drafts";
import { CatalogItem, ITEM_CATALOG, PACKAGES } from "./quote-calc-logic";

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

  // One block per package line: a header (name + qty) then its items.
  for (const line of d.config.packages) {
    const pkgDef = PACKAGES[line.pkg];
    lines.push(`${pkgDef?.name ?? line.pkg} — ${line.qty}`);
    if (line.pkg === "individual") {
      const cat = catalog.find((i) => i.key === line.individualItem);
      const label = cat?.label || line.individualItem || "Item";
      const suffix = line.individualDigital ? " (digital)" : "";
      lines.push(`  • ${label}${suffix}`);
    } else {
      for (const it of pkgDef.items) {
        if (typeof it === "string") {
          lines.push(`  • ${labelFor(it, catalog)}`);
        } else {
          lines.push(`  • ${labelFor(it.key, catalog, it.displayLabel)}`);
        }
      }
    }
  }

  // À-la-carte add-ons (with qty entered explicitly).
  for (const [key, qty] of Object.entries(d.config.addOns)) {
    if (qty > 0) {
      lines.push(`+ ${labelFor(key, catalog)} × ${qty} (add-on)`);
    }
  }

  // Misc add-ons (free-form name + qty + unit price).
  for (const m of d.config.miscAddOns ?? []) {
    if (m.qty > 0 && m.unitPrice > 0 && (m.label ?? "").trim().length > 0) {
      const total = m.qty * m.unitPrice;
      lines.push(`+ ${m.label.trim()} × ${m.qty} @ ${fmtMoney(m.unitPrice)} = ${fmtMoney(total)} (misc)`);
    }
  }

  // Pricing modifiers worth surfacing.
  if (d.config.rushFee) lines.push("⚡ Rush fee applied");
  if (d.config.digitalLicense) lines.push("✓ Digital license");
  if (d.config.vendorIncentive) lines.push("✓ Vendor incentive");
  if (d.config.fullColor) lines.push("✓ Full color");
  if (d.config.customPaper) lines.push("✓ Custom paper");
  if (d.config.mode === "reuse") lines.push("↺ Reuse pricing");
  if (d.config.extraRevisions > 0) {
    lines.push(`✎ ${d.config.extraRevisions} extra revision${d.config.extraRevisions === 1 ? "" : "s"}`);
  }

  return lines.join("\n");
}

// Joined, human-readable package names for a quote's lines. Collapses repeats
// into a count (e.g. "Individual Item ×2 + Sweet Suite").
export function packagesDisplayName(packages: PackageLine[]): string {
  if (!packages || packages.length === 0) return "—";
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const p of packages) {
    const name = PACKAGES[p.pkg]?.name ?? p.pkg;
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
