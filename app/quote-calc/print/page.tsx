import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintQuote } from "./_components/PrintQuote";

export const metadata = {
  title: "Quote",
  robots: { index: false, follow: false },
};

export default function QuotePrintPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get("quote_auth")?.value === "1";

  if (!isAuthenticated) {
    redirect("/quote-calc");
  }

  return (
    <Suspense fallback={null}>
      <PrintQuote />
    </Suspense>
  );
}
