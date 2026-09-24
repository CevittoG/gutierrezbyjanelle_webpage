"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { Check, Plus, RotateCcw, Send } from "lucide-react";
import { mailtoHref, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig, type InvestmentTier } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { Pill } from "./ui";

const faceColors = ["bg-muted", "bg-[hsl(var(--butter-deep))]", "bg-primary text-primary-foreground"];

function FlipCard({ tier, index }: { tier: InvestmentTier; index: number }) {
  const p = usePick();
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="v3-flip v3-pop h-full min-h-[27rem]" data-flipped={flipped} style={{ "--i": index } as CSSProperties}>
      <div className="v3-flip-inner">
        <div
          onClick={() => setFlipped(true)}
          className={cn("v3-flip-face v3-card flex cursor-pointer flex-col p-7 text-left", faceColors[index % faceColors.length])}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-full border-2 border-current px-3 py-1 text-sm font-bold">0{index + 1}</span>
            <span className="text-3xl tracking-widest" aria-label={`Savings ${tier.savingsLabel}`}>{tier.savingsLabel}</span>
          </div>
          {tier.image && (
            <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl border-2 border-foreground">
              <Image src={tier.image.src} alt={p(tier.image.alt)} fill sizes="30vw" className="object-cover" />
            </div>
          )}
          <h3 className="v3-display mt-auto pt-10 text-5xl">{p(tier.name)}</h3>
          <p className="mt-3 text-lg opacity-85">{p(tier.description)}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
            aria-label={`${p(conceptCopy.whatsIncluded)}: ${p(tier.name)}`}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-full text-sm font-semibold opacity-80 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> {p(conceptCopy.turnOver)}
          </button>
        </div>
        <div className="v3-flip-face v3-flip-back v3-card flex flex-col bg-card p-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{p(conceptCopy.whatsIncluded)}</p>
            <button type="button" onClick={() => setFlipped(false)} aria-label={p(conceptCopy.turnOver)} className="grid h-9 w-9 place-items-center rounded-full border-2 border-foreground">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <h3 className="v3-serif mt-1 text-4xl">{p(tier.name)}</h3>
          <ul className="mt-4 flex-1 space-y-2">
            {tier.features.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> {p(f)}
              </li>
            ))}
          </ul>
          <Pill href={mailtoHref(`${p(conceptCopy.mailSubject)}: ${p(tier.name)}`)} className="mt-6 w-full">
            {p(conceptCopy.askAbout)}
          </Pill>
        </div>
      </div>
    </div>
  );
}

const weddingTiers = siteConfig.investments.filter((i) => i.id !== "add-ons") as InvestmentTier[];
const eventTiers = siteConfig.eventInvestments as InvestmentTier[];

/** Collections as flip cards. Without `kind`, a Wedding / Event switch sits on top. */
export function OccasionTiers({ kind }: { kind?: "weddings" | "events" }) {
  const p = usePick();
  const { t } = useLocale();
  const [picked, setPicked] = useState<"weddings" | "events">(kind ?? "weddings");
  const current = kind ?? picked;
  const tiers = current === "weddings" ? weddingTiers : eventTiers;

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">{t(current === "weddings" ? "investment.wedding.eyebrow" : "investment.events.eyebrow")}</p>
          <h2 className="v3-display mt-2 text-5xl md:text-7xl">{t(current === "weddings" ? "investment.wedding.heading" : "investment.events.heading")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t(current === "weddings" ? "investment.wedding.body" : "investment.events.body")}</p>
        </div>
        {!kind && (
          <div role="tablist" aria-label="Occasion" className="relative grid shrink-0 grid-cols-2 rounded-full border-2 border-foreground bg-card p-1 shadow-[3px_3px_0_hsl(var(--foreground))]">
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-500 [transition-timing-function:cubic-bezier(0.3,1.4,0.5,1)]"
              style={{ transform: picked === "events" ? "translateX(100%)" : "none" }}
            />
            {(["weddings", "events"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={picked === k}
                onClick={() => setPicked(k)}
                className={cn("relative z-10 rounded-full px-6 py-3 font-bold transition-colors duration-300", picked === k ? "text-background" : "text-foreground")}
              >
                {p(k === "weddings" ? conceptCopy.wedding : conceptCopy.event)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div key={current} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier, i) => <FlipCard key={tier.id} tier={tier} index={i} />)}
      </div>
    </div>
  );
}

/** Tap à-la-carte pieces, then send the whole list in one pre-written email. */
export function Wishlist() {
  const p = usePick();
  const { t } = useLocale();
  const addOns = siteConfig.investments.find((i) => i.id === "add-ons")!;
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (i: number) => setPicked((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const body = `${p(conceptCopy.mailWishlistIntro)}\n\n${picked.map((i) => `• ${p(addOns.features[i])}`).join("\n")}\n`;

  return (
    <div className="v3-card bg-card p-6 md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{t("investment.addons.eyebrow")} · {p(addOns.name)}</p>
          <h2 className="v3-display mt-2 text-4xl md:text-6xl">{p(conceptCopy.wishlistHeading)}</h2>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">{p(conceptCopy.wishlistBody)}</p>
        </div>
        <p className="shrink-0 text-lg font-bold" aria-live="polite">
          <span className="text-5xl text-primary">{picked.length}</span> {p(conceptCopy.selected)}
        </p>
      </div>
      <ul className="mt-8 flex flex-wrap gap-2.5">
        {addOns.features.map((f, i) => {
          const on = picked.includes(i);
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(i)}
                className={cn(
                  "flex items-center gap-2 rounded-full border-2 border-foreground px-4 py-2.5 font-semibold transition-all duration-300 [transition-timing-function:cubic-bezier(0.3,1.5,0.5,1)]",
                  on ? "-rotate-2 scale-105 bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground))]" : "bg-background hover:bg-muted"
                )}
              >
                {on ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                {p(f)}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 border-t-2 border-dashed border-foreground/25 pt-6">
        {picked.length > 0 ? (
          <Pill href={mailtoHref(`${p(conceptCopy.mailSubject)} · ${p(conceptCopy.wishlistHeading)}`, body)} className="v3-pop">
            <Send className="h-4 w-4" aria-hidden="true" /> {p(conceptCopy.wishlistCta)} ({picked.length})
          </Pill>
        ) : (
          <p className="font-semibold text-muted-foreground">{p(conceptCopy.wishlistEmpty)} ↑</p>
        )}
      </div>
    </div>
  );
}
