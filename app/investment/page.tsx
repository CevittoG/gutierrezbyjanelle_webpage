import type { Metadata } from "next";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { PriceCard } from "@/components/ui/price-card";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { MarqueeTicker } from "@/components/ui/marquee-ticker";
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

const NAV_LINKS = [
  { label: "Individual Item",   href: "#individual"     },
  { label: "Wedding Suites",    href: "#wedding-suites" },
  { label: "Event Suites",      href: "#event-suites"   },
  { label: "Add-Ons",           href: "#add-ons"        },
] as const;

export default function InvestmentPage() {
  const addOnsTier = siteConfig.investments.find((p) => p.id === "add-ons")!;

  return (
    <section className="container py-12 px-4 md:px-8">

      {/* Page header */}
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center mb-8">
        <h1 className="font-squarepeg text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Your Investment</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Explore what each investment includes and reach out to begin your custom quote.
        </p>
      </div>

      {/* Jump-to navigation */}
      <nav aria-label="Jump to section" className="flex items-center justify-center gap-2 flex-wrap mb-10">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted hover:border-accent/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Inquire banner */}
      <div className="mx-auto max-w-5xl mb-10">
        <div className="rounded-lg border border-border bg-accent/40 px-6 py-5 text-center space-y-4">
          <p className="text-foreground font-medium">
            Inquire for a quote — Let&apos;s create a brand for your next event.
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

      {/* ── Individual Item ─────────────────────────────────────── */}
      <div id="individual" className="max-w-5xl mx-auto mb-16 scroll-mt-20">
        <PriceCard
          plan={siteConfig.investments.find((p) => p.id === "individual")!}
          className="max-w-xl mx-auto"
        />
      </div>

      {/* ── Optimized Value Wedding Suites ──────────────────────── */}
      <div id="wedding-suites" className="scroll-mt-20">
        <h2 className="font-squarepeg text-3xl sm:text-4xl md:text-5xl text-center mb-6">
          Optimized Value Wedding Suites
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {siteConfig.investments
            .filter((p) => p.id !== "individual" && p.id !== "add-ons")
            .map((plan) => (
              <PriceCard key={plan.id} plan={plan} />
            ))}
        </div>
      </div>

      {/* ── Optimized Value Event Suites ────────────────────────── */}
      <div id="event-suites" className="mt-20 scroll-mt-20">
        <h2 className="font-squarepeg text-3xl sm:text-4xl md:text-5xl text-center mb-6">
          Optimized Value Event Suites
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {siteConfig.eventInvestments.map((plan) => (
            <PriceCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      {/* ── Add-Ons ─────────────────────────────────────────────── */}
      <div id="add-ons" className="mt-20 max-w-5xl mx-auto scroll-mt-20">
        <div className="text-center mb-6">
          <h2 className="font-squarepeg text-3xl sm:text-4xl">{addOnsTier.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            {addOnsTier.description}
          </p>
        </div>
        <MarqueeTicker items={addOnsTier.features} />
      </div>

      <div className="mt-16 max-w-5xl mx-auto">
        <EtsyStoreCard store={siteConfig.etsyStore} />
      </div>

    </section>
  );
}
