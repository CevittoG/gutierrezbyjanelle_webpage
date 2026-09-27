"use client";

import Image from "next/image";
import { Reveal } from "@/components/concepts/reveal";
import { Lightbox } from "@/components/concepts/lightbox";
import { useGallery } from "@/components/concepts/use-gallery";
import { mailtoHref, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";
import { Pill, Tilt, V3Cta, V3PageTitle } from "./ui";

const tilts = [-3, 2, -1.5, 3, -2, 1.5, -2.5, 2.5];
const tapes = ["bg-muted", "bg-[hsl(var(--butter-deep))]", "bg-card"];

export function V3Gallery() {
  const p = usePick();
  const { t } = useLocale();
  const g = useGallery();

  return (
    <>
      <V3PageTitle eyebrow={t("gallery.eyebrow")} title={t("gallery.heading")} intro={t("gallery.intro")} />

      <div role="group" aria-label={t("gallery.filter.label")} className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-4 pt-1 md:flex-wrap md:px-10">
        {[{ id: "all" as const, label: t("gallery.filter.all"), count: siteConfig.gallery.length }, ...siteConfig.galleryTags.map((tag) => ({ id: tag.id, label: p(tag.title), count: g.countFor(tag.id) }))].map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={g.filter === f.id}
            onClick={() => g.setFilter(f.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border-2 border-foreground px-4 py-2 font-semibold transition-all duration-300",
              g.filter === f.id ? "-rotate-2 bg-foreground text-background shadow-[3px_3px_0_hsl(var(--primary))]" : "bg-card hover:bg-muted"
            )}
          >
            {f.label}
            <span className={cn("grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs", g.filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted")}>{f.count}</span>
          </button>
        ))}
      </div>

      <section className="px-4 py-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          {g.tagDef && <p key={g.tagDef.id} className="v3-pop v3-serif mb-10 max-w-2xl text-3xl">{p(g.tagDef.description)}</p>}
          {g.items.length === 0 ? (
            <div className="v3-card v3-pop mx-auto max-w-xl bg-card px-8 py-14 text-center">
              <p className="text-6xl" aria-hidden="true">✂</p>
              <h2 className="v3-display mt-4 text-4xl">{t("gallery.empty.heading")}</h2>
              <p className="mt-3 text-muted-foreground">{t("gallery.empty.body")}</p>
              <Pill href={mailtoHref(p(conceptCopy.mailSubject))} className="mt-8">{t("cta.emailJanelle")}</Pill>
            </div>
          ) : (
            <div key={g.filter} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-12 lg:grid-cols-4">
              {g.items.map((item, i) => (
                <div key={item.id} className="v3-pop" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                  <Tilt rotate={tilts[i % tilts.length]}>
                    <button type="button" onClick={() => g.setOpen(i)} className="relative block w-full rounded-[18px] border-2 border-foreground bg-card p-2 pb-4 text-left shadow-[4px_4px_0_hsl(var(--foreground))] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--ring))]">
                      <span aria-hidden="true" className={cn("absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-[-4deg] border border-dashed border-foreground/25", tapes[i % tapes.length])} />
                      <span className="relative block aspect-[4/5] overflow-hidden rounded-[12px]">
                        <Image src={item.src} alt={item.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover" />
                      </span>
                      {item.caption && <span className="v3-serif mt-3 block px-1 text-lg leading-tight">{p(item.caption)}</span>}
                    </button>
                  </Tilt>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox items={g.lightboxItems} index={g.open} onIndexChange={g.setOpen} captionClassName="v3-serif text-2xl" />
      <V3Cta heading={t("gallery.cta.heading")} body={t("gallery.cta.body")} />
    </>
  );
}
