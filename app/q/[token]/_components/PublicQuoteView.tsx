"use client";

// Client-facing quote view. Receives only the PublicQuote projection (no
// costs/rates/Draft). Brand register: the work leads, the numbers follow, and
// the page closes on Janelle's voice with an easy next step. Paper Cream
// surface, Square Peg signatures, Powder Rose as a state accent only.

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Mail } from "lucide-react";
import { fmt$ } from "@/lib/quote-calc-logic";
import type { PublicQuote } from "@/lib/quote-calc-portal";
import { siteConfig } from "@/config/site";
import { ProofGallery } from "@/components/ui/proof-gallery";

function money(n: number): string {
  return fmt$(Math.round(n));
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function PublicQuoteView({ quote }: { quote: PublicQuote }) {
  const reduce = useReducedMotion();
  const savings = Math.round(quote.savings);
  const beforeSavings = quote.total + quote.savings;
  const hasProofs = quote.proofs.images.length > 0 || quote.proofs.pdfs.length > 0;
  const initial = reduce ? "show" : "hidden";

  const mailSubject = encodeURIComponent(quote.clientName ? `My quote — ${quote.clientName}` : "My quote");
  const mailHref = `mailto:${siteConfig.contactEmail}?subject=${mailSubject}`;

  return (
    <div className="min-h-screen bg-background">
      <motion.article
        variants={container}
        initial={initial}
        animate="show"
        className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-16 normal-case tracking-normal"
      >
        {/* Header */}
        <motion.header variants={item} className="text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Custom stationery</p>
          <h1 className="font-squarepeg text-6xl sm:text-7xl leading-[0.95] mt-3">Gutierrez by Janelle</h1>
          <p className="text-sm text-muted-foreground mt-4">
            Prepared for <span className="text-foreground font-medium">{quote.clientName || "you"}</span>
            {quote.eventType ? <> · {quote.eventType}</> : null}
            {quote.eventDate ? <> · {quote.eventDate}</> : null}
          </p>
          <hr className="mt-8 border-0 h-px bg-accent/70 w-24 mx-auto" />
        </motion.header>

        {/* The work, first */}
        {hasProofs ? (
          <motion.section variants={item} className="mt-12" aria-labelledby="proofs-heading">
            <h2 id="proofs-heading" className="font-squarepeg text-3xl leading-none mb-1">A first look</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-prose">
              Your proofs so far. Tap any piece to see it full size.
            </p>
            <ProofGallery images={quote.proofs.images} pdfs={quote.proofs.pdfs} />
          </motion.section>
        ) : (
          <motion.section variants={item} className="mt-12">
            <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
              <p className="font-squarepeg text-2xl mb-1">Your proofs are on the way</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                As soon as the first designs are ready, they'll appear right here for you to look over.
              </p>
            </div>
          </motion.section>
        )}

        {/* Your suite */}
        <motion.section variants={item} className="mt-14" aria-labelledby="suite-heading">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your suite</p>
          <h2 id="suite-heading" className="font-squarepeg text-4xl leading-tight mt-1">{quote.packageName}</h2>
          {quote.includedPieces.length > 0 && (
            <ul className="mt-5 divide-y divide-border/60 border-y border-border/60">
              {quote.includedPieces.map((piece, i) => (
                <li key={i} className="flex items-baseline gap-3 py-3">
                  <span aria-hidden className="text-accent text-lg leading-none translate-y-0.5">·</span>
                  <span className="text-[15px] leading-snug">{piece}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* Your investment */}
        <motion.section variants={item} className="mt-14" aria-labelledby="investment-heading">
          <p id="investment-heading" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Your investment
          </p>
          {savings > 0 && (
            <dl className="space-y-2 text-sm mb-4">
              <Row label="Before savings" value={money(beforeSavings)} dim />
              <Row label="Your savings" value={`-${money(savings)}`} accent />
            </dl>
          )}
          <div className="rounded-2xl border border-accent bg-accent/15 px-6 py-6 flex items-baseline justify-between gap-4">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total investment</span>
            <span className="font-squarepeg text-5xl leading-none tabular-nums">{money(quote.total)}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed mt-5">
            <p>· Shipping, when applicable, is added based on the carrier quote at production time.</p>
            <p>· A 50% deposit confirms your spot; the balance is due before production begins.</p>
          </div>
        </motion.section>

        {/* A note from Janelle */}
        {quote.clientNote.trim() && (
          <motion.section variants={item} className="mt-14" aria-labelledby="note-heading">
            <p id="note-heading" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              A note from Janelle
            </p>
            <div className="mt-3 rounded-2xl border border-accent/60 bg-accent/10 px-6 py-5">
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{quote.clientNote}</p>
            </div>
          </motion.section>
        )}

        {/* Janelle's note + next step */}
        <motion.section variants={item} className="mt-16 text-center border-t border-border pt-12">
          <p className="font-squarepeg text-4xl leading-tight">Talk soon, Janelle</p>
          <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
            Love what you see, or want to change a thing or two? Just reply and we'll make it yours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={mailHref}
              className="h-11 px-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-ring"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Reply to Janelle
            </a>
            <a
              href={siteConfig.instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 inline-flex items-center gap-2 rounded-full border border-border text-sm hover:border-accent hover:bg-accent/10 transition-colors"
            >
              <InstagramIcon className="h-4 w-4" />
              @{siteConfig.instagram.handle}
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-8">
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </p>
        </motion.section>
      </motion.article>
    </div>
  );
}

function Row({
  label,
  value,
  dim,
  accent,
}: {
  label: string;
  value: string;
  dim?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <span className={dim ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span
        className={
          "font-mono tabular-nums shrink-0 " +
          (accent ? "text-foreground" : dim ? "text-muted-foreground" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}
