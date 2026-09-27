"use client";

// Printable client quote. Same projector and investment list as the client
// portal (/q), so the paper and the link always agree; no cost data, no
// health. A saved quote is read from the server first (the same v5 view the
// portal uses) and from this browser's cache when offline.

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSavedDefaults } from "@/lib/quote-calc-logic";
import {
  isV5Draft,
  loadDrafts,
  loadLastSession,
  normalizeDraftV5,
  toV5Draft,
  type Draft,
} from "@/lib/quote-calc-drafts";
import { computeTotals } from "@/lib/quote-engine";
import { buildPublicQuote } from "@/lib/quote-calc-portal";
import { formatMoney } from "@/lib/money";
import { InvestmentList } from "@/components/quote-app/InvestmentList";
import { siteConfig } from "@/config/site";

interface Snapshot {
  draft: Draft;
  generatedAt: string;
  shortId: string;
}

// The unsaved working quote from the builder's last session.
function workingQuote(): Draft | null {
  const last = loadLastSession();
  if (!last) return null;
  const now = new Date().toISOString();
  const base = { id: "draft", name: "Working quote", createdAt: now, updatedAt: now, client: last.client };
  const cfg = last.config as unknown as { schema?: number };
  if (cfg && cfg.schema === 5) {
    return normalizeDraftV5({ ...base, config: last.config, cachedTotal: 0, schemaVersion: 5 });
  }
  // The old calculator's session has no snapshot: it priced with the live defaults.
  return toV5Draft({ ...base, config: last.config, assumptionsSnapshot: loadSavedDefaults(), cachedTotal: 0, schemaVersion: 4 });
}

function localDraft(draftId: string): Draft | null {
  const found = loadDrafts().find((d) => d.id === draftId);
  if (!found) return null;
  return isV5Draft(found as never) ? (found as unknown as Draft) : toV5Draft(found);
}

async function remoteDraft(draftId: string): Promise<Draft | null> {
  try {
    const res = await fetch(`/quote-calc/api/drafts/${encodeURIComponent(draftId)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ok?: boolean; draft?: unknown };
    return body.ok ? normalizeDraftV5(body.draft) : null;
  } catch {
    return null;
  }
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let draft: Draft | null = null;
      if (draftId === "__current") draft = workingQuote();
      else if (draftId) draft = (await remoteDraft(draftId)) ?? localDraft(draftId);
      if (cancelled) return;
      setSnap(
        draft
          ? {
              draft,
              generatedAt: new Date().toISOString(),
              shortId: draftId === "__current" ? "draft" : draft.id.slice(0, 6).toUpperCase(),
            }
          : null,
      );
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const quote = useMemo(
    () => (snap ? buildPublicQuote(snap.draft, computeTotals(snap.draft.config), [], 0) : null),
    [snap],
  );

  if (!hydrated) return null;

  if (!snap || !quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="font-squarepeg text-4xl mb-2">Quote not found</h1>
          <p className="text-sm text-muted-foreground mb-6 normal-case tracking-normal">
            That quote couldn&apos;t be loaded from the Sheet, and it isn&apos;t saved in this browser either.
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

  const { draft, generatedAt, shortId } = snap;
  const client = draft.client;
  const money = (n: number) => formatMoney(n, { wholeDollars: quote.wholeDollars });

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
            <span className="text-sm font-medium truncate normal-case tracking-normal">· {draft.name}</span>
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
              {siteConfig.name} · Custom stationery
            </p>
            <h1 className="font-squarepeg text-6xl leading-none">{siteConfig.name}</h1>
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

          {/* Investment */}
          <section className="px-10 pt-4 pb-2 normal-case tracking-normal">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your quote</p>
            <h2 className="font-squarepeg text-3xl leading-tight mb-4">{quote.title}</h2>
            <InvestmentList quote={quote} />
          </section>

          {/* Total */}
          <section className="mx-10 my-6 rounded-xl border border-accent bg-accent/15 px-6 py-5 flex items-baseline justify-between gap-4">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total investment</span>
            <span className="font-squarepeg text-4xl tabular-nums">{money(quote.total)}</span>
          </section>

          {/* Fine print */}
          <section className="px-10 pb-2 normal-case tracking-normal text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p>· Quote valid through <strong className="text-foreground">{quoteExpiry(generatedAt)}</strong>.</p>
            {quote.shipping === null && quote.anyPhysical && (
              <p>· Shipping is added based on carrier quote at the time of production.</p>
            )}
            <p>· One round of revisions is included. Additional rounds are billed at our standard design rate.</p>
            <p>· Final investment may shift based on design complexity discovered during sketching.</p>
            <p>
              · {quote.depositExpected > 0 ? `A ${money(quote.depositExpected)} deposit` : "A deposit"} confirms your
              spot; the balance is due before production begins.
            </p>
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

