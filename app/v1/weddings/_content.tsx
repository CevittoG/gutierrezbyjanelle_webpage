"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { PriceCard } from "@/components/ui/price-card";
import { MarqueeTicker } from "@/components/ui/marquee-ticker";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

export function WeddingsContent() {
  const { locale, t } = useLocale();

  const weddingSuites = siteConfig.investments.filter((p) => p.id !== "add-ons");
  const itemsTier = siteConfig.investments.find((p) => p.id === "add-ons")!;

  return (
    <>
      <section className="container flex flex-col items-center justify-center pt-24 pb-12 px-4 md:px-8 text-center">
        <h1 className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
          {t("weddings.h1")}
        </h1>
      </section>

      <section className="container max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-border shadow-sm">
          <Image
            src="/gallery/ceremony-card.jpeg"
            alt="A ceremony card designed by Janelle"
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
            priority
          />
        </figure>
      </section>

      <section className="bg-muted/50 border-t border-border">
        <div className="container max-w-2xl mx-auto py-20 px-4 md:px-8">
          <h2 className="font-squarepeg text-4xl md:text-5xl text-center mb-10">
            {t("weddings.letterHeading")}
          </h2>

          <div className="font-anybody-prose space-y-6 text-foreground text-lg leading-relaxed">
            {siteConfig.weddings.paragraphs.map((paragraph, i) => (
              <p key={i}>{pick(paragraph, locale)}</p>
            ))}
          </div>

          <div className="my-12 h-px bg-border" aria-hidden="true" />

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <Button asChild size="lg" variant="outline">
              <a
                href={siteConfig.instagram.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                {t("cta.instagram")}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#wedding-investment">{t("cta.invest")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 px-4 md:px-8">
        <div id="wedding-investment" className="scroll-mt-20 max-w-5xl mx-auto">
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

          <div id="wedding-suites" className="scroll-mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t("investment.wedding.eyebrow")}
              </p>
              <h2 className="font-squarepeg text-3xl sm:text-4xl">
                {t("investment.wedding.heading")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
                {t("investment.wedding.body")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {weddingSuites.map((plan) => (
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
