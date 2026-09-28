"use client";

// ② Start from: the suites in the Packages tab, filtered by event type
// (Wedding ⇒ wedding packages, anything else ⇒ event packages) with a toggle
// to show all. A chip appends an editable group; several are allowed.

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatPct } from "@/lib/money";
import type { PackageTemplate, PriceBook } from "@/lib/quote-pricebook";
import { cn } from "@/utils";

export function PackageChips({
  priceBook,
  eventType,
  onAdd,
}: {
  priceBook: PriceBook;
  eventType: string;
  onAdd: (pkg: PackageTemplate) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const want = eventType === "Wedding" ? "wedding" : "event";
  const active = priceBook.packages.filter((p) => p.active);
  const shown = showAll ? active : active.filter((p) => p.type === want);
  const hidden = active.length - shown.length;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {shown.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onAdd(pkg)}
            className={cn(
              "min-h-[44px] inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-left transition-colors hover:bg-muted",
            )}
          >
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-squarepeg text-2xl leading-none">{pkg.name}</span>
            {pkg.bundlePct > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">−{formatPct(pkg.bundlePct)}</span>
            )}
          </button>
        ))}
        {shown.length === 0 && (
          <p className="text-sm text-muted-foreground">No {want} packages in the price book yet.</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Or start blank and add single pieces below.</span>
        {(hidden > 0 || showAll) && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="min-h-[44px] underline underline-offset-4 hover:text-foreground"
          >
            {showAll ? `Only ${want} packages` : `Show all packages (${hidden} more)`}
          </button>
        )}
      </div>
    </div>
  );
}
