"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Hand } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { Marquee } from "@/components/concepts/marquee";
import { usePick } from "@/components/concepts/use-concept";
import { conceptCopy, processSteps, suitePieces } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { Pill, Sticker, Tilt, V3Cta } from "./ui";
import { OccasionTiers } from "./tiers";

const deskPieces = [
  { src: "/item_preview_map/save_the_date.jpeg", alt: "Save the date", ratio: "3/2", pos: "left-[2%] top-[6%] w-[48%] md:left-[4%] md:w-[28%]", rot: -8 },
  { src: "/invitation/invite-3.jpg", alt: "Invitation", ratio: "5/7", pos: "left-[40%] top-[2%] w-[32%] md:left-[34%] md:w-[17%]", rot: 5 },
  { src: "/item_preview_map/rsvp.jpeg", alt: "RSVP card", ratio: "10/7", pos: "left-[56%] top-[20%] w-[42%] md:left-[56%] md:top-[8%] md:w-[24%]", rot: -3 },
  { src: "/gallery/welcome-sign.jpeg", alt: "Wedding welcome sign", ratio: "4/5", pos: "left-[4%] top-[48%] w-[30%] md:left-[10%] md:top-[46%] md:w-[15%]", rot: 7 },
  { src: "/gallery/birthday-invitation.jpeg", alt: "Birthday invitation", ratio: "4/5", pos: "left-[34%] top-[54%] w-[30%] md:left-[31%] md:top-[48%] md:w-[15%]", rot: -6 },
  { src: "/gallery/drink-topper-riecherts.jpeg", alt: "Monogram drink topper", ratio: "3/4", pos: "left-[66%] top-[56%] w-[28%] md:left-[52%] md:top-[50%] md:w-[14%]", rot: 9 },
  { src: "/gallery/wedding-note-card.jpeg", alt: "Personal note card", ratio: "1/1", pos: "hidden md:block md:left-[74%] md:top-[46%] md:w-[16%]", rot: -5 },
];

function Desk() {
  const p = usePick();
  const deskRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState(deskPieces.map((_, i) => i));
  const front = (i: number) => setOrder((o) => [...o.filter((x) => x !== i), i]);

  return (
    <div ref={deskRef} className="v3-desk v3-card relative h-[480px] overflow-hidden md:h-[560px]">
      {deskPieces.map((piece, i) => (
        <motion.div
          key={piece.src}
          drag
          dragConstraints={deskRef}
          dragElastic={0.15}
          dragMomentum
          onPointerDown={() => front(i)}
          initial={{ opacity: 0, y: 60, rotate: 0, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotate: piece.rot, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.35 + i * 0.09 }}
          whileHover={{ scale: 1.04 }}
          whileDrag={{ scale: 1.1, rotate: 0 }}
          className={cn("v3-piece absolute rounded-[14px] border-2 border-foreground bg-card p-1.5 shadow-[4px_4px_0_hsl(var(--foreground))]", piece.pos)}
          style={{ zIndex: order.indexOf(i) + 1 }}
        >
          <div className="pointer-events-none relative overflow-hidden rounded-[9px]" style={{ aspectRatio: piece.ratio }}>
            <Image src={piece.src} alt={piece.alt} fill priority={i < 3} sizes="(min-width: 768px) 28vw, 48vw" className="object-cover" draggable={false} />
          </div>
        </motion.div>
      ))}
      <p className="pointer-events-none absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-2 text-sm font-semibold">
        <Hand className="h-4 w-4 animate-bounce" aria-hidden="true" /> {p(conceptCopy.dragHint)}
      </p>
    </div>
  );
}

export function V3Home() {
  const p = usePick();
  const { t } = useLocale();
  const headline = p(siteConfig.hero.headline).split(" ");
  const italicAt = headline.length - 2;
  const addOns = siteConfig.investments.find((i) => i.id === "add-ons")!;
  const [review] = siteConfig.reviews;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="px-4 pb-16 pt-28 md:px-10 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
            <h1 className="v3-display text-[16vw] md:text-[7.8rem]">
              {headline.map((w, i) => (
                <span key={`${w}-${i}`} className="v3-pop inline-block" style={{ "--i": i } as CSSProperties}>
                  {i === italicAt ? <span className="v3-serif font-normal text-primary">{w}</span> : w}
                  {i < headline.length - 1 && " "}
                </span>
              ))}
            </h1>
            <div className="v3-pop flex flex-col gap-6" style={{ "--i": 5 } as CSSProperties}>
              <p className="text-xl leading-relaxed text-muted-foreground">{p(siteConfig.hero.subheadline)}</p>
              <div className="flex flex-wrap gap-3">
                <Pill href="/v3/weddings#collections">{t("cta.weddingInvestment")} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Pill>
                <Pill href="/v3/events#collections" variant="cream">{t("cta.eventInvestment")}</Pill>
              </div>
            </div>
          </div>
          <div className="relative mt-12">
            <Desk />
            <Sticker text={p(conceptCopy.stickers[0])} center="✂" className="absolute -right-3 -top-10 z-40 md:-right-8" />
            <Sticker text={p(conceptCopy.stickers[1])} center="EN·ES" className="absolute -bottom-10 -left-3 z-40 hidden bg-muted text-xs font-bold md:grid" />
          </div>
        </div>
      </section>

      {/* ── Crossing ribbons ──────────────────────────────── */}
      <div className="py-10" aria-hidden="false">
        <div className="v3-ribbon relative z-10 -mx-4 border-y-2 border-foreground bg-primary py-4 text-primary-foreground">
          <Marquee items={addOns.features.map(p)} itemClassName="text-2xl font-bold md:text-3xl" separator="✺" duration={50} />
        </div>
        <div className="v3-ribbon-2 -mx-4 border-y-2 border-foreground bg-muted py-4">
          <Marquee items={siteConfig.galleryTags.map((g) => p(g.title))} itemClassName="v3-serif text-2xl md:text-3xl" separator="♡" duration={45} reverse />
        </div>
      </div>

      {/* ── Occasion switch + collections ─────────────────── */}
      <section className="px-4 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <OccasionTiers />
        </div>
      </section>

      {/* ── Bento ─────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl auto-rows-[minmax(200px,auto)] gap-5 md:grid-cols-4">
          <Reveal className="v3-card bg-card p-7 md:col-span-2 md:row-span-2 md:p-9">
            <p className="text-sm font-semibold text-primary">{p(conceptCopy.processEyebrow)}</p>
            <h2 className="v3-display mt-2 text-4xl md:text-5xl">{p(conceptCopy.processHeading)}</h2>
            <ol className="mt-8 space-y-5">
              {processSteps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-foreground text-lg font-bold", i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-muted" : i === 2 ? "bg-[hsl(var(--butter-deep))]" : "bg-background")}>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{p(s.title)}</h3>
                    <p className="text-muted-foreground">{p(s.body)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={100} className="v3-card flex flex-col justify-between bg-primary p-7 text-primary-foreground md:col-span-2">
            <blockquote lang={review.originalLang} className="v3-serif line-clamp-5 text-2xl leading-snug md:text-[1.7rem]">“{p(review.text)}”</blockquote>
            <div className="mt-6 flex items-end justify-between gap-4">
              <p><span className="font-bold">{review.author}</span> · <span className="opacity-80">{p(review.role)}</span></p>
              <Link href="/v3/reviews" className="flex shrink-0 items-center gap-1 rounded-full bg-primary-foreground px-3 py-1.5 text-sm font-semibold text-primary transition-transform hover:-rotate-3">
                {t("cta.readAllReviews")} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <a href={siteConfig.etsyStore.url} target="_blank" rel="noopener noreferrer" className="v3-card group flex h-full flex-col justify-between gap-4 bg-[hsl(var(--butter-deep))] p-6 transition-transform hover:-rotate-2">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-foreground">
                <Image src="/etsy.jpg" alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <p className="text-xl font-bold">{t("cta.etsyShop")} ↗</p>
                <p className="mt-1 text-sm text-muted-foreground">{p(siteConfig.etsyStore.tagline)}</p>
              </div>
            </a>
          </Reveal>
          <Reveal delay={200}>
            <a href={siteConfig.zola.vendorUrl} target="_blank" rel="noopener noreferrer" className="v3-card group flex h-full flex-col justify-between gap-4 bg-card p-6 transition-transform hover:rotate-2">
              <div className="relative h-20 w-20">
                <Image src="/zola.png" alt="" fill sizes="80px" className="object-contain" />
              </div>
              <div>
                <p className="text-xl font-bold">{p(conceptCopy.zolaTitle)} ↗</p>
                <p className="mt-1 text-sm text-muted-foreground">{p(conceptCopy.zolaBody)}</p>
              </div>
            </a>
          </Reveal>

          <Reveal delay={100} className="md:col-span-2">
            <Link href="/v3/gallery" className="v3-card group relative flex h-full min-h-[240px] items-end overflow-hidden bg-muted p-6">
              {["/gallery/drink-topper-portrait.jpeg", "/gallery/shower-game-guess-who.jpeg", "/gallery/signature-drink-sign.jpeg"].map((src, i) => (
                <div
                  key={src}
                  className="absolute top-6 w-[34%] rounded-xl border-2 border-foreground bg-card p-1 transition-transform duration-500 group-hover:-translate-y-2"
                  style={{ left: `${6 + i * 30}%`, transform: `rotate(${[-6, 3, 8][i]}deg)` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                    <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
                  </div>
                </div>
              ))}
              <span className="relative z-10 flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-2 font-bold">
                {t("cta.viewFullGallery")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>

          <Reveal delay={150} className="v3-card overflow-hidden bg-card p-6 md:col-span-2">
            <p className="text-sm font-semibold text-primary">{p(conceptCopy.suiteEyebrow)}</p>
            <h2 className="v3-display mt-1 text-3xl">{p(conceptCopy.suiteHeading)}</h2>
            <div className="mt-5 flex -space-x-6">
              {suitePieces.map((s, i) => (
                <Tilt key={s.id} rotate={(i - 3) * 4} className="w-24 shrink-0 hover:z-10 md:w-28">
                  <div className="relative aspect-[5/7] overflow-hidden rounded-xl border-2 border-foreground bg-card" title={p(s.label)}>
                    <Image src={s.src} alt={p(s.label)} fill sizes="112px" className="object-cover" />
                  </div>
                </Tilt>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <V3Cta />
    </>
  );
}
