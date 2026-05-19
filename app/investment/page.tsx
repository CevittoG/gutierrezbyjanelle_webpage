import type { Metadata } from "next";
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
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
        <h1 className="font-squarepeg text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Your Investment</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Transparent plans with no hidden fees.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {siteConfig.pricing.map((plan) => (
          <PriceCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-16 max-w-4xl mx-auto">
        <EtsyStoreCard store={siteConfig.etsyStore} />
      </div>
    </section>
  );
}
