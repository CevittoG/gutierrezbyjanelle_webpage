// Gated, read-only Price book (docs/quote-builder-redesign.md §10.6). Janelle
// edits prices in the Sheet; this page shows where each price sits against its
// floor, its target and the market, and offers the one-time tab seed.

import { PasswordGate } from "@/app/quote-calc/_components/PasswordGate";
import { AppShell } from "@/components/quote-app/AppShell";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { isSheetsConfigured, listPriceBook, priceBookSheetUrl } from "@/lib/quote-calc-sheets";
import { mergePriceBook, type MergedPriceBook } from "@/lib/quote-pricebook";
import { PriceBookView } from "./_components/PriceBookView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Price book",
  robots: { index: false, follow: false },
};

export default async function PriceBookPage() {
  if (!isQuoteAuthValid()) return <PasswordGate />;

  const configured = isSheetsConfigured();
  let merged: MergedPriceBook = mergePriceBook(null);
  let failed = false;
  if (configured) {
    try {
      merged = mergePriceBook(await listPriceBook());
    } catch (err) {
      console.warn("[/quotes/prices] price book read failed", err);
      failed = true;
    }
  }

  return (
    <AppShell>
      <PriceBookView
        merged={merged}
        sheetUrl={configured ? priceBookSheetUrl() : null}
        state={!configured ? "unconfigured" : failed ? "failed" : "ok"}
      />
    </AppShell>
  );
}
