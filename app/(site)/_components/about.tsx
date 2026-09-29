"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { FounderPortrait } from "@/components/ui/founder-portrait";
import { founderFacts } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { CtaBlock, PageHeader, SiteButton } from "./ui";

export function SiteAbout() {
  const p = usePick();
  const { t } = useLocale();
  const [intro, ...rest] = siteConfig.about.sections;

  return (
    <>
      <PageHeader title={t("about.heading")} />
      <section className="px-4 pb-8 md:px-8">
        <Reveal className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          {founderFacts.map((f, i) => (
            <span key={i} className="rounded-full border border-border bg-card px-4 py-2 text-[10px] tracking-[0.18em]">{p(f)}</span>
          ))}
        </Reveal>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[auto_1fr]">
          <FounderPortrait className="mx-auto md:sticky md:top-28 md:self-start" />
          <Reveal className="site-paper site-stitch relative mx-auto max-w-2xl rounded-[4px] border border-border px-7 py-14 md:px-14">
            <div className="font-anybody-prose space-y-6 text-lg leading-relaxed">
              {intro.paragraphs.map((para, i) => (
                <p key={i} className={i === 0 ? "font-squarepeg text-4xl leading-tight" : ""}>{p(para)}</p>
              ))}
            </div>
            {rest.map((section, si) => (
              <div key={si} className="mt-12">
                {section.heading && <h2 className="mb-4 font-squarepeg text-5xl">{p(section.heading)}</h2>}
                <div className="font-anybody-prose space-y-6 text-lg leading-relaxed">
                  {section.paragraphs.map((para, i) => <p key={i}>{p(para)}</p>)}
                </div>
              </div>
            ))}
            <div className="mt-12 flex flex-wrap gap-3">
              <SiteButton href="/gallery">{t("cta.viewFullGallery")}</SiteButton>
              <SiteButton href="/weddings#collections" variant="outline">{t("cta.seeInvestment")}</SiteButton>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <Reveal className="mx-auto flex max-w-3xl justify-center">
          <Link href="/reviews" className="group inline-flex items-center gap-2 text-xs tracking-[0.16em] text-accent">
            {t("cta.readAllReviews")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
      <CtaBlock heading={t("investment.inquiry.heading")} body={t("investment.inquiry.body")} />
    </>
  );
}
