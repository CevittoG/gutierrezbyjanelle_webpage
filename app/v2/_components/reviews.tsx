"use client";

import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { V2Cta, V2PageTitle } from "./ui";

export function V2Reviews() {
  const p = usePick();
  const { t } = useLocale();
  const total = String(siteConfig.reviews.length).padStart(2, "0");

  return (
    <>
      <V2PageTitle kicker={t("home.reviews.eyebrow")} title={t("reviews.heading")} standfirst={t("reviews.intro")} />
      <section className="px-4 md:px-10">
        <div className="mx-auto max-w-7xl">
          {siteConfig.reviews.map((r, i) => (
            <Reveal key={r.id} className={cn("grid gap-8 border-t border-foreground/15 py-20 md:grid-cols-12 md:py-28", i % 2 === 1 && "bg-muted/60 md:-mx-10 md:px-10")}>
              <div className="md:col-span-3">
                <p className="v2-serif text-sm text-muted-foreground">
                  <span className="text-5xl font-light text-primary">{String(i + 1).padStart(2, "0")}</span> / {total}
                </p>
                <span aria-hidden="true" className="v2-qmark v2-italic mt-6 block text-[9rem] leading-[0.6] text-accent">“</span>
              </div>
              <figure className="md:col-span-9">
                <blockquote lang={r.originalLang} className="v2-serif text-2xl font-light leading-snug md:text-[2.4rem] md:leading-[1.25]">
                  {p(r.text)}
                </blockquote>
                <figcaption className="mt-10 flex items-center gap-4">
                  <span className="v2-rule w-12" />
                  <span className="v2-italic text-2xl">{r.author}</span>
                  <span className="text-sm text-muted-foreground">{p(r.role)}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
      <V2Cta />
    </>
  );
}
