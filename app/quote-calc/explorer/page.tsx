// Admin Quote Explorer — list view. Server-gated like the print page; joins
// listDrafts() (client/event/total) with listPortalMeta() (link + folder).

import { redirect } from "next/navigation";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, listDrafts, listPortalMeta } from "@/lib/quote-calc-sheets";
import { folderWebLink } from "@/lib/quote-calc-drive";
import { ExplorerList, type ExplorerRow } from "./_components/ExplorerList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quote Explorer",
  robots: { index: false, follow: false },
};

export default async function ExplorerPage() {
  if (!isQuoteAuthValid()) redirect("/quote-calc");

  if (!isSheetsConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="max-w-md text-center text-sm text-muted-foreground normal-case tracking-normal">
          The Explorer needs Google Sheets configured. Set the GOOGLE_SHEETS_* env vars and reload.
        </p>
      </div>
    );
  }

  const [drafts, portal] = await Promise.all([listDrafts(), listPortalMeta({ force: true })]);

  const rows: ExplorerRow[] = drafts.map((d) => {
    const m = portal.get(d.id);
    return {
      id: d.id,
      client: d.client.name,
      eventType: d.client.eventType,
      eventDate: d.client.eventDate,
      name: d.name,
      total: Math.round(d.cachedTotal),
      publicToken: m?.publicToken ?? "",
      linkStatus: m?.linkStatus ?? "",
      expiresAt: m?.expiresAt ?? "",
      folderUrl: m?.driveFolderId ? folderWebLink(m.driveFolderId) : null,
    };
  });

  return <ExplorerList rows={rows} />;
}
