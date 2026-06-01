"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Mail } from "lucide-react";
import FlowArt, { FlowSection, FlowSectionProps } from "@/components/ui/flow-art";
import { StationeryHero } from "@/components/ui/hero-section";
import { ReviewCard } from "@/components/ui/review-card";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

function SceneWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <Image
        src="/logo.svg"
        alt=""
        width={1100}
        height={1100}
        priority
        className="opacity-15 object-contain w-[70vw] max-w-[700px] h-auto"
      />
    </div>
  );
}

function Scene({
  children,
  innerClassName,
  ...flowProps
}: FlowSectionProps) {
  return (
    <FlowSection {...flowProps} innerClassName={innerClassName}>
      <SceneWatermark />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
        {children}
      </div>
    </FlowSection>
  );
}

export function HomeContent() {
  const { locale, t } = useLocale();
  const [featuredReview] = siteConfig.reviews;

  return (
    <FlowArt aria-label="Gutierrez by Janelle — story scroll">
      {/* ── Scene 1 · Hero ───────────────────────────────────── */}
      <Scene
        aria-label="Hero"
        style={{ backgroundColor: "hsl(30 45% 95%)" }}
      >
        <StationeryHero
          title={pick(siteConfig.hero.headline, locale)}
          description={pick(siteConfig.hero.subheadline, locale)}
          buttonText={t("cta.invest")}
          buttonLink="/investment"
          imageUrl1="/invitation/invite-4.png"
          imageUrl2="/invitation/invite-3.png"
        />
      </Scene>

      {/* ── Scene 2 · Weddings ───────────────────────────────── */}
      <Scene
        aria-label="For brides and grooms"
        style={{ backgroundColor: "hsl(30 38% 90%)" }}
      >
        <div className="container max-w-4xl mx-auto px-4 md:px-8 flex flex-col items-center gap-10 text-center">
          <h2 className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
            {t("weddings.h1")}
          </h2>

          <figure
            className="glass relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-2xl border border-border"
          >
            <Image
              src="/gallery/ceremony-card.jpeg"
              alt="A ceremony card designed by Janelle"
              fill
              sizes="(min-width: 768px) 640px, 100vw"
              className="object-cover"
            />
          </figure>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/weddings">
                {t("nav.weddings")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/gallery">
                {t("cta.viewFullGallery")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Scene>

      {/* ── Scene 3 · Reviews highlight ──────────────────────── */}
      <Scene
        aria-label="Kind words"
        style={{ backgroundColor: "hsl(30 34% 85%)" }}
      >
        <div className="container max-w-4xl mx-auto px-4 md:px-8 flex flex-col items-center gap-10">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("home.reviews.eyebrow")}
            </p>
            <h2 className="font-squarepeg text-4xl md:text-5xl">
              {t("home.reviews.heading")}
            </h2>
          </div>

          {featuredReview && (
            <ReviewCard review={featuredReview} variant="featured" />
          )}

          <Button asChild variant="outline" size="lg">
            <Link href="/reviews">
              {t("cta.readAllReviews")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Scene>

      {/* ── Scene 4 · Inquiry CTA ────────────────────────────── */}
      <Scene
        aria-label="Let's design your day"
        style={{ backgroundColor: "hsl(30 32% 80%)" }}
      >
        <div className="container max-w-2xl mx-auto px-4 md:px-8 text-center space-y-6">
          <h2 className="font-squarepeg text-4xl md:text-5xl">
            {t("home.cta.heading")}{" "}
            <span className="italic">{t("home.cta.headingItalic")}</span>{" "}
            {t("home.cta.headingTail")}
          </h2>
          <p className="normal-case tracking-normal font-normal text-foreground/80 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
            {t("home.cta.body")}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Button asChild size="lg" variant="outline">
              <a
                href={siteConfig.instagram.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Instagram
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={siteConfig.zola.vendorUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Zola
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`mailto:${siteConfig.contactEmail ?? ""}`}>
                <Mail className="w-4 h-4" aria-hidden="true" />
                {t("cta.email")}
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            {t("cta.talkSoon")}
          </p>

          <div className="pt-4">
            <EtsyStoreCard
              store={siteConfig.etsyStore}
              className="max-w-2xl mx-auto"
            />
          </div>
        </div>
      </Scene>
    </FlowArt>
  );
}
