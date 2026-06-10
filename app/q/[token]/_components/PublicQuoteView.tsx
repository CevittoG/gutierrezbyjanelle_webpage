// Client-facing quote view. Server component — receives only the PublicQuote
// projection (no costs/rates/Draft). Brand-styled per DESIGN.md: Paper Cream
// surface, Card White panel, Square Peg headings, Powder Rose as a state accent.

import { fmt$ } from "@/lib/quote-calc-logic";
import type { PublicQuote } from "@/lib/quote-calc-portal";
import { siteConfig } from "@/config/site";
import { ProofsGallery } from "./ProofsGallery";

function money(n: number): string {
  return fmt$(Math.round(n));
}

export function PublicQuoteView({ quote }: { quote: PublicQuote }) {
  const savings = Math.round(quote.savings);
  const beforeSavings = quote.total + quote.savings;
  const hasProofs = quote.proofs.images.length > 0 || quote.proofs.pdfs.length > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <article className="max-w-3xl mx-auto rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <header className="px-8 sm:px-10 pt-10 pb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Custom stationery · Your quote
          </p>
          <h1 className="font-squarepeg text-6xl leading-none">Gutierrez by Janelle</h1>
          <hr className="mt-6 border-0 h-px bg-accent" />
        </header>

        {/* Client meta */}
        <section className="px-8 sm:px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 normal-case tracking-normal">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Prepared for</p>
            <p className="text-base font-medium">{quote.clientName || "—"}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Event</p>
            <p className="text-sm">
              {quote.eventType}
              {quote.eventDate ? ` · ${quote.eventDate}` : ""}
            </p>
          </div>
        </section>

        {/* Package + included pieces */}
        <section className="mx-8 sm:mx-10 my-2 rounded-xl border border-border bg-muted/30 p-6 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your package</p>
          <h2 className="font-squarepeg text-3xl leading-tight">{quote.packageName}</h2>
          {quote.includedPieces.length > 0 && (
            <ul className="mt-4 text-sm space-y-0.5">
              {quote.includedPieces.map((piece, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-accent">·</span>
                  <span>{piece}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Savings (only when a discount applies) */}
        {savings > 0 && (
          <section className="px-8 sm:px-10 pt-6 pb-2 normal-case tracking-normal">
            <dl className="space-y-2 text-sm">
              <Row label="Before savings" value={money(beforeSavings)} dim />
              <Row label="Your savings" value={`-${money(savings)}`} dim />
            </dl>
          </section>
        )}

        {/* Total */}
        <section className="mx-8 sm:mx-10 my-6 rounded-xl border border-accent bg-accent/15 px-6 py-5 flex items-baseline justify-between gap-4">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total investment</span>
          <span className="font-squarepeg text-4xl tabular-nums">{money(quote.total)}</span>
        </section>

        {/* Proofs */}
        {hasProofs && (
          <section className="px-8 sm:px-10 pb-2 normal-case tracking-normal">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Your proofs</p>
            <ProofsGallery images={quote.proofs.images} pdfs={quote.proofs.pdfs} />
          </section>
        )}

        {/* Fine print */}
        <section className="px-8 sm:px-10 pb-2 mt-4 normal-case tracking-normal text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <p>· Shipping, when applicable, is added based on the carrier quote at production time.</p>
          <p>· A 50% deposit confirms your spot; the balance is due before production begins.</p>
        </section>

        {/* Footer */}
        <footer className="px-8 sm:px-10 pt-6 pb-10 mt-6 border-t border-border text-center normal-case tracking-normal">
          <p className="font-squarepeg text-3xl leading-tight">Talk soon — Janelle</p>
          <p className="text-xs text-muted-foreground mt-2">
            {siteConfig.contactEmail} ·{" "}
            <a href={siteConfig.url} className="underline-offset-2">
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </footer>
      </article>
    </div>
  );
}

function Row({
  label,
  value,
  dim,
  divider,
}: {
  label: string;
  value: string;
  dim?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      className={
        "flex items-baseline justify-between gap-3 py-1 " +
        (divider ? "border-t border-border/60 pt-2 mt-1" : "border-b border-border/40 last:border-0")
      }
    >
      <span className={"text-sm " + (dim ? "text-muted-foreground" : "text-foreground")}>{label}</span>
      <span
        className={"font-mono tabular-nums text-sm shrink-0 " + (dim ? "text-muted-foreground" : "text-foreground")}
      >
        {value}
      </span>
    </div>
  );
}
