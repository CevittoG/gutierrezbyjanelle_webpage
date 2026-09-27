"use client";

// "Set total…" (§9.2 ⑥): type the number to land on; the difference becomes
// the adjustment (label editable, shown to the client). Previews the health
// impact before applying. Inline, not a modal (DESIGN.md: modals last).

import { useMemo, useState } from "react";
import { computeTotals, setTargetTotal } from "@/lib/quote-engine";
import { computeHealth, HEALTH_GLYPH, HEALTH_LABEL } from "@/lib/quote-health";
import { formatMoney, formatMoney2 } from "@/lib/money";
import type { DraftConfigV5, HealthSnapshot } from "@/lib/quote-types";
import { NumberField } from "./fields";

export function SetTotalDialog({
  config,
  healthFallback,
  onApply,
  onClose,
}: {
  config: DraftConfigV5;
  healthFallback: HealthSnapshot;
  onApply: (next: DraftConfigV5) => void;
  onClose: () => void;
}) {
  const current = computeTotals(config).total;
  const [target, setTarget] = useState(Math.round(current));
  const [label, setLabel] = useState(config.adjustment?.label ?? "Courtesy adjustment");
  const preview = useMemo(() => {
    const next = setTargetTotal(config, target, label);
    const t = computeTotals(next);
    return { next, t, h: computeHealth(next, t, healthFallback) };
  }, [config, target, label, healthFallback]);
  const adj = preview.next.adjustment?.amount ?? 0;

  return (
    <div className="rounded-md border border-border bg-background p-3 space-y-3" aria-label="Set total">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="target-total" className="text-sm">Make the total</label>
        <NumberField id="target-total" label="Target total" value={target} prefix="$" onChange={setTarget} className="w-32" />
      </div>
      <div>
        <label htmlFor="adjustment-label" className="block text-xs text-muted-foreground mb-1">Label the client sees</label>
        <input
          id="adjustment-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {adj === 0 ? "No adjustment needed." : `${label || "Adjustment"}: ${formatMoney(adj, { signed: true })}. `}
        {preview.h.perHour !== null && (
          <>
            Then {HEALTH_GLYPH[preview.h.status]} {HEALTH_LABEL[preview.h.status].toLowerCase()}, about{" "}
            {formatMoney2(preview.h.perHour)}/hr.
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onApply(preview.next);
            onClose();
          }}
          className="h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:bg-ring transition-colors"
        >
          Apply
        </button>
        {config.adjustment && (
          <button
            type="button"
            onClick={() => {
              onApply({ ...config, adjustment: null });
              onClose();
            }}
            className="h-11 px-4 rounded-md border border-border text-sm hover:bg-muted"
          >
            Remove adjustment
          </button>
        )}
        <button type="button" onClick={onClose} className="h-11 px-4 rounded-md text-sm text-muted-foreground hover:bg-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
