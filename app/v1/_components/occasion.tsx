"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { Marquee } from "@/components/concepts/marquee";
import { mailtoHref, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig, type InvestmentTier } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { CtaBlock, Eyebrow, V1Button } from "./ui";

function TierCard({ tier, index }: { tier: InvestmentTier; index: number }) {
  const p = usePick();
  return (
    <Reveal delay={index * 140} className="h-full">
      <article className="v1-tier v1-paper relative flex h-full flex-col overflow-hidden rounded-[4px] border border-border" style={{ perspective: 800 }}>
        <div className="v1-tier-flap" aria-hidden="true" />
        {tier.savingsLabel && (
          <span className="v1-seal absolute left-1/2 top-10 h-12 w-12 -translate-x-1/2 text-[11px] tracking-normal" aria-label={`Savings ${tier.savingsLabel}`}>
            {tier.savingsLabel}
          </span>
        )}
        {tier.image && (
          <div className="relative mx-6 mt-6 aspect-[4/3] overflow-hidden rounded-[2px]">
            <Image src={tier.image.src} alt={p(tier.image.alt)} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
          </div>
        )}
        <div className="flex flex-1 flex-col px-7 pb-8 pt-10">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">0{index + 1}</p>
          <h3 className="mt-2 font-squarepeg text-5xl leading-none">{p(tier.name)}</h3>
          <p className="font-anybody-prose mt-4 text-muted-foreground">{p(tier.description)}</p>
          <p className="mt-6 text-[10px] tracking-[0.2em] text-accent">{p(conceptCopy.whatsIncluded)}</p>
          <ul className="mt-3 flex-1 space-y-2.5">
            {tier.features.map((f, i) => (
              <li key={i} className="font-anybody-prose flex gap-3 text-[15px]">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[hsl(var(--sage))]" aria-hidden="true" />
                {p(f)}
              </li>
            ))}
          </ul>
          <V1Button href={mailtoHref(`${p(conceptCopy.mailSubject)}: ${p(tier.name)}`)} variant="outline" className="mt-8 w-full">
            {p(conceptCopy.askAbout)}
          </V1Button>
        </div>
      </article>
    </Reveal>
  );
}

const content = {
  weddings: {
    h1: "weddings.h1",
    paragraphs: siteConfig.weddings.paragraphs,
    tiers: siteConfig.investments.filter((i) => i.id !== "add-ons"),
    eyebrow: "investment.wedding.eyebrow",
    heading: "investment.wedding.heading",
    body: "investment.wedding.body",
    photos: [
      { src: "/gallery/ceremony-card.jpeg", alt: "Ceremony program card" },
      { src: "/gallery/welcome-sign-2.jpeg", alt: "Wedding welcome sign" },
    ],
  },
  events: {
    h1: "events.h1",
    paragraphs: siteConfig.events.paragraphs,
    tiers: siteConfig.eventInvestments,
    eyebrow: "investment.events.eyebrow",
    heading: "investment.events.heading",
    body: "investment.events.body",
    photos: [
      { src: "/gallery/shower-game-would-mommy-rather.jpeg", alt: "Baby shower game cards" },
      { src: "/gallery/birthday-invitation.jpeg", alt: "Birthday invitation" },
    ],
  },
} as const;

export function V1Occasion({ kind }: { kind: "weddings" | "events" }) {
  const p = usePick();
  const { t } = useLocale();
  const c = content[kind];
  const addOns = siteConfig.investments.find((i) => i.id === "add-ons")!;
  const review = kind === "weddings" ? siteConfig.reviews[1] : siteConfig.reviews[2];

  return (
    <>
      {/* ── Header with photo pair ───────────────────────── */}
      <section className="px-4 pb-20 pt-10 md:px-8 md:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <Reveal className="flex flex-col gap-6">
            <Eyebrow>{p(conceptCopy.heroEyebrow)}</Eyebrow>
            <h1 className="font-squarepeg text-7xl leading-[0.9] text-balance md:text-8xl">{t(c.h1)}</h1>
            <p className="font-anybody-prose max-w-md text-lg leading-relaxed text-muted-foreground">{p(c.paragraphs[0])}</p>
            <div className="flex flex-wrap gap-3">
              <V1Button href="#collections">{t("cta.seeInvestment")}</V1Button>
              <V1Button href="#letter" variant="outline">{t("weddings.letterHeading")}</V1Button>
            </div>
          </Reveal>
          <div className="relative h-[420px] md:h-[520px]">
            {c.photos.map((ph, i) => (
              <Reveal
                key={ph.src}
                variant="scale"
                delay={200 + i * 200}
                className={i === 0
                  ? "absolute left-0 top-0 w-[62%] -rotate-3"
                  : "absolute bottom-0 right-0 w-[58%] rotate-[4deg]"}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] border-[10px] border-card shadow-[0_24px_50px_-24px_hsl(90_30%_15%/0.55)]">
                  <Image src={ph.src} alt={ph.alt} fill priority sizes="(min-width: 768px) 30vw, 60vw" className="object-cover" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The letter ────────────────────────────────────── */}
      <section id="letter" className="scroll-mt-24 bg-muted/70 px-4 py-24 md:px-8">
        <Reveal className="v1-paper v1-stitch relative mx-auto max-w-2xl rounded-[4px] border border-border px-7 py-14 shadow-[0_30px_60px_-40px_hsl(90_30%_15%/0.5)] md:px-14">
          <h2 className="font-squarepeg text-5xl md:text-6xl">{t("weddings.letterHeading")}</h2>
          <div className="font-anybody-prose mt-8 space-y-6 text-lg leading-relaxed">
            {c.paragraphs.map((para, i) => <p key={i}>{p(para)}</p>)}
          </div>
          <p className="mt-10 font-squarepeg text-5xl text-accent">{t("cta.talkSoon")}</p>
        </Reveal>
      </section>

      {/* ── Collections ───────────────────────────────────── */}
      <section id="collections" className="scroll-mt-24 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
            <Eyebrow>{t(c.eyebrow)}</Eyebrow>
            <h2 className="font-squarepeg text-6xl leading-none md:text-7xl">{t(c.heading)}</h2>
            <p className="font-anybody-prose text-lg text-muted-foreground">{t(c.body)}</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.tiers.map((tier, i) => <TierCard key={tier.id} tier={tier} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── À la carte ────────────────────────────────────── */}
      <section id="individual-items" className="border-y border-border bg-card py-14">
        <Reveal className="mb-8 px-4 text-center">
          <Eyebrow className="justify-center">{t("investment.addons.eyebrow")}</Eyebrow>
          <h2 className="mt-3 font-squarepeg text-5xl">{p(addOns.name)}</h2>
          <p className="font-anybody-prose mx-auto mt-2 max-w-xl text-muted-foreground">{p(addOns.description)}</p>
        </Reveal>
        <Marquee items={addOns.features.map(p)} itemClassName="font-squarepeg text-4xl" separator="·" duration={60} />
      </section>

      {/* ── Social proof next to the ask ──────────────────── */}
      <section className="px-4 pt-20 md:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <blockquote lang={review.originalLang} className="font-anybody-prose text-xl leading-relaxed">“{p(review.text)}”</blockquote>
          <p className="mt-4 font-squarepeg text-3xl">{review.author}</p>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">{p(review.role)}</p>
        </Reveal>
      </section>

      <CtaBlock heading={t("investment.inquiry.heading")} body={t("investment.inquiry.body")} />
    </>
  );
}
