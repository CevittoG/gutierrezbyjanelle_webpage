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
import { CtaBlock, PageHeader, V1Button } from "./ui";

export function V1Gallery() {
  const p = usePick();
  const { t } = useLocale();
  const g = useGallery();

  return (
    <>
      <PageHeader eyebrow={t("gallery.eyebrow")} title={t("gallery.heading")} intro={t("gallery.intro")} />

      <div className="sticky top-16 z-30 border-y border-border bg-background/85 backdrop-blur-md md:top-20">
        <div role="group" aria-label={t("gallery.filter.label")} className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:justify-center md:px-8">
          {[{ id: "all" as const, label: t("gallery.filter.all"), count: siteConfig.gallery.length }, ...siteConfig.galleryTags.map((tag) => ({ id: tag.id, label: p(tag.title), count: g.countFor(tag.id) }))].map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={g.filter === f.id}
              onClick={() => g.setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[10px] tracking-[0.16em] transition-all duration-300",
                g.filter === f.id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent"
              )}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 py-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          {g.tagDef && (
            <p key={g.tagDef.id} className="font-anybody-prose mx-auto mb-10 max-w-xl text-center text-lg text-muted-foreground">
              {p(g.tagDef.description)}
            </p>
          )}
          {g.items.length === 0 ? (
            <div className="v1-paper v1-stitch relative mx-auto max-w-xl rounded-[4px] border border-border px-8 py-16 text-center">
              <h2 className="font-squarepeg text-5xl">{t("gallery.empty.heading")}</h2>
              <p className="font-anybody-prose mt-4 text-muted-foreground">{t("gallery.empty.body")}</p>
              <V1Button href={mailtoHref(p(conceptCopy.mailSubject))} variant="seal" className="mt-8">{t("cta.emailJanelle")}</V1Button>
            </div>
          ) : (
            <div key={g.filter} className="v1-masonry">
              {g.items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 4) * 90}>
                  <button type="button" onClick={() => g.setOpen(i)} className="group relative block w-full overflow-hidden rounded-[3px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={600}
                      height={item.orientation === "landscape" ? 420 : item.orientation === "portrait" ? 800 : 600}
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="h-auto w-full transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                    />
                    {item.caption && (
                      <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[hsl(90_25%_10%/0.85)] to-transparent p-4 pt-10 font-anybody-prose text-sm text-[hsl(40_38%_96%)] transition-transform duration-500 group-hover:translate-y-0">
                        {p(item.caption)}
                      </span>
                    )}
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox items={g.lightboxItems} index={g.open} onIndexChange={g.setOpen} />
      <CtaBlock heading={t("gallery.cta.heading")} body={t("gallery.cta.body")} />
    </>
  );
}
