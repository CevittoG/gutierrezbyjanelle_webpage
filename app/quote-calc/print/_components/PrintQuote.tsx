"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CatalogItem,
  ITEM_CATALOG,
  PACKAGES,
  fmt$,
  fmt$2,
  loadSavedDefaults,
} from "@/lib/quote-calc-logic";
import { computeQuoteBreakdown } from "@/lib/quote-calc-totals";
import { mergeRemoteConfig } from "@/lib/quote-calc-config";
import { fetchRemoteConfig } from "@/lib/quote-calc-config-remote";
import {
  Draft,
  DraftClientInfo,
  DraftConfig,
  loadDrafts,
  loadLastSession,
  withSnapshotDefaults,
} from "@/lib/quote-calc-drafts";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils";

interface Snapshot {
  name: string;
  client: DraftClientInfo;
  config: DraftConfig;
  assumptions: ReturnType<typeof withSnapshotDefaults>;
  generatedAt: string;
  shortId: string;
}

function loadSnapshot(draftId: string | null): Snapshot | null {
  if (!draftId) return null;
  if (draftId === "__current") {
    const last = loadLastSession();
    if (!last) return null;
    return {
      name: "Working quote",
      client: last.client,
      config: last.config,
      // No snapshot for an unsaved quote — use the same live defaults the calculator reads.
      assumptions: loadSavedDefaults(),
      generatedAt: new Date().toISOString(),
      shortId: "draft",
    };
  }
  const drafts = loadDrafts();
  const draft = drafts.find((d: Draft) => d.id === draftId);
  if (!draft) return null;
  return {
    name: draft.name,
    client: draft.client,
    config: draft.config,
    assumptions: withSnapshotDefaults(draft.assumptionsSnapshot),
    generatedAt: new Date().toISOString(),
    shortId: draft.id.slice(0, 6).toUpperCase(),
  };
}

function formatEventDate(iso: string): string {
  if (!iso) return "TBD";
  // Date-only input arrives as YYYY-MM-DD; parse without timezone shift.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatGenerated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function quoteExpiry(generated: string, days = 30): string {
  const d = new Date(generated);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function PrintQuote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>(ITEM_CATALOG);

  useEffect(() => {
    setSnap(loadSnapshot(draftId));
    setHydrated(true);
  }, [draftId]);

  // Pull the live catalog so printed labels match the current Sheet. Falls
  // back silently to bundled defaults — no banner on the print view.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchRemoteConfig();
      if (cancelled) return;
      if (result.ok) {
        setCatalog(mergeRemoteConfig(result.value).catalog);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const computed = useMemo(() => {
    if (!snap) return null;
    return computeQuoteBreakdown(snap.config, snap.assumptions, catalog);
  }, [snap, catalog]);

  if (!hydrated) return null;

  if (!snap) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="font-squarepeg text-4xl mb-2">Quote not found</h1>
          <p className="text-sm text-muted-foreground mb-6 normal-case tracking-normal">
            That quote isn't saved on this device. Saved drafts live in your browser's storage —
            open it from the same computer where you saved it.
          </p>
          <button
            type="button"
            onClick={() => router.push("/quotes")}
            className="h-11 px-5 rounded-lg border border-border bg-foreground text-background text-sm normal-case tracking-normal"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const { client, config, assumptions, generatedAt, shortId } = snap;

  if (!computed) return null;

  const { lines: priced, miscLines, rushAmount, finalPrice, services, quoteDiscountLines } = computed;

  interface DisplayItem {
    rowKey: string;
    label: string;
    countLabel: string;
  }

  // One view per quote line (bundle or single item): its included pieces, price,
  // and copy.
  const lineViews = config.lines.map((line, idx) => {
    const lr = priced[idx];

    if (line.kind === "item") {
      const cat = catalog.find((i) => i.key === line.itemKey);
      const isDigital = line.digital ?? false;
      const includedItems: DisplayItem[] = cat
        ? [{ rowKey: cat.key, label: cat.label, countLabel: isDigital ? "design" : `${line.qty} pcs` }]
        : [];
      return {
        line,
        title: cat?.label ?? line.itemKey ?? "Item",
        tagline: "Individual item",
        lr,
        isDigital,
        includedItems,
        kindCopy: "Selected item",
        deliveryCopy: isDigital
          ? "Delivered as print-ready PDF files via email."
          : `Printed and shipped — ${line.qty} piece${line.qty === 1 ? "" : "s"}.`,
        isItem: true,
      };
    }

    const def = line.pkg ? PACKAGES[line.pkg] : undefined;
    const isDigital = def?.isDigital ?? false;
    const includedItems: DisplayItem[] = (def?.items ?? []).map((it, i) => {
      const k = typeof it === "string" ? it : it.key;
      const label = (typeof it !== "string" && it.displayLabel) || catalog.find((c) => c.key === k)?.label || k;
      const cat = catalog.find((c) => c.key === k);
      const countLabel =
        cat?.fixed !== undefined ? `${cat.fixed} pcs` : isDigital ? "design" : `${(cat?.qty ?? 0) * line.qty} pcs`;
      return { rowKey: `${k}-${i}`, label, countLabel };
    });
    const kindCopy = def?.type === "events" ? "Selected event package" : "Selected wedding suite";
    const deliveryCopy = isDigital
      ? "Delivered as print-ready PDF files via email."
      : def?.type === "events"
      ? `Printed and shipped — quantities sized for ${line.qty} guest${line.qty === 1 ? "" : "s"}.`
      : `Printed and shipped — quantities sized for ${line.qty} household${line.qty === 1 ? "" : "s"}.`;

    return {
      line,
      title: def?.name ?? line.pkg ?? "Package",
      tagline: def?.tagline ?? "",
      lr,
      isDigital,
      includedItems,
      kindCopy,
      deliveryCopy,
      isItem: false,
    };
  });

  const anyPhysical = lineViews.some((v) => !v.isDigital);

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        @media print {
          @page {
            size: Letter;
            margin: 0.5in;
          }
          body {
            background: hsl(var(--background)) !important;
          }
          .no-print {
            display: none !important;
          }
          .print-root {
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }
          .print-page {
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Non-print toolbar */}
      <div className="no-print sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs uppercase tracking-widest text-muted-foreground normal-case">Print preview</span>
            <span className="text-sm font-medium truncate normal-case tracking-normal">· {snap.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => router.push("/quotes")}
              className="h-10 px-3 rounded-lg border border-border text-sm normal-case tracking-normal hover:bg-muted transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-4 rounded-lg border border-border bg-foreground text-background text-sm normal-case tracking-normal"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="print-page py-8 px-4">
        <article className="print-root max-w-3xl mx-auto rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          {/* Header band */}
          <header className="px-10 pt-10 pb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
              GutierrezByJanelle · Custom stationery
            </p>
            <h1 className="font-squarepeg text-6xl leading-none">Gutierrez by Janelle</h1>
            <hr className="mt-6 border-0 h-px bg-accent" />
          </header>

          {/* Client meta */}
          <section className="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 normal-case tracking-normal">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Prepared for</p>
              <p className="text-base font-medium">{client.name || "—"}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Quote ref.</p>
              <p className="text-sm font-mono tabular-nums">{shortId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Event</p>
              <p className="text-sm">{client.eventType} · {formatEventDate(client.eventDate)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Prepared on</p>
              <p className="text-sm">{formatGenerated(generatedAt)}</p>
            </div>
          </section>

          {/* Summary — one block per quote line */}
          {lineViews.map((v) => (
            <section key={v.line.id} className="mx-10 my-2 rounded-xl border border-border bg-muted/30 p-6 normal-case tracking-normal">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{v.kindCopy}</p>
              <h2 className="font-squarepeg text-3xl leading-tight">{v.title}</h2>
              {v.tagline && <p className="text-sm text-muted-foreground mt-1">{v.tagline}</p>}
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Included pieces</p>
                <ul className="text-sm space-y-0.5">
                  {v.includedItems.map((ci) => (
                    <li key={ci.rowKey} className="flex items-baseline justify-between gap-3">
                      <span>{ci.label}</span>
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        {ci.countLabel}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  {v.deliveryCopy}
                </p>
              </div>
            </section>
          ))}

          {/* Investment table */}
          <section className="px-10 pt-6 pb-2 normal-case tracking-normal">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Investment</p>
            <dl className="space-y-2 text-sm">
              {lineViews.map((v) => (
                <div key={v.line.id}>
                  <PrintRow
                    label={v.isItem ? v.title : `${v.title} package`}
                    detail={config.mode === "reuse" ? "Adapted from an existing design" : "Original artwork"}
                    value={fmt$2(v.lr.list)}
                  />
                  {v.lr.bundleDiscountPtg > 0 && (
                    <PrintRow
                      label={`Suite savings (${v.lr.bundleDiscountPtg}%)`}
                      value={`-${fmt$2(v.lr.bundleDiscountAmount)}`}
                      dim
                    />
                  )}
                </div>
              ))}

              {miscLines.length > 0 && (
                <>
                  <PrintDivider label="Custom add-ons" />
                  {miscLines.map((m) => (
                    <PrintRow
                      key={m.id}
                      label={m.label}
                      detail={`${m.qty} × ${fmt$2(m.unitPrice)}`}
                      value={fmt$2(m.total)}
                    />
                  ))}
                </>
              )}

              {services.servicesList > 0 && (
                <PrintRow
                  label="Project services"
                  detail={[
                    services.revisionCost > 0 ? "extra revisions" : null,
                    services.licenseVar > 0 ? "digital file license" : null,
                    services.packaging > 0 ? "materials & handling" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  value={`+${fmt$2(services.servicesList)}`}
                />
              )}

              {quoteDiscountLines.map((d) => (
                <PrintRow
                  key={d.label}
                  label={`${d.label} (${d.ptg}%)`}
                  value={`-${fmt$2(d.amount)}`}
                  dim
                />
              ))}

              {config.rushFee && (
                <PrintRow
                  label={`Rush production (+${assumptions.rushFeePtg}%)`}
                  detail="Turnaround under 7 days"
                  value={`+${fmt$2(rushAmount)}`}
                />
              )}
            </dl>
          </section>

          {/* Total */}
          <section className="mx-10 my-6 rounded-xl border border-accent bg-accent/15 px-6 py-5 flex items-baseline justify-between gap-4">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total investment</span>
            <span className="font-squarepeg text-4xl tabular-nums">{fmt$(Math.round(finalPrice))}</span>
          </section>

          {/* Fine print */}
          <section className="px-10 pb-2 normal-case tracking-normal text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p>· Quote valid through <strong className="text-foreground">{quoteExpiry(generatedAt)}</strong>.</p>
            {anyPhysical && (
              <p>· Shipping is added based on carrier quote at the time of production.</p>
            )}
            <p>· One round of revisions is included. Additional rounds are billed at our standard design rate.</p>
            <p>· Final pricing may shift based on design complexity discovered during sketching.</p>
            <p>· A 50% deposit confirms your spot; balance due before production begins.</p>
          </section>

          {/* Footer */}
          <footer className="px-10 pt-6 pb-10 mt-6 border-t border-border text-center normal-case tracking-normal">
            <p className="font-squarepeg text-3xl leading-tight">Talk soon — Janelle</p>
            <p className="text-xs text-muted-foreground mt-2">
              {siteConfig.contactEmail} ·{" "}
              <a href={siteConfig.url} className="underline-offset-2">
                {siteConfig.url.replace(/^https?:\/\//, "")}
              </a>
            </p>
            {client.clientNotes && (
              <p className="text-xs text-muted-foreground mt-3 italic max-w-md mx-auto whitespace-pre-line">
                {client.clientNotes}
              </p>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
}

function PrintRow({
  label,
  detail,
  value,
  dim,
}: {
  label: string;
  detail?: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm", dim ? "text-muted-foreground" : "text-foreground")}>{label}</span>
        {detail && <span className="ml-2 text-xs text-muted-foreground">{detail}</span>}
      </div>
      <span className={cn("font-mono tabular-nums text-sm shrink-0", dim ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function PrintDivider({ label }: { label: string }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4 mb-1">{label}</p>
  );
}

