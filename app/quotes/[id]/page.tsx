// Per-quote detail (admin). Link + folder controls, the client-facing summary
// (so Janelle can sanity-check what the client sees), and the proofs gallery
// (admin-proxied so it works before any public link exists). Server-gated.

import Link from "next/link";
import { notFound } from "next/navigation";
import { PasswordGate } from "@/app/quote-calc/_components/PasswordGate";
import { AppShell } from "@/components/quote-app/AppShell";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import {
  getDraftById,
  getPortalMetaById,
  isSheetsConfigured,
  listPriceBook,
} from "@/lib/quote-calc-sheets";
import { computeTotals, diffAgainstPriceBook } from "@/lib/quote-engine";
import { computeHealth } from "@/lib/quote-health";
import { mergePriceBook, type PriceBook } from "@/lib/quote-pricebook";
import { formatMoney } from "@/lib/money";
import {
  buildPublicQuote,
  isLinkActive,
  projectTypeOf,
  type PublicQuoteFile,
} from "@/lib/quote-calc-portal";
import { driveFileKind, folderWebLink, listFolderFiles } from "@/lib/quote-calc-drive";
import { LinkControls } from "@/components/quote-app/LinkControls";
import { StageControl } from "@/components/quote-app/StageControl";
import { DepositPaidControl } from "@/components/quote-app/DepositPaidControl";
import { HiddenNotesControl } from "@/components/quote-app/HiddenNotesControl";
import { HealthCard } from "@/components/quote-app/HealthCard";
import { InvestmentList } from "@/components/quote-app/InvestmentList";
import { DuplicateQuoteButton } from "@/components/quote-app/DuplicateQuoteButton";
import { cn } from "@/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile Overview",
  robots: { index: false, follow: false },
};

function formatDay(iso: string | undefined): string {
  const t = new Date((iso ?? "").trim());
  if (!iso || Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatApprovedAt(iso: string | undefined): string {
  const raw = (iso ?? "").trim();
  if (!raw) return "";
  const t = new Date(raw);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  if (!isQuoteAuthValid()) return <PasswordGate />;
  if (!isSheetsConfigured()) notFound();

  const id = params.id;
  const draft = await getDraftById(id);
  if (!draft) notFound();

  const meta = await getPortalMetaById(id, { force: true });

  // Money comes from the saved config alone. The price book is read only for
  // the health fallback (quotes without a health snapshot) and the
  // "prices changed since" count.
  const totals = computeTotals(draft.config);
  let priceBook: PriceBook = mergePriceBook(null).priceBook;
  try {
    priceBook = mergePriceBook(await listPriceBook()).priceBook;
  } catch {
    // bundled fallback
  }
  const s = priceBook.settings;
  const health = computeHealth(draft.config, totals, {
    revisionHours: s.revisionHours,
    feesPct: s.feesPct,
    hourlyTarget: s.hourlyTarget,
    hourlyFloor: s.hourlyFloor,
  });
  const changed = draft.config.legacy ? [] : diffAgainstPriceBook(draft.config, priceBook);

  // Admin proxy URLs (cookie-gated) so proofs render regardless of link state.
  let files: PublicQuoteFile[] = [];
  if (meta?.driveFolderId) {
    try {
      const driveFiles = await listFolderFiles(meta.driveFolderId, { force: true });
      files = driveFiles
        .map((f) => ({ f, kind: driveFileKind(f.mimeType) }))
        .filter((x): x is { f: (typeof driveFiles)[number]; kind: "image" | "pdf" } =>
          x.kind === "image" || x.kind === "pdf",
        )
        .map(({ f, kind }) => ({
          id: f.id,
          name: f.name,
          kind,
          url: `/quote-calc/api/portal/${encodeURIComponent(id)}/file/${encodeURIComponent(f.id)}`,
        }));
    } catch {
      // leave proofs empty on a Drive error
    }
  }

  const type = projectTypeOf(draft.config);
  const quote = buildPublicQuote(draft, totals, files, meta?.depositPaid ?? 0);
  const money = (n: number) => formatMoney(n, { wholeDollars: quote.wholeDollars });
  const editHref = `/quote/new?draft=${encodeURIComponent(id)}`;
  const folderUrl = meta?.driveFolderId ? folderWebLink(meta.driveFolderId) : null;
  const linkLive = meta ? isLinkActive(meta) && !!meta.publicToken : false;
  const approvedOn = formatApprovedAt(meta?.approvedAt);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        <header className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Profile Overview
            </p>
            <h1 className="font-squarepeg text-4xl md:text-5xl leading-none truncate">
              {draft.client.name || "Untitled"}
            </h1>
            <p className="text-xs text-muted-foreground normal-case tracking-normal mt-1">
              {quote.eventType} · {quote.eventDate} · {draft.name}
            </p>
          </div>
          <Link
            href="/quotes"
            className="text-xs normal-case tracking-normal underline underline-offset-4 text-muted-foreground hover:text-foreground shrink-0"
          >
            ← All quotes
          </Link>
        </header>

        <div className="flex flex-wrap items-center gap-2 normal-case tracking-normal">
          <Link
            href={editHref}
            className="h-11 px-4 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm hover:bg-ring transition-colors"
          >
            Edit quote
          </Link>
          <DuplicateQuoteButton id={id} />
          <a
            href={`/quote-calc/print?draft=${encodeURIComponent(id)}`}
            target="_blank"
            rel="noopener"
            className="h-11 px-4 inline-flex items-center rounded-md border border-border bg-card text-sm hover:bg-muted transition-colors"
          >
            Print / PDF ↗
          </a>
        </div>

        <ul className="text-xs text-muted-foreground space-y-1 normal-case tracking-normal">
          {draft.config.legacy ? (
            <li>
              <span aria-hidden>· </span>Converted from the old calculator. Totals preserved exactly as the client saw them.
            </li>
          ) : draft.config.pricedAt ? (
            <li>
              <span aria-hidden>· </span>Priced from the price book on {formatDay(draft.config.pricedAt)}.
            </li>
          ) : null}
          {changed.length > 0 && (
            <li>
              <span aria-hidden className="text-foreground">! </span>
              {changed.length} price{changed.length === 1 ? "" : "s"} changed since.{" "}
              <Link href={editHref} className="underline underline-offset-4 hover:text-foreground">
                Review in the builder
              </Link>
            </li>
          )}
        </ul>

        {/* Pricing health (admin only) */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Pricing health · only you see this
          </p>
          <HealthCard health={health} />
        </section>

        {/* Project stage */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Project stage · {type === "digital" ? "Digital" : "Physical"}
          </p>
          <StageControl id={id} type={type} initialStage={meta?.stage ?? ""} />
          <div className="border-t border-border pt-4">
            <DepositPaidControl
              id={id}
              initialPaid={meta?.depositPaid ?? 0}
              expected={quote.depositExpected}
              total={quote.total}
            />
          </div>
          {meta?.approvedBy && (
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              <span className="text-accent" aria-hidden>✓</span> Proofs approved by{" "}
              <span className="text-foreground">{meta.approvedBy}</span>
              {approvedOn ? <> on {approvedOn}</> : null}
            </p>
          )}
        </section>

        {/* Link + folder controls */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Client Quote Profile link</p>
          <LinkControls id={id} token={meta?.publicToken ?? ""} linkStatus={meta?.linkStatus ?? ""} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs">
            {linkLive && (
              <a
                href={`/q/${meta!.publicToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                View Client Quote Profile ↗
              </a>
            )}
            {folderUrl ? (
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Open Drive folder ↗
              </a>
            ) : (
              <p className="text-muted-foreground">
                No Drive folder yet. It&apos;s created automatically the next time this quote is saved.
              </p>
            )}
          </div>
        </section>

        {/* Client-facing summary — exactly what the public link shows */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Client-facing summary
          </p>
          <p className="font-squarepeg text-3xl leading-tight mb-4">{quote.title}</p>
          <InvestmentList quote={quote} compact />
          <dl className="space-y-1.5 text-sm border-t border-border mt-4 pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">Total</span>
              <span className="font-mono tabular-nums text-base">{money(quote.total)}</span>
            </div>
            {quote.shipping === null && quote.anyPhysical && (
              <p className="text-xs text-muted-foreground">Shipping: added later, from the carrier quote.</p>
            )}
            {(quote.depositExpected > 0 || quote.depositPaid > 0) && (
              <div className="space-y-1.5 border-t border-border/60 pt-2 mt-1.5">
                {quote.depositExpected > 0 && (
                  <SummaryRow label="Deposit expected" value={money(quote.depositExpected)} dim />
                )}
                <PayRow label="Deposit paid" value={money(quote.depositPaid)} paid={quote.depositPaid > 0} />
                <PayRow
                  label="Balance remaining"
                  value={money(quote.balanceRemaining)}
                  paid={quote.balanceRemaining === 0 && quote.total > 0}
                />
              </div>
            )}
          </dl>
        </section>

        {/* Hidden notes (private — never shown to the client) */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Hidden notes · private
          </p>
          <HiddenNotesControl id={id} initialNotes={draft.client.notes ?? ""} />
        </section>

        {/* Proofs */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Proofs</p>
          {quote.proofs.images.length === 0 && quote.proofs.pdfs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No files in the folder yet. Upload proofs and the printed-quote PDF in Drive.
            </p>
          ) : (
            <div className="space-y-4">
              {quote.proofs.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {quote.proofs.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-sm overflow-hidden border border-border bg-muted/30 aspect-square"
                      title={img.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.name} loading="lazy" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              {quote.proofs.pdfs.length > 0 && (
                <ul className="space-y-2">
                  {quote.proofs.pdfs.map((pdf) => (
                    <li key={pdf.id}>
                      <a
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:border-accent transition-colors"
                      >
                        <span aria-hidden className="text-accent">▢</span>
                        <span className="truncate">{pdf.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={"text-sm min-w-0 break-words " + (dim ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
      <span
        className={
          "font-mono tabular-nums text-sm shrink-0 " + (dim ? "text-muted-foreground" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}

function PayRow({ label, value, paid }: { label: string; value: string; paid: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-foreground min-w-0">
        {label}
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
            paid ? "bg-accent/40 text-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {paid ? "Paid" : "Due"}
        </span>
      </span>
      <span className="font-mono tabular-nums text-sm text-foreground shrink-0">{value}</span>
    </div>
  );
}
