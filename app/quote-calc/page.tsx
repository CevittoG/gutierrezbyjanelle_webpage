import { PasswordGate } from "./_components/PasswordGate";
import { QuoteCalculator } from "./_components/QuoteCalculator";
import { isQuoteAuthValid } from "@/lib/quote-calc-auth";

export const metadata = {
  title: "Tools",
  robots: { index: false, follow: false },
};

export default function QuoteCalcPage() {
  if (!isQuoteAuthValid()) {
    return <PasswordGate />;
  }

  return <QuoteCalculator />;
}
