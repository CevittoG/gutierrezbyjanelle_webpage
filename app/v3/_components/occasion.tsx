"use client";

import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { OccasionTiers, Wishlist } from "./tiers";
import { Pill, Sticker, Tilt, V3Cta, V3PageTitle } from "./ui";

const content = {
  weddings: {
    h1: "weddings.h1",
    paragraphs: siteConfig.weddings.paragraphs,
    photos: ["/gallery/welcome-sign-2.jpeg", "/gallery/ceremony-card-2.jpeg", "/gallery/drink-topper-portrait.jpeg"],
    review: 3,
  },
  events: {
    h1: "events.h1",
    paragraphs: siteConfig.events.paragraphs,
    photos: ["/gallery/shower-game-candy-guess.jpeg", "/gallery/birthday-invitation.jpeg", "/gallery/shower-game-pet-age-guess.jpeg"],
    review: 2,
  },
} as const;

export function V3Occasion({ kind }: { kind: "weddings" | "events" }) {
  const p = usePick();
  const { t } = useLocale();
  const c = content[kind];
  const review = siteConfig.reviews[c.review];

  return (
    <>
      <V3PageTitle eyebrow={p(conceptCopy.heroEyebrow)} title={t(c.h1)} intro={p(c.paragraphs[0])}>
        <div className="v3-pop mt-8 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
          <Pill href="#collections">{t("cta.seeInvestment")} <ArrowDown className="h-4 w-4" aria-hidden="true" /></Pill>
          <Pill href="#letter" variant="cream">{t("weddings.letterHeading")}</Pill>
        </div>
      </V3PageTitle>

      {/* ── Photo trio ─────────────────────────────────────── */}
      <section className="px-4 md:px-10">
        <div className="relative mx-auto grid max-w-6xl grid-cols-3 gap-3 md:gap-6">
          {c.photos.map((src, i) => (
            <Reveal key={src} delay={i * 120} variant="scale">
              <Tilt rotate={[-3, 2, -2][i]} className={i === 1 ? "md:translate-y-10" : ""}>
                <div className="v3-card relative aspect-[3/4] overflow-hidden bg-card">
                  <Image src={src} alt="" fill priority sizes="33vw" className="object-cover" />
                </div>
              </Tilt>
            </Reveal>
          ))}
          <Sticker text={p(conceptCopy.stickers[2])} center="♡" className="absolute -right-2 -top-12 z-10 bg-muted" />
        </div>
      </section>

      {/* ── The note ──────────────────────────────────────── */}
      {c.paragraphs.length > 1 && (
        <section id="letter" className="scroll-mt-28 px-4 py-24 md:px-10">
          <Reveal className="v3-tape v3-card mx-auto max-w-3xl rotate-[-0.6deg] bg-card px-7 py-14 md:px-14">
            <h2 className="v3-serif text-5xl md:text-6xl">{t("weddings.letterHeading")}</h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed">
              {c.paragraphs.slice(1).map((para, i) => <p key={i}>{p(para)}</p>)}
            </div>
            <p className="v3-serif mt-10 text-4xl text-primary">{t("cta.talkSoon")}</p>
          </Reveal>
        </section>
      )}

      <section id="collections" className="scroll-mt-28 px-4 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <OccasionTiers kind={kind} />
        </div>
      </section>

      <section id="individual-items" className="scroll-mt-28 px-4 py-16 md:px-10">
        <Reveal className="mx-auto max-w-6xl"><Wishlist /></Reveal>
      </section>

      <section className="px-4 py-10 md:px-10">
        <Reveal className="v3-card mx-auto max-w-4xl rotate-1 bg-muted p-8 md:p-12">
          <blockquote lang={review.originalLang} className="v3-serif text-2xl leading-snug md:text-3xl">“{p(review.text)}”</blockquote>
          <p className="mt-6"><span className="font-bold">{review.author}</span> · {p(review.role)}</p>
        </Reveal>
      </section>

      <V3Cta heading={t("investment.inquiry.heading")} body={t("investment.inquiry.body")} />
    </>
  );
}
