// Gated studio dashboard — the new home for the quote tools. Joins
// listDrafts() (client/event/total) with listPortalMeta() (link + folder),
// exactly like the old Explorer, then hands the rows to the client Dashboard
// which derives all overview stats. Same data, richer presentation.

import { PasswordGate } from "@/app/quote-calc/_components/PasswordGate";
import { AppShell } from "@/components/quote-app/AppShell";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, listDrafts, listPortalMeta } from "@/lib/quote-calc-sheets";
import { folderWebLink } from "@/lib/quote-calc-drive";
import { PACKAGES } from "@/lib/quote-calc-logic";
import { Dashboard } from "./_components/Dashboard";
import type { QuoteRow } from "./_components/Dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function QuotesDashboardPage() {
  if (!isQuoteAuthValid()) {
    return <PasswordGate />;
  }

  if (!isSheetsConfigured()) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-16">
          <p className="max-w-md text-sm text-muted-foreground normal-case tracking-normal leading-relaxed">
            The dashboard needs Google Sheets configured. Set the GOOGLE_SHEETS_* env vars and reload.
            You can still build quotes in <span className="font-medium text-foreground">New quote</span>.
          </p>
        </div>
      </AppShell>
    );
  }

  const [drafts, portal] = await Promise.all([listDrafts(), listPortalMeta({ force: true })]);

  const rows: QuoteRow[] = drafts.map((d) => {
    const m = portal.get(d.id);
    return {
      id: d.id,
      client: d.client.name,
      eventType: d.client.eventType,
      eventDate: d.client.eventDate,
      name: d.name,
      packageName: PACKAGES[d.config.pkg]?.name ?? d.config.pkg,
      total: Math.round(d.cachedTotal),
      updatedAt: d.updatedAt,
      publicToken: m?.publicToken ?? "",
      linkStatus: m?.linkStatus ?? "",
      expiresAt: m?.expiresAt ?? "",
      folderUrl: m?.driveFolderId ? folderWebLink(m.driveFolderId) : null,
    };
  });

  // Single source of truth for "today" so SSR and client agree (no date drift).
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <Dashboard rows={rows} todayISO={todayISO} />
    </AppShell>
  );
}
