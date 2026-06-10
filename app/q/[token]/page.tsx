// Public, read-only client portal for a single quote. No admin cookie — this
// route lives outside /quote-calc so the gate cookie is never even sent.
//
// Dynamic SSR so a revoked/expired link stops resolving promptly (token-meta is
// cached ~30s in the sheets module). The full Draft (incl. secret rates) is read
// server-side here and projected to a PublicQuote — only that crosses to the client.

import { notFound } from "next/navigation";
import {
  findByPublicToken,
  getDraftById,
  isSheetsConfigured,
  listConfig,
} from "@/lib/quote-calc-sheets";
import { mergeRemoteConfig } from "@/lib/quote-calc-config";
import { ITEM_CATALOG } from "@/lib/quote-calc-logic";
import { computeQuoteBreakdown } from "@/lib/quote-calc-totals";
import {
  buildPublicQuote,
  isLinkActive,
  type PublicQuoteFile,
} from "@/lib/quote-calc-portal";
import { driveFileKind, listFolderFiles } from "@/lib/quote-calc-drive";
import { PublicQuoteView } from "./_components/PublicQuoteView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Your quote · Gutierrez by Janelle",
  robots: { index: false, follow: false },
};

export default async function PublicQuotePage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;
  if (!isSheetsConfigured()) notFound();

  const meta = await findByPublicToken(token);
  if (!meta || !isLinkActive(meta)) notFound();

  const draft = await getDraftById(meta.id);
  if (!draft) notFound();

  // Live catalog (so labels/qty match what Janelle quoted); bundled fallback.
  let catalog = ITEM_CATALOG;
  try {
    catalog = mergeRemoteConfig(await listConfig()).catalog;
  } catch {
    // keep bundled catalog
  }

  const breakdown = computeQuoteBreakdown(draft.config, draft.assumptionsSnapshot, catalog);

  // Proofs — images + PDF, each behind the same-origin streaming proxy.
  let files: PublicQuoteFile[] = [];
  if (meta.driveFolderId) {
    try {
      const driveFiles = await listFolderFiles(meta.driveFolderId);
      files = driveFiles
        .map((f) => ({ f, kind: driveFileKind(f.mimeType) }))
        .filter((x): x is { f: (typeof driveFiles)[number]; kind: "image" | "pdf" } =>
          x.kind === "image" || x.kind === "pdf",
        )
        .map(({ f, kind }) => ({
          id: f.id,
          name: f.name,
          kind,
          url: `/q/${encodeURIComponent(token)}/file/${encodeURIComponent(f.id)}`,
        }));
    } catch (err) {
      console.warn("[/q] folder listing failed", err);
    }
  }

  const quote = buildPublicQuote(draft, breakdown, files, catalog);
  return <PublicQuoteView quote={quote} />;
}
