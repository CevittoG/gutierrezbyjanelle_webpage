"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StationeryHero } from "@/components/ui/hero-section";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

const GALLERY_PREVIEW = siteConfig.gallery.slice(0, 4);
const REVIEW_PREVIEW = siteConfig.reviews.slice(0, 2);

export function HomeContent() {
  const { locale, t } = useLocale();

  return (
    <div className="relative">
      {/* Fixed background logo — stays still while content scrolls over it */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none flex items-center justify-center"
        aria-hidden="true"
      >
        <Image
          src="/logo.svg"
          alt=""
          width={1100}
          height={1100}
          priority
          className="opacity-20 object-contain w-[80vw] max-w-[900px] h-auto"
        />
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <StationeryHero
        title={pick(siteConfig.hero.headline, locale)}
        description={pick(siteConfig.hero.subheadline, locale)}
        buttonText={t("cta.invest")}
        buttonLink="/investment"
        imageUrl1="/invitation/invite-4.png"
        imageUrl2="/invitation/invite-3.png"
      />

      {/* ── About ───────────────────────────────────────────────── */}
      <section className="section-panel">
        <div className="container max-w-3xl mx-auto py-20 px-4 md:px-8">
          <h2 className="font-squarepeg text-4xl md:text-5xl text-center mb-10">
            {t("home.about.heading")}{" "}
            <span className="italic">{t("home.about.headingItalic")}</span>
          </h2>
          <div className="space-y-5">
            {siteConfig.about.paragraphs.map((paragraph, i) => (
              <p
                key={i}
                className="normal-case tracking-normal font-normal text-foreground/85 leading-relaxed text-base md:text-lg max-w-[65ch] mx-auto text-center"
              >
                {pick(paragraph, locale)}
              </p>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Button asChild size="lg" variant="outline">
              <Link href={siteConfig.about.cta.href}>
                {pick(siteConfig.about.cta.label, locale)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Gallery Preview ─────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("home.gallery.eyebrow")}
            </p>
            <h2 className="font-squarepeg text-3xl sm:text-4xl">
              {t("home.gallery.heading")}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {GALLERY_PREVIEW.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link href="/gallery">
                {t("cta.viewFullGallery")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Reviews ─────────────────────────────────────────────── */}
      <section className="border-t border-border/40 py-20 px-4 md:px-8">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("home.reviews.eyebrow")}
            </p>
            <h2 className="font-squarepeg text-3xl sm:text-4xl">
              {t("home.reviews.heading")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {REVIEW_PREVIEW.map((review) => (
              <blockquote
                key={review.id}
                className="rounded-lg border border-border bg-card p-6 md:p-8"
              >
                <p
                  lang={locale}
                  className="normal-case tracking-normal font-normal text-foreground/80 leading-relaxed text-sm md:text-base line-clamp-6"
                >
                  &ldquo;{pick(review.text, locale)}&rdquo;
                </p>
                <footer className="mt-4 pt-4 border-t border-border/60">
                  <p className="font-squarepeg text-xl text-foreground">
                    {review.author}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pick(review.role, locale)}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link href="/reviews">
                {t("cta.readAllReviews")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="section-panel py-20 px-4 md:px-8">
        <div className="container max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("home.process.eyebrow")}
          </p>
          <h2 className="font-squarepeg text-3xl sm:text-4xl mb-12">
            {t("home.process.heading")}
          </h2>

          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {(
              [
                ["home.process.step1.title", "home.process.step1.body"],
                ["home.process.step2.title", "home.process.step2.body"],
                ["home.process.step3.title", "home.process.step3.body"],
              ] as const
            ).map(([titleKey, bodyKey], i) => (
              <li key={titleKey} className="space-y-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border text-sm text-foreground/70">
                  {i + 1}
                </span>
                <h3 className="font-squarepeg text-xl">{t(titleKey)}</h3>
                <p className="normal-case tracking-normal font-normal text-sm text-muted-foreground leading-relaxed max-w-[30ch] mx-auto">
                  {t(bodyKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Inquiry CTA ─────────────────────────────────────────── */}
      <section className="section-panel py-20 px-4 md:px-8">
        <div className="container max-w-2xl mx-auto text-center space-y-6">
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
                rel="noopener noreferrer">
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
          <p className="text-xs text-muted-foreground pt-1">{t("cta.talkSoon")}</p>
        </div>
      </section>
    </div>
  );
}
