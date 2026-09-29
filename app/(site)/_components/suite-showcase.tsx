"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties, type FocusEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { Lightbox } from "@/components/concepts/lightbox";
import { usePick } from "@/components/concepts/use-concept";
import { conceptCopy, suitePieces } from "@/config/concepts";
import { cn } from "@/utils";
import { Eyebrow } from "./ui";

/** Each piece at its real proportions: the long edge is `--L`, the short edge follows. */
const shapes = suitePieces.map(({ w, h }) => (w >= h ? { wr: 1, hr: h / w } : { wr: w / h, hr: 1 }));
const mid = (suitePieces.length - 1) / 2;

/**
 * Where piece `i` sits in the fan. At rest the pieces fan out on an arc; while
 * one is active it straightens, grows to readable size and nudges toward the
 * centre, and its neighbours slide aside so nothing covers it.
 */
function fanStyle(i: number, active: number | null, settled: boolean): CSSProperties {
  const k = i - mid;
  const base = {
    "--wr": shapes[i].wr,
    "--hr": shapes[i].hr,
    "--delay": settled ? "0ms" : `${i * 70}ms`,
  };
  if (active === i) {
    return { ...base, "--x": `calc(${k * 0.55} * var(--spread))`, "--y": "-12px", "--r": "0deg", "--s": "var(--zoom)", zIndex: 50 } as CSSProperties;
  }
  // While a piece is active the rest close ranks (0.8× spread) and step aside
  // by part of its width, so the outer pieces stay inside the column.
  const spread = active === null ? 1 : 0.8;
  const push = active === null ? "0px" : `calc(${Math.sign(i - active)} * var(--L) * ${shapes[active].wr * 0.3})`;
  return {
    ...base,
    "--x": `calc(${k * spread} * var(--spread) + ${push})`,
    "--y": `${k * k * 3}px`,
    "--r": `${k * 5}deg`,
    "--s": active === null ? "1" : "0.94",
    zIndex: 10 - Math.abs(Math.round(k)),
  } as CSSProperties;
}

export function SuiteShowcase() {
  const p = usePick();
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  // Once someone interacts, drop the entrance stagger so hovers respond at once.
  const [settled, setSettled] = useState(false);

  const activate = (i: number) => {
    setSettled(true);
    setActive(i);
  };
  const clearOnBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null);
  };
  const lightboxItems = suitePieces.map((s) => ({ src: s.src, alt: p(s.label), caption: p(s.label) }));

  return (
    <section className="px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="flex flex-col gap-5">
          <Eyebrow>{p(conceptCopy.suiteEyebrow)}</Eyebrow>
          <h2 className="font-squarepeg text-6xl leading-[0.95] md:text-7xl">{p(conceptCopy.suiteHeading)}</h2>
          <p className="font-anybody-prose max-w-md text-lg leading-relaxed text-muted-foreground">{p(conceptCopy.suiteBody)}</p>
          <ul className="mt-2 flex flex-wrap gap-2" onPointerLeave={() => setActive(null)} onBlur={clearOnBlur}>
            {suitePieces.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onPointerEnter={(e) => e.pointerType === "mouse" && activate(i)}
                  onFocus={() => activate(i)}
                  onClick={() => setOpen(i)}
                  aria-label={`${p(s.label)}: ${p(conceptCopy.viewFullDesign)}`}
                  className={cn(
                    "rounded-full border bg-card px-3 py-1.5 text-[10px] tracking-[0.16em] transition-colors",
                    active === i ? "border-accent text-accent" : "border-border hover:border-accent"
                  )}
                >
                  {p(s.label)}
                </button>
              </li>
            ))}
          </ul>
          <Link href="/weddings#collections" className="group mt-2 inline-flex w-fit items-center gap-2 text-xs tracking-[0.16em] text-accent">
            {p(conceptCopy.seeCollections)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>

        {/* Desktop / tablet: the fan */}
        <Reveal variant="fade" className="site-fan-wrap hidden md:block">
          <div
            className="site-fan"
            data-has-active={active !== null ? "" : undefined}
            onPointerLeave={() => setActive(null)}
            onBlur={clearOnBlur}
          >
            {suitePieces.map((s, i) => (
              <div key={s.id} aria-hidden="true" className="site-fan-card" data-active={active === i ? "" : undefined} style={fanStyle(i, active, settled)}>
                <Image src={s.src} alt="" fill sizes="440px" className="object-cover" />
              </div>
            ))}
            {/* Fixed hit columns, one per piece. They never move, so sliding
                across the fan flips through the pieces steadily even while the
                active one is zoomed over its neighbours. */}
            <div className="site-fan-hits" style={{ gridTemplateColumns: `repeat(${suitePieces.length}, 1fr)` }}>
              {suitePieces.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="site-fan-hit"
                  onPointerEnter={(e) => e.pointerType === "mouse" && activate(i)}
                  onFocus={() => activate(i)}
                  onClick={() => setOpen(i)}
                  aria-label={`${p(s.label)}: ${p(conceptCopy.viewFullDesign)}`}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] tracking-[0.18em] text-muted-foreground" aria-live="polite">
            {active === null ? p(conceptCopy.suiteHint) : p(suitePieces[active].label)}
          </p>
        </Reveal>

        {/* Phones: a swipeable strip, tap for full size */}
        <Reveal variant="fade" className="md:hidden">
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-end gap-4 overflow-x-auto px-4 pb-4">
            {suitePieces.map((s, i) => (
              <li key={s.id} className="shrink-0 snap-center">
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="site-strip-card"
                  style={{ "--wr": shapes[i].wr, "--hr": shapes[i].hr } as CSSProperties}
                  aria-label={`${p(s.label)}: ${p(conceptCopy.viewFullDesign)}`}
                >
                  <Image src={s.src} alt="" fill sizes="240px" className="object-cover" />
                </button>
                <span className="mt-2 block text-center text-[10px] tracking-[0.16em] text-muted-foreground">{p(s.label)}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-[10px] tracking-[0.18em] text-muted-foreground">{p(conceptCopy.suiteHintTouch)}</p>
        </Reveal>
      </div>
      <Lightbox items={lightboxItems} index={open} onIndexChange={setOpen} />
    </section>
  );
}
