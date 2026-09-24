"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { Marquee } from "@/components/concepts/marquee";
import { usePick } from "@/components/concepts/use-concept";
import { conceptCopy, processSteps, suitePieces } from "@/config/concepts";
import { siteConfig, type InvestmentTier } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { Chapter, Kicker, SplitWords, V2Button, V2Cta } from "./ui";

function TocList({ title, tiers, href }: { title: string; tiers: InvestmentTier[]; href: string }) {
  const p = usePick();
  return (
    <div>
      <h3 className="v2-kicker mb-4 text-muted-foreground">{title}</h3>
      <ul className="border-t border-foreground/15">
        {tiers.map((tier, i) => (
          <Reveal as="li" key={tier.id} delay={i * 100} className="border-b border-foreground/15">
            <Link href={href} className="v2-toc-row group flex items-center gap-4 px-2 py-6 md:px-4">
              <span className="v2-italic w-8 text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1">
                <span className="v2-serif block text-3xl font-light transition-all duration-500 group-hover:italic md:text-4xl">{p(tier.name)}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{p(tier.description)}</span>
              </span>
              <span className="text-accent" aria-label={`Savings ${tier.savingsLabel}`}>{tier.savingsLabel}</span>
              <ArrowRight className="h-5 w-5 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

function RotatingQuote() {
  const p = usePick();
  const reviews = siteConfig.reviews;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % reviews.length), 9000);
    return () => window.clearInterval(id);
  }, [paused, reviews.length]);

  const r = reviews[i];
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}>
      <figure key={r.id} className="v2-quote-enter min-h-[22rem] md:min-h-[18rem]" aria-live="polite">
        <blockquote lang={r.originalLang} className="v2-serif text-2xl font-light leading-snug md:text-[2.1rem]">
          “{p(r.text)}”
        </blockquote>
        <figcaption className="mt-8 flex items-center gap-4">
          <span className="v2-rule w-10" />
          <span className="v2-italic text-xl">{r.author}</span>
          <span className="text-sm text-muted-foreground">{p(r.role)}</span>
        </figcaption>
      </figure>
      <div className="mt-10 flex items-center gap-3" role="tablist" aria-label="Reviews">
        {reviews.map((rv, n) => (
          <button
            key={rv.id}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={rv.author}
            onClick={() => setI(n)}
            className={cn("h-[3px] rounded-full transition-all duration-500", n === i ? "w-12 bg-primary" : "w-6 bg-foreground/20 hover:bg-foreground/40")}
          />
        ))}
      </div>
    </div>
  );
}

export function V2Home() {
  const p = usePick();
  const { t, locale } = useLocale();
  const stripRef = useRef<HTMLDivElement>(null);
  const addOns = siteConfig.investments.find((i) => i.id === "add-ons")!;
  const weddingTiers = siteConfig.investments.filter((i) => i.id !== "add-ons");
  const scrollStrip = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * stripRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <>
      {/* ── Cover ─────────────────────────────────────────── */}
      <section className="px-4 pb-20 pt-10 md:px-10 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center justify-between text-xs text-muted-foreground">
            <Kicker>{p(conceptCopy.heroEyebrow)}</Kicker>
            <span className="hidden md:inline">{p(conceptCopy.issue)}</span>
          </div>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 key={locale} className="v2-serif text-[14vw] font-light leading-[0.9] tracking-tight lg:text-[7.4rem]">
                <SplitWords text={p(siteConfig.hero.headline)} italicLast={2} />
              </h1>
              <Reveal delay={600} className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr]">
                <div className="v2-rule mt-3 hidden md:block" />
                <div>
                  <p className="text-lg leading-relaxed text-muted-foreground">{p(siteConfig.hero.subheadline)}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <V2Button href="/v2/weddings#collections">
                      {t("cta.weddingInvestment")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </V2Button>
                    <V2Button href="/v2/events#collections" variant="ghost">{t("cta.eventInvestment")}</V2Button>
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="relative lg:col-span-5">
              <figure className="v2-curtain relative aspect-[4/5] overflow-hidden" style={{ "--d": "0.4s" } as CSSProperties}>
                <Image src="/gallery/welcome-sign.jpeg" alt="Welcome sign at LeChae and James' wedding" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              </figure>
              <figure className="v2-curtain v2-parallax absolute -bottom-10 -left-6 w-[42%] border-[6px] border-background shadow-2xl shadow-primary/20 md:-left-16" style={{ "--d": "0.9s" } as CSSProperties}>
                <div className="relative aspect-[3/4]">
                  <Image src="/gallery/drink-topper-le.jpeg" alt="Custom monogram drink topper" fill sizes="20vw" className="object-cover" />
                </div>
              </figure>
              <p className="mt-4 text-right text-xs text-muted-foreground">
                <span className="v2-italic">{p(conceptCopy.fig)} 1</span> — {p(siteConfig.gallery[2].caption!)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────── */}
      <div className="border-y border-foreground/10 py-6">
        <Marquee items={addOns.features.map(p)} itemClassName="v2-italic text-4xl md:text-6xl font-light" separator="✶" duration={70} />
      </div>

      {/* ── 01 The work — lookbook strip ──────────────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto mb-12 flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 md:px-10">
          <div>
            <Chapter n="01" title={p(conceptCopy.chapterWork)} />
            <Reveal as="h2" className="v2-serif mt-6 max-w-2xl text-5xl font-light leading-[1.02] md:text-6xl">
              {t("gallery.heading")}
            </Reveal>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scrollStrip(-1)} aria-label={t("gallery.lightbox.prev")} className="grid h-12 w-12 place-items-center rounded-full border border-foreground/20 transition-colors hover:bg-primary hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scrollStrip(1)} aria-label={t("gallery.lightbox.next")} className="grid h-12 w-12 place-items-center rounded-full border border-foreground/20 transition-colors hover:bg-primary hover:text-primary-foreground">
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/v2/gallery" className="v2-link ml-3 text-sm font-semibold">{t("cta.viewFullGallery")}</Link>
          </div>
        </div>
        <div ref={stripRef} className="v2-strip no-scrollbar flex gap-5 overflow-x-auto px-4 md:gap-8 md:px-10">
          {siteConfig.gallery.filter((g) => g.id !== "g3").slice(0, 10).map((g, i) => (
            <Reveal key={g.id} variant="mask" delay={Math.min(i, 4) * 90} className="w-[72vw] shrink-0 sm:w-[46vw] lg:w-[30vw]">
              <figure>
                <div className="group relative aspect-[4/5] overflow-hidden">
                  <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1024px) 30vw, 72vw" className="object-cover transition-transform [transition-duration:1200ms] group-hover:scale-105" />
                </div>
                <figcaption className="mt-3 flex gap-3 text-sm">
                  <span className="v2-italic text-accent">{p(conceptCopy.fig)} {i + 1}</span>
                  <span className="text-muted-foreground">{g.caption ? p(g.caption) : g.alt}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 02 The process ───────────────────────────────── */}
      <section className="bg-muted px-4 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <Chapter n="02" title={p(conceptCopy.chapterProcess)} />
          <Reveal as="h2" className="v2-serif mt-6 max-w-3xl text-5xl font-light leading-[1.02] md:text-6xl">
            {p(conceptCopy.processHeading)}
          </Reveal>
          <ol className="mt-16 grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 140} className="border-t border-foreground/20 pt-6">
                <span className="v2-serif v2-outline block text-8xl font-light leading-none">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="v2-italic mt-6 text-2xl">{p(s.title)}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{p(s.body)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 03 The collections ────────────────────────────── */}
      <section className="px-4 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <Chapter n="03" title={p(conceptCopy.chapterCollections)} />
          <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <Reveal as="h2" className="v2-serif text-5xl font-light leading-[1.02] md:text-6xl">{p(conceptCopy.suiteHeading)}</Reveal>
              <Reveal delay={100} as="p" className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{p(conceptCopy.suiteBody)}</Reveal>
              <div className="mt-10 grid grid-cols-3 gap-3">
                {suitePieces.slice(0, 6).map((s, i) => (
                  <Reveal key={s.id} variant="mask" delay={i * 80}>
                    <figure>
                      <div className="relative aspect-[3/4] overflow-hidden bg-card">
                        <Image src={s.src} alt={p(s.label)} fill sizes="(min-width: 1024px) 12vw, 30vw" className="object-cover" />
                      </div>
                      <figcaption className="mt-1.5 text-[11px] text-muted-foreground">
                        <span className="v2-italic text-accent">{i + 1}.</span> {p(s.label)}
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-14">
              <TocList title={t("investment.wedding.heading")} tiers={weddingTiers} href="/v2/weddings#collections" />
              <TocList title={t("investment.events.heading")} tiers={siteConfig.eventInvestments} href="/v2/events#collections" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 Kind words ─────────────────────────────────── */}
      <section className="border-t border-foreground/10 px-4 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <Chapter n="04" title={p(conceptCopy.chapterWords)} />
            <Reveal delay={100} className="mt-8">
              <span aria-hidden="true" className="v2-italic block text-[10rem] leading-[0.6] text-accent">“</span>
            </Reveal>
            <Link href="/v2/reviews" className="v2-link mt-6 inline-flex items-center gap-2 text-sm font-semibold">
              {t("cta.readAllReviews")} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <RotatingQuote />
        </div>
      </section>

      <V2Cta />
    </>
  );
}
