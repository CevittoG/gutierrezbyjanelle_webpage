import { PasswordGate } from "@/app/quote-calc/_components/PasswordGate";
import { QuoteCalculator } from "@/app/quote-calc/_components/QuoteCalculator";
import { AppShell } from "@/components/quote-app/AppShell";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

export const metadata = {
  title: "New quote",
  robots: { index: false, follow: false },
};

export default function NewQuotePage() {
  if (!isQuoteAuthValid()) {
    return <PasswordGate />;
  }

  return (
    <AppShell>
      <QuoteCalculator />
    </AppShell>
  );
}
