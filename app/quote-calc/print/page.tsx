import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintQuote } from "./_components/PrintQuote";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

export const metadata = {
  title: "Quote",
  robots: { index: false, follow: false },
};

export default function QuotePrintPage() {
  if (!isQuoteAuthValid()) {
    redirect("/quote-calc");
  }

  return (
    <Suspense fallback={null}>
      <PrintQuote />
    </Suspense>
  );
}
