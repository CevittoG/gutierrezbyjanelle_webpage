"use client";

import { ExternalLink, Mail } from "lucide-react";
import { PriceCard } from "@/components/ui/price-card";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { MarqueeTicker } from "@/components/ui/marquee-ticker";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

export function InvestmentContent() {
  const { locale, t } = useLocale();

  const individualTier = siteConfig.investments.find((p) => p.id === "individual")!;
  const weddingSuites = siteConfig.investments.filter(
    (p) => p.id !== "individual" && p.id !== "add-ons"
  );
  const addOnsTier = siteConfig.investments.find((p) => p.id === "add-ons")!;

  return (
    <section className="container py-12 px-4 md:px-8">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center mb-14">
        <h1 className="font-squarepeg text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
          {t("investment.heading")}
        </h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          {t("investment.intro")}
        </p>
      </div>

      {/* ── Individual Item ─────────────────────────────────────── */}
      <div id="individual" className="max-w-5xl mx-auto mb-20 scroll-mt-20">
        <PriceCard plan={individualTier} className="max-w-xl mx-auto" />
      </div>

      {/* ── Wedding Suites ──────────────────────────────────────── */}
      <div id="wedding-suites" className="scroll-mt-20 max-w-5xl mx-auto mb-20">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weddingSuites.map((plan) => (
            <PriceCard key={plan.id} plan={plan} showPlaceholder />
          ))}
        </div>
      </div>

      {/* ── Event Collections ────────────────────────────────────────── */}
      <div id="event-suites" className="scroll-mt-20 max-w-5xl mx-auto mb-20">
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

      {/* ── Add-Ons ─────────────────────────────────────────────── */}
      <div id="add-ons" className="scroll-mt-20 max-w-5xl mx-auto mb-20">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("investment.addons.eyebrow")}
          </p>
          <h2 className="font-squarepeg text-3xl sm:text-4xl">
            {pick(addOnsTier.name, locale)}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            {pick(addOnsTier.description, locale)}
          </p>
        </div>
        <MarqueeTicker items={addOnsTier.features.map((f) => pick(f, locale))} />
      </div>

      {/* ── Etsy ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mb-20">
        <EtsyStoreCard store={siteConfig.etsyStore} />
      </div>

      {/* ── Inquiry section ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto text-center space-y-6 pb-8">
        <h2 className="font-squarepeg text-3xl sm:text-4xl">
          {t("investment.inquiry.heading")}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
          {t("investment.inquiry.body")}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button asChild size="lg" variant="outline">
            <a
              href={siteConfig.instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer" >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Instagram
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href={siteConfig.zola.vendorUrl}
              target="_blank"
              rel="noopener noreferrer" >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Zola
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href={`mailto:${siteConfig.contactEmail ?? ""}`}>
              <Mail className="w-4 h-4" aria-hidden="true" />
              {t("cta.email")}
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("cta.talkSoon")}</p>
      </div>

    </section>
  );
}
