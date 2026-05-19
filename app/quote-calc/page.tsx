import { cookies } from "next/headers";
import { PasswordGate } from "./_components/PasswordGate";
import { QuoteCalculator } from "./_components/QuoteCalculator";

export const metadata = {
  title: "Tools",
  robots: { index: false, follow: false },
};

export default function QuoteCalcPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get("quote_auth")?.value === "1";

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  return <QuoteCalculator />;
}
