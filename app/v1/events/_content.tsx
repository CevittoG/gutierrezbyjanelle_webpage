"use client";

import { PriceCard } from "@/components/ui/price-card";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { MarqueeTicker } from "@/components/ui/marquee-ticker";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

export function EventsContent() {
  const { locale, t } = useLocale();

  const itemsTier = siteConfig.investments.find((p) => p.id === "add-ons")!;

  return (
    <>
      <section className="container flex flex-col items-center justify-center pt-24 pb-12 px-4 md:px-8 text-center">
        <h1 className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
          {t("events.h1")}
        </h1>
      </section>

      <section className="bg-muted/50 border-t border-border">
        <div className="container max-w-2xl mx-auto py-20 px-4 md:px-8">
          <div className="font-anybody-prose space-y-6 text-foreground text-lg leading-relaxed text-center">
            {siteConfig.events.paragraphs.map((paragraph, i) => (
              <p key={i}>{pick(paragraph, locale)}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 px-4 md:px-8">
        <div id="event-investment" className="scroll-mt-20 max-w-5xl mx-auto">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center mb-14">
            <h2 className="font-squarepeg text-4xl sm:text-5xl leading-[1.05]">
              {t("investment.heading")}
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              {t("investment.intro")}
            </p>
          </div>

          <div id="individual-items" className="scroll-mt-20 max-w-5xl mx-auto mb-20">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t("investment.addons.eyebrow")}
              </p>
              <h2 className="font-squarepeg text-3xl sm:text-4xl">
                {pick(itemsTier.name, locale)}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
                {pick(itemsTier.description, locale)}
              </p>
            </div>
            <MarqueeTicker items={itemsTier.features.map((f) => pick(f, locale))} />
          </div>

          <div id="event-suites" className="scroll-mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t("investment.events.eyebrow")}
              </p>
              <h2 className="font-squarepeg text-3xl sm:text-4xl">
                {t("investment.events.heading")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
                {t("investment.events.body")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {siteConfig.eventInvestments.map((plan) => (
                <PriceCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16 px-4 md:px-8">
        <EtsyStoreCard store={siteConfig.etsyStore} className="max-w-4xl mx-auto" />
      </section>
    </>
  );
}
