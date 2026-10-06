"use client";

import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { faqSections, faqs } from "@/config/faq";
import { useLocale } from "@/lib/locale-context";
import { CtaBlock, PageHeader } from "./ui";

/**
 * /faq: the one page built to be quoted. Each H2 opens with its direct answer,
 * each question is an H3 with its answer always visible (never collapsed), so
 * readers and crawlers get the same text. Linked from the footer only.
 */
export function SiteFaq() {
  const p = usePick();
  const { t } = useLocale();

  return (
    <>
      <PageHeader eyebrow={t("faq.eyebrow")} title={t("faq.heading")} intro={t("faq.intro")} />

      <nav aria-label={t("faq.jump")} className="px-4 pb-4 md:px-8">
        <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          {faqSections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block rounded-full border border-border bg-card px-4 py-2 text-[10px] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {p(s.title)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {faqSections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`} className="scroll-mt-24 px-4 py-10 md:px-8">
          <Reveal className="site-paper site-stitch relative mx-auto max-w-3xl rounded-[4px] border border-border px-7 py-12 md:px-14">
            <h2 id={`${s.id}-heading`} className="font-squarepeg text-5xl leading-none md:text-6xl">{p(s.title)}</h2>
            <p className="font-anybody-prose mt-5 text-lg leading-relaxed">{p(s.lead)}</p>
            {faqs.filter((f) => f.section === s.id).map((f) => (
              <div key={f.id} id={f.id} className="mt-9 scroll-mt-24 border-t border-dashed border-border pt-7">
                <h3 className="text-[13px] leading-snug tracking-[0.14em]">{p(f.q)}</h3>
                <p className="font-anybody-prose mt-3 leading-relaxed text-muted-foreground">{p(f.a)}</p>
              </div>
            ))}
          </Reveal>
        </section>
      ))}

      <CtaBlock heading={t("investment.inquiry.heading")} body={t("investment.inquiry.body")} />
    </>
  );
}
