"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePick } from "@/components/concepts/use-concept";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { V3Cta, V3PageTitle } from "./ui";

const styles = ["bg-primary text-primary-foreground", "bg-muted", "bg-card", "bg-[hsl(var(--butter-deep))]"];

export function V3Reviews() {
  const p = usePick();
  const { t } = useLocale();
  const track = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * Math.min(track.current.clientWidth * 0.8, 560), behavior: "smooth" });

  return (
    <>
      <V3PageTitle eyebrow={t("home.reviews.eyebrow")} title={t("reviews.heading")} intro={t("reviews.intro")}>
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={() => go(-1)} aria-label={t("gallery.lightbox.prev")} className="v3-pill bg-card px-0 w-12"><ArrowLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => go(1)} aria-label={t("gallery.lightbox.next")} className="v3-pill bg-primary px-0 w-12 text-primary-foreground"><ArrowRight className="h-5 w-5" /></button>
        </div>
      </V3PageTitle>
      <div ref={track} className="v3-snap no-scrollbar flex gap-6 overflow-x-auto px-4 pb-12 pt-4 md:px-10">
        {siteConfig.reviews.map((r, i) => (
          <figure
            key={r.id}
            className={cn("v3-card v3-pop flex w-[86vw] shrink-0 flex-col justify-between p-8 sm:w-[30rem] md:p-10", styles[i % styles.length], i % 2 ? "rotate-1" : "-rotate-1")}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div>
              <span className="v3-serif block text-8xl leading-[0.5] opacity-80" aria-hidden="true">“</span>
              <blockquote lang={r.originalLang} className="v3-serif mt-4 text-2xl leading-snug">{p(r.text)}</blockquote>
            </div>
            <figcaption className="mt-8 flex items-center gap-3 border-t-2 border-dashed border-current pt-5">
              <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-current text-lg font-bold">{r.author.charAt(0)}</span>
              <span>
                <span className="block text-lg font-bold">{r.author}</span>
                <span className="text-sm opacity-80">{p(r.role)}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <V3Cta />
    </>
  );
}
