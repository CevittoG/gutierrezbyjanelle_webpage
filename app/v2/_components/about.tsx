"use client";

import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { FounderPortrait } from "@/components/ui/founder-portrait";
import { conceptCopy, founderFacts } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { Kicker, V2Button, V2Cta, V2PageTitle } from "./ui";

export function V2About() {
  const p = usePick();
  const { t } = useLocale();
  const [intro, ...sections] = siteConfig.about.sections;
  const [opening, ...story] = intro.paragraphs;

  return (
    <>
      <V2PageTitle kicker={p(conceptCopy.byline)} title={t("about.heading")} standfirst={p(opening)} />

      <section className="px-4 pb-24 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_2fr]">
          <aside className="lg:sticky lg:top-40 lg:self-start">
            <FounderPortrait className="mb-8" />
            <Kicker className="mb-4 text-muted-foreground">Janelle</Kicker>
            <ul className="border-t border-foreground/15">
              {founderFacts.map((f, i) => (
                <Reveal as="li" key={i} delay={i * 80} className="v2-italic flex items-baseline justify-between border-b border-foreground/15 py-3 text-2xl">
                  {p(f)} <span className="v2-serif text-sm not-italic text-accent">{String(i + 1).padStart(2, "0")}</span>
                </Reveal>
              ))}
            </ul>
          </aside>

          <article className="text-lg leading-[1.8]">
            {story.map((para, i) => (
              <Reveal as="p" key={i} className="v2-dropcap mb-7 md:columns-2 md:gap-10">{p(para)}</Reveal>
            ))}

            <Reveal className="my-16 border-y border-foreground/20 py-12 text-center">
              <span aria-hidden="true" className="v2-qmark v2-italic block text-7xl leading-[0.5] text-accent">“</span>
              <p className="v2-italic mt-6 text-4xl leading-tight text-primary md:text-6xl">{p(conceptCopy.pullQuote)}</p>
            </Reveal>

            {sections.map((section, si) => (
              <div key={si} className="mb-12">
                {section.heading && <Reveal as="h2" className="v2-serif mb-5 text-4xl font-light">{p(section.heading)}</Reveal>}
                {section.paragraphs.map((para, i) => (
                  <Reveal as="p" key={i} className="mb-6">{p(para)}</Reveal>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <V2Button href="/v2/gallery">{t("cta.viewFullGallery")}</V2Button>
              <V2Button href="/v2/weddings#collections" variant="ghost">{t("cta.seeInvestment")}</V2Button>
            </div>
          </article>
        </div>
      </section>
      <V2Cta />
    </>
  );
}
