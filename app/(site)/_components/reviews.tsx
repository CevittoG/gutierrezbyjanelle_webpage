"use client";

import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { CtaBlock, PageHeader } from "./ui";

const tilt = ["-rotate-1", "rotate-[1.5deg]", "rotate-[-2deg]", "rotate-1"];

export function SiteReviews() {
  const p = usePick();
  const { t } = useLocale();
  return (
    <>
      <PageHeader eyebrow={t("home.reviews.eyebrow")} title={t("reviews.heading")} intro={t("reviews.intro")} />
      <section className="px-4 py-12 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          {siteConfig.reviews.map((r, i) => (
            <Reveal key={r.id} delay={(i % 2) * 150} className={cn(i % 2 === 1 && "md:mt-20")}>
              <figure className={cn("site-paper site-stitch relative rounded-[4px] border border-border px-8 pb-10 pt-14 transition-transform duration-500 hover:rotate-0", tilt[i % tilt.length])}>
                <span className="site-seal absolute -top-6 left-8 h-12 w-12 font-squarepeg text-4xl leading-none" aria-hidden="true">“</span>
                <blockquote lang={r.originalLang} className="font-anybody-prose text-lg leading-relaxed">{p(r.text)}</blockquote>
                <figcaption className="mt-8 flex items-baseline justify-between gap-4 border-t border-dashed border-border pt-5">
                  <span className="font-squarepeg text-4xl">{r.author}</span>
                  <span className="text-[10px] tracking-[0.18em] text-muted-foreground">{p(r.role)}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBlock heading={<>{t("home.cta.heading")} {t("home.cta.headingItalic")} {t("home.cta.headingTail")}</>} body={t("home.cta.body")} />
    </>
  );
}
