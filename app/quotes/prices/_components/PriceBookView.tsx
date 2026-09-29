"use client";

// Read-only price book workbench: floor · target · market · your price per
// product, package sample totals, Sheet warnings, and the one-time seed.
// Brand rules: Powder Rose for state only, flags as label + glyph (no traffic
// lights), money never wraps, names do.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { ConfigBanner } from "@/app/quote-calc/_components/ConfigBanner";
import { fetchPriceBook, seedPriceBook, type SeedResult } from "@/lib/quote-pricebook-remote";
import {
  isTodoWarning,
  packageSample,
  priceGuide,
  type MergedPriceBook,
  type PriceGuide,
  type Product,
} from "@/lib/quote-pricebook";
import { formatMoney, formatMoney2, formatPct } from "@/lib/money";
import { cn } from "@/utils";

interface Props {
  merged: MergedPriceBook;
  sheetUrl: string | null;
  state: "ok" | "failed" | "unconfigured";
}

const FLAG_COPY: Record<PriceGuide["flags"][number], { glyph: string; label: string }> = {
  "below-floor": { glyph: "!", label: "Below floor" },
  "above-market": { glyph: "↑", label: "Above market" },
  "no-market-data": { glyph: "·", label: "No market data" },
  "no-price": { glyph: "○", label: "Set price" },
  "no-estimate": { glyph: "·", label: "No estimate" },
};

function qtyRule(p: Product): string {
  if (p.qtyBasis === "fixed") return p.qtyPer === 1 ? "1 per order" : `${p.qtyPer} per order`;
  return `${p.qtyPer} per ${p.qtyBasis}`;
}

function money(n: number | null): string {
  return n === null ? "–" : formatMoney2(n);
}

export function PriceBookView({ merged, sheetUrl, state }: Props) {
  const router = useRouter();
  const [reloading, setReloading] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const { priceBook: pb, warnings, sources, needsSeed } = merged;
  const problems = warnings.filter((w) => !isTodoWarning(w));
  const todos = warnings.filter(isTodoWarning);

  const byCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of pb.products) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return Array.from(map.entries());
  }, [pb.products]);

  async function reload() {
    setReloading(true);
    try {
      await fetchPriceBook({ refresh: true });
      router.refresh();
    } finally {
      setReloading(false);
    }
  }

  async function runSeed() {
    setSeeding(true);
    setSeedError(null);
    const r = await seedPriceBook();
    setSeeding(false);
    if (!r.ok) {
      setSeedError(
        r.failure.kind === "unconfigured"
          ? "The Google Sheet isn't connected on this server."
          : "The Sheet didn't accept the write. Nothing was changed; try again in a moment.",
      );
      return;
    }
    setSeedResult(r.value);
    setConfirmSeed(false);
    await reload();
  }

  const s = pb.settings;
  const settingsRows: [string, string][] = [
    ["Target", `${formatMoney(s.hourlyTarget)}/hr`],
    ["Floor", `${formatMoney(s.hourlyFloor)}/hr`],
    ["Fees", formatPct(s.feesPct)],
    ["Guests per household", String(s.guestsPerHousehold)],
    ["Rush", formatPct(s.rushPct)],
    ["Extra revision round", formatMoney(s.revisionRoundPrice)],
    ["File license", formatMoney(s.licenseFee)],
    ["Packaging", formatMoney(s.packagingFee)],
    ["Reused design", `${formatPct(s.reuseDesignPct)} of the fee`],
    ["Vendor referral", formatPct(s.vendorReferralPct)],
    ["Deposit", formatMoney(s.depositAmount)],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-8 normal-case tracking-normal">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Studio</p>
          <h1 className="font-squarepeg text-5xl leading-none">Price book</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-prose">
            Prices live in the Google Sheet; this page only reads them. Each product shows your price
            against the floor and target your time needs, and the market range you have recorded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
            >
              Open Google Sheet <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={() => void reload()}
            disabled={reloading || state === "unconfigured"}
            className="h-11 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", reloading && "animate-spin")} aria-hidden />
            {reloading ? "Reloading" : "Reload"}
          </button>
          {needsSeed && state === "ok" && !confirmSeed && (
            <button
              type="button"
              onClick={() => setConfirmSeed(true)}
              className="h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:bg-ring transition-colors"
            >
              Create price book tabs
            </button>
          )}
        </div>
      </header>

      {state !== "ok" && (
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {state === "unconfigured"
            ? "The Google Sheet isn't connected here, so this is the built-in price book."
            : "The Sheet couldn't be read just now, so this is the built-in price book. Try Reload."}
        </p>
      )}

      {confirmSeed && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3" aria-live="polite">
          <p className="text-sm leading-relaxed max-w-prose">
            This adds the Products, Options and Packages tabs with today&apos;s prices, and appends any
            missing Settings keys. Tabs that already have rows are left exactly as they are.
          </p>
          {seedError && <p className="text-sm text-muted-foreground">! {seedError}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runSeed()}
              disabled={seeding}
              className="h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:bg-ring transition-colors disabled:opacity-50"
            >
              {seeding ? "Creating tabs" : "Create them now"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmSeed(false)}
              disabled={seeding}
              className="h-11 px-4 rounded-md border border-border text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {seedResult && (
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm" aria-live="polite">
          <span className="text-accent" aria-hidden>✦ </span>
          {seedResult.seeded.length + seedResult.settingsAppended.length === 0
            ? "Everything was already in place. Nothing changed."
            : [
                seedResult.seeded.length > 0 ? `Filled ${seedResult.seeded.join(", ")}` : null,
                seedResult.settingsAppended.length > 0
                  ? `added ${seedResult.settingsAppended.length} Settings key${seedResult.settingsAppended.length === 1 ? "" : "s"}`
                  : null,
              ]
                .filter(Boolean)
                .join("; ") + "."}
        </p>
      )}

      {problems.length > 0 && <ConfigBanner state={{ kind: "ok", warnings: problems }} onRetry={() => void reload()} retrying={reloading} />}

      <p className="text-xs text-muted-foreground">
        Products: {sources.products === "sheet" ? "Sheet" : "built-in"} · Options:{" "}
        {sources.options === "sheet" ? "Sheet" : "built-in"} · Packages:{" "}
        {sources.packages === "sheet" ? "Sheet" : "built-in"} · Settings:{" "}
        {sources.settings === "sheet" ? "Sheet" : "built-in"}
      </p>

      {todos.length > 0 && (
        <section aria-labelledby="todo-heading" className="rounded-lg border border-border bg-card p-5">
          <h2 id="todo-heading" className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Still to price · {todos.length}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {todos.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-muted-foreground" aria-hidden>○</span>
                <span className="min-w-0">
                  {w.detail}
                  {w.sheetRow != null && (
                    <span className="text-muted-foreground"> ({w.tab} row {w.sheetRow})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Settings */}
      <section aria-labelledby="settings-heading">
        <h2 id="settings-heading" className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Settings
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-5">
          {settingsRows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Packages */}
      <section aria-labelledby="packages-heading">
        <h2 id="packages-heading" className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Packages
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pb.packages.map((pkg) => {
            const at50 = packageSample(pkg, pb, 50);
            const at100 = packageSample(pkg, pb, 100);
            return (
              <article key={pkg.id} className="rounded-lg border border-border bg-card p-5 flex flex-col">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-squarepeg text-3xl leading-tight min-w-0">{pkg.name}</h3>
                  {pkg.bundlePct > 0 && (
                    <span className="shrink-0 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-xs tabular-nums">
                      −{formatPct(pkg.bundlePct)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pkg.type === "wedding" ? "Wedding" : "Event"} · {pkg.delivery}
                  {!pkg.active && " · inactive"}
                </p>
                <ul className="mt-3 text-sm space-y-0.5 flex-1">
                  {pkg.items.map((pid, i) => {
                    const p = pb.products.find((x) => x.id === pid);
                    return (
                      <li key={`${pid}-${i}`} className="flex items-baseline gap-2">
                        <span className="text-muted-foreground" aria-hidden>·</span>
                        <span className="min-w-0">{p?.name ?? pid}</span>
                        {p?.price === null && <span className="text-xs text-muted-foreground">(set price)</span>}
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-4 border-t border-border pt-3 space-y-1 text-sm">
                  {[
                    [50, at50],
                    [100, at100],
                  ].map(([h, sample]) => {
                    const smp = sample as ReturnType<typeof packageSample>;
                    return (
                      <div key={h as number} className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">{h as number} households</dt>
                        <dd className="tabular-nums whitespace-nowrap">
                          {formatMoney(smp.total)}{" "}
                          <span className="text-xs text-muted-foreground">≈ {formatMoney2(smp.perHousehold)}/household</span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {at50.unpriced.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Leaves out {at50.unpriced.length} unpriced piece{at50.unpriced.length === 1 ? "" : "s"}.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section aria-labelledby="products-heading" className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="products-heading" className="text-xs uppercase tracking-widest text-muted-foreground">
            Products · {pb.products.length}
          </h2>
          <p className="text-xs text-muted-foreground">
            Floor pays {formatMoney(s.hourlyFloor)}/hr, target {formatMoney(s.hourlyTarget)}/hr, both after{" "}
            {formatPct(s.feesPct)} fees.
          </p>
        </div>
        {byCategory.map(([category, products]) => (
          <div key={category}>
            <h3 className="text-sm mb-2">{category}</h3>
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              <div className="hidden lg:grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_minmax(0,1.4fr)] gap-3 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Product</span>
                <span className="text-right">Price / pc</span>
                <span className="text-right">Design</span>
                <span className="text-right">Digital</span>
                <span className="text-right">Floor · target</span>
                <span className="text-right">Market</span>
                <span>Position</span>
              </div>
              {products.map((p) => (
                <ProductRow key={p.id} product={p} guide={priceGuide(p, s)} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {pb.options.length > 0 && (
        <section aria-labelledby="options-heading">
          <h2 id="options-heading" className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Options
          </h2>
          <ul className="rounded-lg border border-border bg-card divide-y divide-border">
            {pb.options.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0">
                  {o.name}
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · {o.appliesTo.length > 0 ? o.appliesTo.join(", ") : "every product"}
                    {!o.active && " · inactive"}
                  </span>
                </span>
                <span className="tabular-nums whitespace-nowrap">
                  {o.amount === null
                    ? "set amount"
                    : o.kind === "percent"
                      ? `+${formatPct(o.amount)} of the pieces`
                      : o.kind === "per-piece"
                        ? `+${formatMoney2(o.amount)} / pc`
                        : `+${formatMoney2(o.amount)} per line`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProductRow({ product: p, guide }: { product: Product; guide: PriceGuide }) {
  const flags = guide.flags.filter((f) => f !== "no-estimate" || guide.flags.length === 1);
  return (
    <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-1.5 lg:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_minmax(0,1.4fr)] lg:items-center">
      <div className="col-span-2 lg:col-span-1 min-w-0">
        <p className="text-sm break-words">
          {p.name}
          {!p.active && <span className="text-xs text-muted-foreground"> · inactive</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {p.id} · {qtyRule(p)}
          {p.sheetRow != null && <> · row {p.sheetRow}</>}
        </p>
      </div>
      <Cell label="Price / pc" value={money(p.price)} strong />
      <Cell label="Design" value={p.designFee > 0 ? formatMoney2(p.designFee) : "–"} />
      <Cell label="Digital" value={money(p.digitalPrice)} />
      <Cell
        label="Floor · target"
        value={
          guide.floorUnit === null ? "–" : `${formatMoney2(guide.floorUnit)} · ${formatMoney2(guide.targetUnit ?? 0)}`
        }
      />
      <Cell
        label="Market"
        value={
          p.marketLow === null && p.marketHigh === null
            ? "–"
            : `${money(p.marketLow)}–${money(p.marketHigh)}`
        }
      />
      <div className="col-span-2 lg:col-span-1 space-y-1.5">
        <PositionBar product={p} guide={guide} />
        {flags.length > 0 && (
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {flags.map((f) => (
              <span key={f} className="whitespace-nowrap">
                <span aria-hidden className="font-medium text-foreground">{FLAG_COPY[f].glyph}</span> {FLAG_COPY[f].label}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 lg:block lg:text-right">
      <span className="text-xs text-muted-foreground lg:hidden">{label}</span>
      <span className={cn("text-sm tabular-nums whitespace-nowrap", strong ? "text-foreground" : "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

// floor ← you → market, on one line. Ticks: floor (thin), target (thick); the
// market range is a band; your price is the dot (Powder Rose once it reaches
// the target, the only state it marks).
function PositionBar({ product: p, guide }: { product: Product; guide: PriceGuide }) {
  const points = [guide.floorUnit, guide.targetUnit, p.marketLow, p.marketHigh, p.price].filter(
    (n): n is number => n !== null && Number.isFinite(n),
  );
  if (points.length < 2 || p.price === null) return null;
  const lo = Math.min(...points) * 0.85;
  const hi = Math.max(...points) * 1.1;
  const pos = (n: number) => `${Math.min(100, Math.max(0, ((n - lo) / (hi - lo || 1)) * 100))}%`;
  const onTarget = guide.targetUnit !== null && p.price >= guide.targetUnit - 0.005;
  const label = [
    `Your price ${formatMoney2(p.price)}`,
    guide.floorUnit !== null ? `floor ${formatMoney2(guide.floorUnit)}` : null,
    guide.targetUnit !== null ? `target ${formatMoney2(guide.targetUnit)}` : null,
    p.marketLow !== null || p.marketHigh !== null ? `market ${money(p.marketLow)} to ${money(p.marketHigh)}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="relative h-4" role="img" aria-label={label}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {(p.marketLow !== null || p.marketHigh !== null) && (
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-sm bg-muted"
          style={{
            left: pos(p.marketLow ?? p.marketHigh ?? 0),
            width: `calc(${pos(p.marketHigh ?? p.marketLow ?? 0)} - ${pos(p.marketLow ?? p.marketHigh ?? 0)})`,
          }}
        />
      )}
      {guide.floorUnit !== null && (
        <div className="absolute top-0.5 h-3 w-px bg-muted-foreground" style={{ left: pos(guide.floorUnit) }} />
      )}
      {guide.targetUnit !== null && (
        <div className="absolute top-0 h-4 w-0.5 bg-foreground/70" style={{ left: pos(guide.targetUnit) }} />
      )}
      <div
        className={cn(
          "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground",
          onTarget ? "bg-accent" : "bg-card",
        )}
        style={{ left: pos(p.price) }}
      />
    </div>
  );
}
