"use client";

// Client-facing quote view. Receives only the PublicQuote projection (no
// costs/rates/Draft). Brand register: the work leads, the numbers follow, and
// the page closes on Janelle's voice with an easy next step. Paper Cream
// surface, Square Peg signatures, Powder Rose as a state accent only.

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Mail } from "lucide-react";
import { fmt$ } from "@/lib/quote-calc-logic";
import type { PublicProgress, PublicQuote } from "@/lib/quote-calc-portal";
import { siteConfig } from "@/config/site";
import { ProofGallery } from "@/components/ui/proof-gallery";
import { cn } from "@/utils";
import { ApproveProofs } from "./ApproveProofs";

function money(n: number): string {
  return fmt$(Math.round(n));
}

function formatApprovedAt(iso: string): string {
  const raw = (iso ?? "").trim();
  if (!raw) return "";
  const t = new Date(raw);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

export function PublicQuoteView({
  quote,
  progress,
  token,
}: {
  quote: PublicQuote;
  progress: PublicProgress;
  token: string;
}) {
  const reduce = useReducedMotion();
  const savings = Math.round(quote.savings);
  const hasProofs = quote.proofs.images.length > 0 || quote.proofs.pdfs.length > 0;
  const initial = reduce ? "show" : "hidden";
  const approvedOn = formatApprovedAt(progress.approvedAt);

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

        {/* Where things stand — lifecycle tracker */}
        <motion.section variants={item} className="mt-12" aria-labelledby="status-heading">
          <p id="status-heading" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Where things stand
          </p>
          <h2 className="font-squarepeg text-4xl leading-tight mt-1">{progress.headline}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-prose">{progress.sub}</p>
          <StepTracker steps={progress.steps} />
        </motion.section>

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

        {/* Proof approval — the one client-action step */}
        {progress.awaitingApproval && !progress.approvedBy ? (
          <motion.section variants={item} className="mt-10" aria-labelledby="approve-heading">
            <p id="approve-heading" className="sr-only">Approve your proofs</p>
            <ApproveProofs token={token} />
          </motion.section>
        ) : progress.approvedBy ? (
          <motion.section variants={item} className="mt-10">
            <div className="rounded-2xl border border-accent/60 bg-accent/10 px-6 py-4 flex items-baseline gap-3">
              <span className="text-accent text-lg leading-none" aria-hidden>✓</span>
              <p className="text-sm leading-snug">
                You approved your proofs{approvedOn ? <> on {approvedOn}</> : null} — thank you,{" "}
                <span className="font-medium">{progress.approvedBy}</span>! I'm moving ahead and will keep
                this page updated.
              </p>
            </div>
          </motion.section>
        ) : null}

        {/* Your suite + investment — merged to avoid duplicating the item list */}
        <motion.section variants={item} className="mt-14" aria-labelledby="suite-heading">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your suite</p>
          <h2 id="suite-heading" className="font-squarepeg text-4xl leading-tight mt-1 mb-6">{quote.packageName}</h2>
          <dl className="space-y-2 text-sm">
            {quote.lineItems.map((li, i) => {
              const prevKind = i > 0 ? quote.lineItems[i - 1].kind : li.kind;
              const isFirstExtra = li.kind !== "package" && prevKind === "package";
              return (
                <div key={i}>
                  {isFirstExtra && (
                    <div className="flex items-center gap-2 pt-1 pb-0.5">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Add-ons</span>
                      <span className="flex-1 h-px bg-border/50" />
                    </div>
                  )}
                  <Row label={li.label} value={money(li.price)} />
                </div>
              );
            })}
            <Row label="Subtotal" value={money(quote.subtotal)} dim />
            {savings > 0 && <Row label="Your savings" value={`-${money(savings)}`} accent />}
            {quote.rush > 0 && <Row label="Rush" value={`+${money(quote.rush)}`} dim />}
          </dl>
          <div className="mt-4 rounded-2xl border border-accent bg-accent/15 px-6 py-6 flex items-baseline justify-between gap-4">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total investment</span>
            <span className="font-squarepeg text-5xl leading-none tabular-nums">{money(quote.total)}</span>
          </div>
          {(quote.depositExpected > 0 || quote.depositPaid > 0) && (
            <dl className="mt-4 space-y-2 text-sm">
              {quote.depositPaid > 0 ? (
                <>
                  <PayLine label="Deposit paid" value={money(quote.depositPaid)} chip="Received" paid />
                  <PayLine
                    label="Balance remaining"
                    value={money(quote.balanceRemaining)}
                    chip={quote.balanceRemaining === 0 ? "Paid in full" : "Due"}
                    paid={quote.balanceRemaining === 0}
                  />
                </>
              ) : (
                <PayLine label="Deposit to begin" value={money(quote.depositExpected)} chip="Due" />
              )}
            </dl>
          )}
          <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed mt-5">
            <p>· Shipping, when applicable, is added based on the carrier quote at production time.</p>
            {quote.depositPaid > 0 && quote.balanceRemaining > 0 && (
              <p>· The remaining balance is due before your order is finished.</p>
            )}
            {quote.depositPaid === 0 && quote.depositExpected > 0 && (
              <p>· A deposit reserves your spot; the balance follows before your order is finished.</p>
            )}
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
      <span className={"min-w-0 break-words " + (dim ? "text-muted-foreground" : "text-foreground")}>{label}</span>
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

function PayLine({
  label,
  value,
  chip,
  paid,
}: {
  label: string;
  value: string;
  chip?: string;
  paid?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <span className="flex items-center gap-2 text-foreground min-w-0">
        {label}
        {chip && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
              paid ? "bg-accent/40 text-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {chip}
          </span>
        )}
      </span>
      <span className="font-mono tabular-nums shrink-0 text-foreground">{value}</span>
    </div>
  );
}

// Horizontal lifecycle rail: a dot per stage (completed / current / upcoming)
// joined by a thread, labels beneath. Scrolls sideways on narrow screens and
// auto-centers the current stage on mount. Powder Rose marks done + current.
function StepTracker({ steps }: { steps: PublicProgress["steps"] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const c = scrollRef.current;
    const el = currentRef.current;
    if (!c || !el) return;
    // Center the current node within the scroll container without moving the page.
    c.scrollLeft = el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2;
  }, []);

  return (
    <div
      ref={scrollRef}
      className="mt-6 -mx-5 sm:mx-0 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex min-w-max px-5 sm:px-1">
        {steps.map((s, i) => {
          const first = i === 0;
          const last = i === steps.length - 1;
          const done = s.state === "done";
          const current = s.state === "current";
          return (
            <li
              key={s.key}
              ref={current ? currentRef : undefined}
              className="flex flex-col items-center w-[84px] shrink-0"
            >
              <div className="flex items-center w-full" aria-hidden>
                <span
                  className={cn("h-px flex-1", first ? "opacity-0" : done || current ? "bg-accent/60" : "bg-border")}
                />
                <span
                  className={cn(
                    "h-3 w-3 rounded-full border shrink-0",
                    current
                      ? "bg-accent border-accent ring-4 ring-accent/25"
                      : done
                        ? "bg-accent border-accent"
                        : "bg-transparent border-border",
                  )}
                />
                <span className={cn("h-px flex-1", last ? "opacity-0" : done ? "bg-accent/60" : "bg-border")} />
              </div>
              <span
                className={cn(
                  "mt-2 text-[11px] leading-tight text-center px-1",
                  current
                    ? "text-foreground font-medium"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60",
                )}
              >
                {s.label}
                {current && <span className="sr-only"> (current step)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
