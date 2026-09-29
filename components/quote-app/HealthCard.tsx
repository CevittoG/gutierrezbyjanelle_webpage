// Pricing health (admin only; docs/quote-builder-redesign.md §7.1): what this
// quote pays Janelle per hour against her target and floor. Status is a label
// plus a glyph (✦ / ~ / !), never a traffic-light color; Powder Rose marks
// only the on-target state. Never rendered on /q or print.

import { HEALTH_GLYPH, HEALTH_LABEL, type QuoteHealth } from "@/lib/quote-health";
import { formatMoney, formatMoney2 } from "@/lib/money";
import { cn } from "@/utils";

function hours(h: number): string {
  return `${(Math.round(h * 10) / 10).toLocaleString("en-US")} h`;
}

export function HealthCard({ health, className }: { health: QuoteHealth; className?: string }) {
  const h = health;
  const onTarget = h.status === "on-target";
  return (
    <div className={cn("text-sm normal-case tracking-normal", className)}>
      <p className="flex items-baseline gap-2">
        <span
          aria-hidden
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
            onTarget ? "border-accent bg-accent text-accent-foreground" : "border-foreground/40 text-foreground",
          )}
        >
          {HEALTH_GLYPH[h.status]}
        </span>
        <span className="font-medium">{HEALTH_LABEL[h.status]}</span>
      </p>
      {h.perHour !== null ? (
        <p className="mt-1.5">
          Pays about <span className="font-mono tabular-nums">{formatMoney2(h.perHour)}/hr</span>
          <span className="text-muted-foreground">
            {" "}
            (target {formatMoney(h.hourlyTarget)}, floor {formatMoney(h.hourlyFloor)})
          </span>
        </p>
      ) : (
        <p className="mt-1.5 text-muted-foreground">
          None of these lines carry time estimates, so there is no hourly figure yet.
        </p>
      )}
      {h.estHours > 0 && (
        <p className="text-muted-foreground mt-0.5">
          ≈ {hours(h.estHours)} of work · costs ≈ {formatMoney(h.estMaterials + h.fees)}
        </p>
      )}
      {h.lowCoverage && h.perHour !== null && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Estimate covers {Math.round(h.coverage * 100)}% of this quote. Custom lines have no time estimate.
        </p>
      )}
      <details className="mt-2 group">
        <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground min-h-[44px] flex items-center">
          How this is estimated
        </summary>
        <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Design</dt>
          <dd className="font-mono tabular-nums text-right">{hours(h.designHours)}</dd>
          <dt className="text-muted-foreground">Production</dt>
          <dd className="font-mono tabular-nums text-right">{hours(h.productionHours)}</dd>
          <dt className="text-muted-foreground">Revisions</dt>
          <dd className="font-mono tabular-nums text-right">{hours(h.revisionHours)}</dd>
          <dt className="text-muted-foreground">Revenue (less shipping, packaging)</dt>
          <dd className="font-mono tabular-nums text-right">{formatMoney2(h.netRevenue)}</dd>
          <dt className="text-muted-foreground">Materials (estimate)</dt>
          <dd className="font-mono tabular-nums text-right">−{formatMoney2(h.estMaterials)}</dd>
          <dt className="text-muted-foreground">Fees ({h.feesPct}%)</dt>
          <dd className="font-mono tabular-nums text-right">−{formatMoney2(h.fees)}</dd>
          <dt className="text-foreground">Earned for your time</dt>
          <dd className="font-mono tabular-nums text-right">{formatMoney2(h.earned)}</dd>
        </dl>
      </details>
    </div>
  );
}
