import type { Metadata } from "next";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { PriceCard } from "@/components/ui/price-card";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Investment",
  description: `View investment options for custom wedding stationery and event design by ${siteConfig.name}.`,
  openGraph: {
    url: `${siteConfig.url}/investment`,
    title: `Investment | ${siteConfig.name}`,
    description: `View investment options for custom wedding stationery and event design by ${siteConfig.name}.`,
  },
};

export default function InvestmentPage() {
  return (
    <section className="container py-12 px-4 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center mb-8">
        <h1 className="font-squarepeg text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Your Investment</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Explore what each investment includes and reach out to begin your custom quote.
        </p>
      </div>

      <div className="mx-auto max-w-5xl mb-10">
        <div className="rounded-lg border border-border bg-accent/40 px-6 py-5 text-center space-y-4">
          <p className="text-foreground font-medium">
            Inquire for a quote — I&apos;d love to bring your vision to life.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href={siteConfig.etsyStore.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              Etsy
            </a>
            <a
              href={siteConfig.instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Individual tier — full-width featured card, centred within the main grid container */}
      <div className="max-w-5xl mx-auto mb-12">
        <PriceCard
          plan={siteConfig.investments.find((p) => p.id === "individual")!}
          className="max-w-xl mx-auto"
        />
      </div>

      <h2 className="font-squarepeg text-3xl sm:text-4xl md:text-5xl text-center mb-6">Optimized Value Suites</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {siteConfig.investments
          .filter((p) => p.id !== "individual")
          .map((plan) => (
            <PriceCard key={plan.id} plan={plan} />
          ))}
      </div>

      <div className="mt-16 max-w-5xl mx-auto">
        <EtsyStoreCard store={siteConfig.etsyStore} />
      </div>
    </section>
  );
}
