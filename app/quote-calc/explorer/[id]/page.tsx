// Admin per-quote detail: the client-facing category summary (so Janelle can
// sanity-check what the client sees), public-link controls, open-folder link,
// and the proofs gallery (admin-proxied so it works before any public link
// exists). Server-gated like the list.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import {
  getDraftById,
  getPortalMetaById,
  isSheetsConfigured,
  listConfig,
} from "@/lib/quote-calc-sheets";
import { mergeRemoteConfig } from "@/lib/quote-calc-config";
import { ITEM_CATALOG, fmt$ } from "@/lib/quote-calc-logic";
import { computeQuoteBreakdown } from "@/lib/quote-calc-totals";
import { buildPublicQuote, type PublicQuoteFile } from "@/lib/quote-calc-portal";
import { driveFileKind, folderWebLink, listFolderFiles } from "@/lib/quote-calc-drive";
import { LinkControls } from "../_components/LinkControls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quote detail",
  robots: { index: false, follow: false },
};

function money(n: number): string {
  return fmt$(Math.round(n));
}

export default async function ExplorerDetailPage({ params }: { params: { id: string } }) {
  if (!isQuoteAuthValid()) redirect("/quote-calc");
  if (!isSheetsConfigured()) notFound();

  const id = params.id;
  const draft = await getDraftById(id);
  if (!draft) notFound();

  const meta = await getPortalMetaById(id, { force: true });

  let catalog = ITEM_CATALOG;
  try {
    catalog = mergeRemoteConfig(await listConfig()).catalog;
  } catch {
    // bundled fallback
  }
  const breakdown = computeQuoteBreakdown(draft.config, draft.assumptionsSnapshot, catalog);

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

  const quote = buildPublicQuote(draft, breakdown, files, catalog);
  const savings = Math.round(quote.savings);
  const folderUrl = meta?.driveFolderId ? folderWebLink(meta.driveFolderId) : null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-squarepeg text-4xl leading-none truncate">{draft.client.name || "—"}</h1>
            <p className="text-xs text-muted-foreground normal-case tracking-normal mt-1">
              {quote.eventType} · {quote.eventDate} · {draft.name}
            </p>
          </div>
          <Link
            href="/quote-calc/explorer"
            className="text-xs normal-case tracking-normal underline underline-offset-4 text-muted-foreground hover:text-foreground shrink-0"
          >
            ← All quotes
          </Link>
        </header>

        {/* Link + folder controls */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Client link</p>
          <LinkControls id={id} token={meta?.publicToken ?? ""} linkStatus={meta?.linkStatus ?? ""} />
          <div className="pt-1">
            {folderUrl ? (
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Open Drive folder ↗
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                No Drive folder yet — it's created automatically the next time this quote is saved.
              </p>
            )}
          </div>
        </section>

        {/* Client-facing summary — exactly what the public link shows */}
        <section className="rounded-xl border border-border bg-card p-5 normal-case tracking-normal">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Client-facing summary — {quote.packageName}
          </p>
          {quote.includedPieces.length > 0 && (
            <ul className="text-sm space-y-0.5 mb-3">
              {quote.includedPieces.map((piece, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-accent">·</span>
                  <span>{piece}</span>
                </li>
              ))}
            </ul>
          )}
          <dl className="space-y-1.5 text-sm">
            {savings > 0 && (
              <>
                <SummaryRow label="Before savings" value={money(quote.total + quote.savings)} dim />
                <SummaryRow label="Your savings" value={`-${money(savings)}`} dim />
              </>
            )}
            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2 mt-1">
              <span className="text-sm font-medium">Total</span>
              <span className="font-mono tabular-nums text-base">{money(quote.total)}</span>
            </div>
          </dl>
        </section>

        {/* Proofs */}
        <section className="rounded-xl border border-border bg-card p-5 normal-case tracking-normal">
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
                      className="block rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square"
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
    </div>
  );
}

function SummaryRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={"text-sm " + (dim ? "text-muted-foreground" : "text-foreground")}>{label}</span>
      <span className={"font-mono tabular-nums text-sm " + (dim ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
