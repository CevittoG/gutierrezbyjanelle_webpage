"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { mailtoHref, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig, type InvestmentTier } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { Kicker, V2Cta, V2PageTitle } from "./ui";

const content = {
  weddings: {
    h1: "weddings.h1",
    paragraphs: siteConfig.weddings.paragraphs,
    tiers: siteConfig.investments.filter((i) => i.id !== "add-ons") as InvestmentTier[],
    eyebrow: "investment.wedding.eyebrow",
    heading: "investment.wedding.heading",
    body: "investment.wedding.body",
    cover: { src: "/gallery/welcome-sign-2.jpeg", alt: "Wedding welcome sign for Janelle and Sebastián" },
    side: { src: "/gallery/ceremony-card.jpeg", alt: "Ceremony program in hand" },
    review: 1,
  },
  events: {
    h1: "events.h1",
    paragraphs: siteConfig.events.paragraphs,
    tiers: siteConfig.eventInvestments as InvestmentTier[],
    eyebrow: "investment.events.eyebrow",
    heading: "investment.events.heading",
    body: "investment.events.body",
    cover: { src: "/gallery/welcome-sign-3.jpeg", alt: "Baby shower welcome sign on a garden path" },
    side: { src: "/gallery/shower-game-guess-who.jpeg", alt: "Guess Who baby shower game cards" },
    review: 2,
  },
} as const;

export function V2Occasion({ kind }: { kind: "weddings" | "events" }) {
  const p = usePick();
  const { t } = useLocale();
  const c = content[kind];
  const [first, ...rest] = c.paragraphs;
  const addOns = siteConfig.investments.find((i) => i.id === "add-ons")!;
  const review = siteConfig.reviews[c.review];

  return (
    <>
      <V2PageTitle kicker={p(conceptCopy.heroEyebrow)} title={t(c.h1)} standfirst={p(first)} />

      {/* ── Full-bleed cover that settles as you scroll ──── */}
      <section className="px-4 md:px-10">
        <figure className="v2-zoom relative mx-auto aspect-[4/5] max-w-7xl overflow-hidden sm:aspect-[16/9]">
          <Image src={c.cover.src} alt={c.cover.alt} fill priority sizes="100vw" className="object-cover" />
        </figure>
      </section>

      {/* ── The letter ────────────────────────────────────── */}
      {rest.length > 0 && (
        <section id="letter" className="px-4 py-24 md:px-10 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Kicker>{t("weddings.letterHeading")}</Kicker>
              <Reveal variant="mask" className="mt-8 hidden w-2/3 lg:block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={c.side.src} alt={c.side.alt} fill sizes="25vw" className="object-cover" />
                </div>
              </Reveal>
            </div>
            <div className="max-w-2xl space-y-7 text-lg leading-[1.8]">
              {rest.map((para, i) => (
                <Reveal as="p" key={i} className={i === 0 ? "v2-dropcap" : ""}>{p(para)}</Reveal>
              ))}
              <Reveal as="p" className="v2-italic pt-4 text-3xl text-primary">{t("cta.talkSoon")}</Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── Collections as chapters ───────────────────────── */}
      <section id="collections" className="scroll-mt-28 bg-muted px-4 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:items-end">
            <div>
              <Kicker>{t(c.eyebrow)}</Kicker>
              <Reveal as="h2" className="v2-serif mt-5 text-5xl font-light leading-none md:text-7xl">{t(c.heading)}</Reveal>
            </div>
            <Reveal as="p" delay={100} className="max-w-xl text-lg leading-relaxed text-muted-foreground">{t(c.body)}</Reveal>
          </div>

          <div className="mt-16 border-t border-foreground/20">
            {c.tiers.map((tier, i) => (
              <Reveal key={tier.id} className="grid gap-8 border-b border-foreground/20 py-12 md:grid-cols-12 md:gap-10">
                <div className="md:col-span-5">
                  <div className="flex items-baseline gap-4">
                    <span className="v2-italic text-xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-accent" aria-label={`Savings ${tier.savingsLabel}`}>{tier.savingsLabel}</span>
                  </div>
                  <h3 className="v2-serif mt-3 text-4xl font-light leading-tight md:text-5xl">{p(tier.name)}</h3>
                  <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">{p(tier.description)}</p>
                  <a href={mailtoHref(`${p(conceptCopy.mailSubject)}: ${p(tier.name)}`)} className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold">
                    <span className="v2-link">{p(conceptCopy.askAbout)}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                </div>
                <div className="md:col-span-7">
                  <p className="v2-kicker mb-4 text-muted-foreground">{p(conceptCopy.whatsIncluded)}</p>
                  <ol className="columns-1 gap-10 sm:columns-2">
                    {tier.features.map((f, n) => (
                      <li key={n} className="flex break-inside-avoid items-baseline gap-3 py-2">
                        <span className="v2-serif">{p(f)}</span>
                        <span className="v2-leader" aria-hidden="true" />
                        <span className="v2-italic text-sm text-accent">{String(n + 1).padStart(2, "0")}</span>
                      </li>
                    ))}
                  </ol>
                  {tier.image && (
                    <div className="relative mt-6 aspect-[16/9] overflow-hidden">
                      <Image src={tier.image.src} alt={p(tier.image.alt)} fill sizes="50vw" className="object-cover" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── À la carte, set as an index ───────────────────── */}
      <section id="individual-items" className="px-4 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <Kicker>{t("investment.addons.eyebrow")}</Kicker>
          <Reveal as="h2" className="v2-serif mt-5 text-4xl font-light md:text-5xl">{p(addOns.name)}</Reveal>
          <p className="mt-4 max-w-xl text-muted-foreground">{p(addOns.description)}</p>
          <ul className="mt-12 columns-2 gap-10 md:columns-4">
            {addOns.features.map((f, i) => (
              <li key={i} className="v2-italic break-inside-avoid border-b border-foreground/10 py-3 text-xl transition-colors hover:text-primary">
                {p(f)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Pull quote ────────────────────────────────────── */}
      <section className="px-4 pb-24 md:px-10">
        <Reveal className="mx-auto max-w-4xl text-center">
          <span aria-hidden="true" className="v2-qmark v2-italic block text-[8rem] leading-[0.6] text-accent">“</span>
          <blockquote lang={review.originalLang} className="v2-serif mt-4 text-2xl font-light leading-snug md:text-3xl">{p(review.text)}</blockquote>
          <p className="v2-italic mt-6 text-xl">{review.author}</p>
          <p className="text-sm text-muted-foreground">{p(review.role)}</p>
        </Reveal>
      </section>

      <V2Cta heading={t("investment.inquiry.heading")} body={t("investment.inquiry.body")} />
    </>
  );
}
