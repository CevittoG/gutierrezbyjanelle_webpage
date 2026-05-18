import { PriceCard } from "@/components/ui/price-card";
import { siteConfig } from "@/config/site";

export default function PricingPage() {
  return (
    <section className="container py-12 px-4 md:px-8">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
        <h1 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">Simple Pricing</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Transparent plans with no hidden fees.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {siteConfig.pricing.map((plan) => (
          <PriceCard key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}
