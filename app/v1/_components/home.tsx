"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { Marquee } from "@/components/concepts/marquee";
import { usePick } from "@/components/concepts/use-concept";
import { conceptCopy, processSteps, suitePieces } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { CtaBlock, Eyebrow, V1Button } from "./ui";

function Envelope() {
  const [run, setRun] = useState(0);
  const { locale } = useLocale();
  return (
    <div className="relative">
      <div className="v1-stage" key={run}>
        <div
          className="v1-env"
          role="button"
          tabIndex={0}
          aria-label={locale === "es" ? "Abrir el sobre otra vez" : "Open the envelope again"}
          onClick={() => setRun((r) => r + 1)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRun((r) => r + 1)}
        >
          <div className="v1-env-back" />
          <div className="v1-env-clip">
            <div className="v1-env-card">
              <Image
                src="/invitation/invite-3.jpg"
                alt="Invitation designed by Janelle"
                fill
                priority
                sizes="(min-width: 768px) 380px, 75vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="v1-env-front" />
          <div className="v1-env-flap" />
          <div className="v1-env-seal v1-seal font-squarepeg text-4xl md:text-5xl">J</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="mx-auto mt-4 flex items-center gap-2 text-[10px] tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        {locale === "es" ? "Abrir otra vez" : "Open again"}
      </button>
    </div>
  );
}

export function V1Home() {
  const p = usePick();
  const { t } = useLocale();
  const [featured, ...moreReviews] = siteConfig.reviews;
  const addOns = siteConfig.investments.find((i) => i.id === "add-ons")!;
  const peek = ["g3", "g9", "g14", "g4"].map((id) => siteConfig.gallery.find((g) => g.id === id)!);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-6 md:px-8 md:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[hsl(var(--sage)/0.18)] blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10 flex flex-col items-start gap-7 text-left">
            <Reveal delay={100}><Eyebrow>{p(conceptCopy.heroEyebrow)}</Eyebrow></Reveal>
            <Reveal delay={200} as="h1" className="font-squarepeg text-[3.6rem] leading-[0.9] text-balance sm:text-7xl lg:text-[6.2rem]">
              {p(siteConfig.hero.headline)}
            </Reveal>
            <Reveal delay={320} as="p" className="font-anybody-prose max-w-md text-lg leading-relaxed text-muted-foreground">
              {p(siteConfig.hero.subheadline)}
            </Reveal>
            <Reveal delay={440} className="flex flex-wrap gap-3">
              <V1Button href="/v1/weddings#collections">
                {t("cta.weddingInvestment")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </V1Button>
              <V1Button href="/v1/events#collections" variant="outline">
                {t("cta.eventInvestment")}
              </V1Button>
            </Reveal>
            <Reveal delay={560} className="flex max-w-md items-start gap-3 border-l-2 border-accent/60 pl-4">
              <p className="font-anybody-prose line-clamp-2 text-sm italic text-muted-foreground" lang={featured.originalLang}>
                “{p(featured.text)}”
              </p>
            </Reveal>
          </div>
          <Envelope />
        </div>
      </section>

      {/* ── Ticker of every piece ─────────────────────────── */}
      <div className="border-y border-primary/20 bg-primary py-4 text-primary-foreground">
        <Marquee items={addOns.features.map(p)} itemClassName="text-xs tracking-[0.2em]" duration={55} />
      </div>

      {/* ── What's in a suite ─────────────────────────────── */}
      <section className="px-4 py-24 md:px-8 md:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="flex flex-col gap-5">
            <Eyebrow>{p(conceptCopy.suiteEyebrow)}</Eyebrow>
            <h2 className="font-squarepeg text-6xl leading-[0.95] md:text-7xl">{p(conceptCopy.suiteHeading)}</h2>
            <p className="font-anybody-prose max-w-md text-lg leading-relaxed text-muted-foreground">{p(conceptCopy.suiteBody)}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {suitePieces.map((s) => (
                <li key={s.id} className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] tracking-[0.16em]">{p(s.label)}</li>
              ))}
            </ul>
            <Link href="/v1/weddings#collections" className="group mt-2 inline-flex w-fit items-center gap-2 text-xs tracking-[0.16em] text-accent">
              {p(conceptCopy.seeCollections)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal variant="fade" className="v1-fan">
            {suitePieces.map((s, i) => {
              const k = i - (suitePieces.length - 1) / 2;
              return (
                <figure
                  key={s.id}
                  className="v1-fan-card overflow-hidden rounded-[3px] bg-card shadow-[0_18px_40px_-20px_hsl(90_30%_15%/0.5)]"
                  style={{ "--i": i, "--k": k, "--r": `${k * 6}deg`, zIndex: 10 - Math.abs(Math.round(k)) } as CSSProperties}
                >
                  <div className="relative aspect-[5/7]">
                    <Image src={s.src} alt={p(s.label)} fill sizes="150px" className="object-cover" />
                  </div>
                </figure>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="bg-muted/70 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16 flex flex-col items-center gap-4 text-center">
            <Eyebrow>{p(conceptCopy.processEyebrow)}</Eyebrow>
            <h2 className="font-squarepeg text-6xl leading-none md:text-7xl">{p(conceptCopy.processHeading)}</h2>
          </Reveal>
          <Reveal variant="fade" className="relative">
            <div aria-hidden="true" className="v1-thread absolute left-[12%] right-[12%] top-8 hidden border-t-2 border-dashed border-accent/50 md:block" />
            <ol className="grid gap-10 md:grid-cols-4">
              {processSteps.map((step, i) => (
                <Reveal as="li" key={i} delay={200 + i * 180} className="relative flex flex-col items-center text-center">
                  <span className="v1-seal relative z-10 h-16 w-16 font-squarepeg text-3xl">{i + 1}</span>
                  <h3 className="mt-6 text-sm tracking-[0.16em]">{p(step.title)}</h3>
                  <p className="font-anybody-prose mt-3 max-w-[30ch] text-muted-foreground">{p(step.body)}</p>
                </Reveal>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ── Two occasions ─────────────────────────────────── */}
      <section className="px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-12 flex justify-center"><Eyebrow>{p(conceptCopy.occasionsEyebrow)}</Eyebrow></Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { href: "/v1/weddings", title: t("nav.weddings"), body: p(conceptCopy.weddingsCard), img: "/gallery/welcome-sign.jpeg", alt: "Wedding welcome sign" },
              { href: "/v1/events", title: t("nav.events"), body: p(conceptCopy.eventsCard), img: "/gallery/birthday-invitation.jpeg", alt: "Birthday invitation" },
            ].map((o, i) => (
              <Reveal key={o.href} delay={i * 150}>
                <Link href={o.href} className="group relative block aspect-[4/5] overflow-hidden rounded-[4px] md:aspect-[5/6]">
                  <Image src={o.img} alt={o.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform [transition-duration:1400ms] ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(90_25%_10%/0.8)] via-[hsl(90_25%_10%/0.15)] to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-8 text-[hsl(40_38%_96%)]">
                    <h3 className="font-squarepeg text-6xl leading-none md:text-7xl">{o.title}</h3>
                    <p className="font-anybody-prose mt-2 max-w-sm opacity-90">{o.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-[0.18em]">
                      {p(conceptCopy.seeCollections)}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured review ───────────────────────────────── */}
      <section className="px-4 py-20 md:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span aria-hidden="true" className="block font-squarepeg text-[9rem] leading-[0.5] text-accent">“</span>
          <blockquote lang={featured.originalLang} className="font-anybody-prose mt-6 text-xl leading-relaxed md:text-2xl">
            {p(featured.text)}
          </blockquote>
          <p className="mt-8 font-squarepeg text-4xl">{featured.author}</p>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">{p(featured.role)}</p>
          <Link href="/v1/reviews" className="group mt-8 inline-flex items-center gap-2 text-xs tracking-[0.16em] text-accent">
            {t("cta.readAllReviews")} ({moreReviews.length + 1})
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

      {/* ── Gallery peek ──────────────────────────────────── */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>{t("home.gallery.eyebrow")}</Eyebrow>
              <h2 className="mt-3 font-squarepeg text-6xl leading-none">{t("home.gallery.heading")}</h2>
            </div>
            <V1Button href="/v1/gallery" variant="outline">{t("cta.viewFullGallery")}</V1Button>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {peek.map((g, i) => (
              <Reveal key={g.id} delay={i * 120} variant="mask" className={i % 2 ? "md:mt-12" : ""}>
                <Link href="/v1/gallery" className="group block overflow-hidden rounded-[3px]">
                  <div className="relative aspect-[3/4]">
                    <Image src={g.src} alt={g.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                  </div>
                </Link>
                {g.caption && <p className="font-anybody-prose mt-2 text-sm text-muted-foreground">{p(g.caption)}</p>}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBlock
        heading={<>{t("home.cta.heading")} {t("home.cta.headingItalic")} {t("home.cta.headingTail")}</>}
        body={t("home.cta.body")}
      />
    </>
  );
}
