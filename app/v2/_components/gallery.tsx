"use client";

import Image from "next/image";
import { useState } from "react";
import { GalleryHorizontal, LayoutGrid } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { Lightbox } from "@/components/concepts/lightbox";
import { useGallery } from "@/components/concepts/use-gallery";
import { mailtoHref, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { V2Button, V2Cta, V2PageTitle } from "./ui";

export function V2Gallery() {
  const p = usePick();
  const { t } = useLocale();
  const g = useGallery();
  const [view, setView] = useState<"lookbook" | "grid">("lookbook");

  return (
    <>
      <V2PageTitle kicker={t("gallery.eyebrow")} title={t("gallery.heading")} standfirst={t("gallery.intro")} />

      <div className="sticky top-16 z-40 border-y border-foreground/10 bg-background/90 backdrop-blur-md md:top-20 lg:top-[7.4rem]">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 md:px-10">
          <div role="group" aria-label={t("gallery.filter.label")} className="no-scrollbar flex flex-1 gap-6 overflow-x-auto py-4 text-sm">
            {[{ id: "all" as const, label: t("gallery.filter.all") }, ...siteConfig.galleryTags.map((tag) => ({ id: tag.id, label: p(tag.title) }))].map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={g.filter === f.id}
                onClick={() => g.setFilter(f.id)}
                className={cn("v2-link shrink-0 whitespace-nowrap", g.filter === f.id ? "v2-italic text-primary [background-size:100%_1px]" : "text-muted-foreground hover:text-foreground")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 rounded-full border border-foreground/15 p-1" role="group" aria-label="View">
            {([["lookbook", GalleryHorizontal, conceptCopy.lookbook], ["grid", LayoutGrid, conceptCopy.grid]] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                aria-label={p(label)}
                onClick={() => setView(id)}
                className={cn("grid h-9 w-9 place-items-center rounded-full transition-colors", view === id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="py-14">
        {g.tagDef && <p key={g.tagDef.id} className="v2-quote-enter v2-serif mx-auto mb-12 max-w-3xl px-4 text-center text-2xl font-light italic">{p(g.tagDef.description)}</p>}

        {g.items.length === 0 ? (
          <div className="mx-auto max-w-xl px-4 py-16 text-center">
            <h2 className="v2-serif text-5xl font-light">{t("gallery.empty.heading")}</h2>
            <p className="mt-4 text-muted-foreground">{t("gallery.empty.body")}</p>
            <V2Button href={mailtoHref(p(conceptCopy.mailSubject))} className="mt-8">{t("cta.emailJanelle")}</V2Button>
          </div>
        ) : view === "lookbook" ? (
          <div key={`lb-${g.filter}`} className="v2-strip no-scrollbar flex items-end gap-6 overflow-x-auto px-4 pb-6 md:gap-10 md:px-10">
            {g.items.map((item, i) => (
              <Reveal key={item.id} variant="mask" delay={Math.min(i, 3) * 100} className={cn("shrink-0", item.orientation === "landscape" ? "w-[85vw] md:w-[52vw]" : "w-[70vw] md:w-[30vw]")}>
                <figure>
                  <button type="button" onClick={() => g.setOpen(i)} className="group relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className={cn("relative", item.orientation === "landscape" ? "aspect-[3/2]" : "aspect-[3/4]")}>
                      <Image src={item.src} alt={item.alt} fill sizes="(min-width: 768px) 50vw, 85vw" className="object-cover transition-transform [transition-duration:1200ms] group-hover:scale-105" />
                    </div>
                  </button>
                  <figcaption className="mt-4 flex items-baseline gap-4">
                    <span className="v2-serif text-5xl font-light text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span className="v2-italic text-lg">{item.caption ? p(item.caption) : item.alt}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <div key={`grid-${g.filter}`} className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-12 px-4 md:grid-cols-3 md:px-10">
            {g.items.map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 100}>
                <figure>
                  <button type="button" onClick={() => g.setOpen(i)} className="group relative block aspect-[4/5] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Image src={item.src} alt={item.alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform [transition-duration:1200ms] group-hover:scale-105" />
                  </button>
                  <figcaption className="mt-3 text-sm">
                    <span className="v2-italic text-accent">{p(conceptCopy.fig)} {i + 1}</span>{" "}
                    <span className="text-muted-foreground">{item.caption ? p(item.caption) : item.alt}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <Lightbox items={g.lightboxItems} index={g.open} onIndexChange={g.setOpen} captionClassName="v2-italic text-lg" />
      <V2Cta heading={t("gallery.cta.heading")} body={t("gallery.cta.body")} />
    </>
  );
}
