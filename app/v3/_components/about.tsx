"use client";

import Image from "next/image";
import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { FounderPortrait } from "@/components/ui/founder-portrait";
import { conceptCopy, founderFacts } from "@/config/concepts";
import { siteConfig, type Founder } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { Pill, V3Cta, V3PageTitle } from "./ui";

const factStyles = ["bg-primary text-primary-foreground -rotate-3", "bg-muted rotate-2", "bg-card -rotate-1", "bg-[hsl(var(--butter-deep))] rotate-3", "bg-foreground text-background -rotate-2"];

export function V3About() {
  const p = usePick();
  const { t } = useLocale();
  const [intro, why, just, signoff] = siteConfig.about.sections;
  const founder: Founder = siteConfig.founder;

  return (
    <>
      <V3PageTitle eyebrow={p(conceptCopy.byline)} title={t("about.heading")} />

      <section className="px-4 pb-10 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          {founderFacts.map((f, i) => (
            <span key={i} className={cn("v3-pop v3-wiggle rounded-full border-2 border-foreground px-5 py-2.5 text-lg font-bold shadow-[3px_3px_0_hsl(var(--foreground))]", factStyles[i])} style={{ "--i": i + 3 } as React.CSSProperties}>
              {p(f)}
            </span>
          ))}
        </div>
      </section>

      <section className="px-4 py-10 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <Reveal className="v3-card bg-card p-7 md:col-span-2 md:p-10">
            <p className="v3-serif text-4xl leading-tight md:text-5xl">{p(intro.paragraphs[0])}</p>
            <p className="mt-6 text-lg leading-relaxed">{p(intro.paragraphs[1])}</p>
          </Reveal>
          <Reveal delay={120} className="v3-card relative grid min-h-[280px] place-items-center overflow-hidden bg-muted p-6">
            {founder.photo ? (
              <FounderPortrait className="max-w-none" />
            ) : (
              <Image src="/logo.svg" alt="" width={260} height={260} className="w-3/4 opacity-90" />
            )}
          </Reveal>
          <Reveal className="v3-card bg-primary p-7 text-primary-foreground md:p-10">
            <span className="v3-serif block text-8xl leading-[0.5]" aria-hidden="true">“</span>
            <p className="v3-serif mt-4 text-4xl leading-tight">{p(conceptCopy.pullQuote)}</p>
          </Reveal>
          {[why, just].map((s, i) => (
            <Reveal key={i} delay={i * 120} className={cn("v3-card p-7 md:p-9", i === 0 ? "bg-[hsl(var(--butter-deep))]" : "bg-card")}>
              {s.heading && <h2 className="v3-display text-3xl">{p(s.heading)}</h2>}
              {s.paragraphs.map((para, n) => <p key={n} className="mt-4 text-lg leading-relaxed">{p(para)}</p>)}
            </Reveal>
          ))}
          <Reveal className="v3-card flex flex-col justify-between gap-6 bg-foreground p-7 text-background md:col-span-3 md:flex-row md:items-center md:p-10">
            <p className="v3-serif max-w-2xl text-3xl leading-snug md:text-4xl">{p(signoff.paragraphs[0])}</p>
            <div className="flex shrink-0 flex-wrap gap-3 text-foreground">
              <Pill href="/v3/gallery" variant="cream">{t("cta.viewFullGallery")}</Pill>
              <Pill href="/v3/weddings#collections">{t("cta.seeInvestment")}</Pill>
            </div>
          </Reveal>
        </div>
      </section>
      <V3Cta />
    </>
  );
}
