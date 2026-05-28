"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import type {
  GalleryItem,
  GalleryGroup,
  GalleryOrientation,
} from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

interface GalleryGridProps {
  items: GalleryItem[];
  groups: readonly GalleryGroup[];
  className?: string;
}

function tileAspect(o: GalleryOrientation | undefined) {
  if (o === "portrait") return "aspect-[4/5]";
  if (o === "landscape") return "aspect-[3/2]";
  return "aspect-square";
}

/**
 * Per-row span allocation inside the 6-col group grid.
 * Portraits sit narrow and tall, landscapes go wide, squares are mid.
 * The mobile breakpoint collapses to a single column.
 */
function tileSpan(o: GalleryOrientation | undefined) {
  if (o === "landscape") return "md:col-span-4";
  if (o === "portrait") return "md:col-span-3";
  return "md:col-span-3";
}

export function GalleryGrid({ items, groups, className }: GalleryGridProps) {
  const { locale, t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length]
  );
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i - 1 + items.length) % items.length
      ),
    [items.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [openIndex, close, next, prev]);

  return (
    <div className={cn("space-y-16 md:space-y-24", className)}>
      {groups.map((group) => {
        const groupItems = items.filter((it) => it.category === group.id);
        if (groupItems.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`gallery-${group.id}`}>
            <header className="mb-6 md:mb-8 max-w-2xl">
              <h2
                id={`gallery-${group.id}`}
                className="font-squarepeg text-3xl sm:text-4xl leading-[1.05]"
              >
                {pick(group.title, locale)}
              </h2>
              <p className="normal-case tracking-normal font-normal text-sm md:text-base text-muted-foreground mt-2 leading-relaxed max-w-[55ch]">
                {pick(group.intro, locale)}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-5 md:gap-6 items-start">
              {groupItems.map((item) => {
                const idx = items.indexOf(item);
                return (
                  <figure
                    key={item.id}
                    className={cn("group", tileSpan(item.orientation))}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(idx)}
                      aria-label={`${t("gallery.openItem")} ${item.alt}`}
                      className={cn(
                        "relative block w-full overflow-hidden rounded-lg border border-border bg-muted",
                        "transition-[box-shadow,border-color] duration-200",
                        "hover:border-accent/80",
                        "hover:[box-shadow:0_4px_20px_-4px_hsl(350_55%_86%_/_0.45)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        tileAspect(item.orientation)
                      )}
                    >
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </button>
                    {item.caption && (
                      <figcaption className="mt-3 normal-case tracking-normal font-normal text-xs md:text-sm text-muted-foreground leading-snug max-w-[40ch]">
                        {pick(item.caption, locale)}
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          </section>
        );
      })}

      <GalleryLightbox
        items={items}
        openIndex={openIndex}
        onClose={close}
        onNext={next}
        onPrev={prev}
        locale={locale}
        labels={{
          prev: t("gallery.lightbox.prev"),
          next: t("gallery.lightbox.next"),
          close: t("gallery.lightbox.close"),
        }}
      />
    </div>
  );
}

function GalleryLightbox({
  items,
  openIndex,
  onClose,
  onNext,
  onPrev,
  locale,
  labels,
}: {
  items: GalleryItem[];
  openIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  locale: "en" | "es";
  labels: { prev: string; next: string; close: string };
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const item = openIndex === null ? null : items[openIndex];

  return createPortal(
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="lb-backdrop"
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="lb-wrap"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 md:px-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.figure
              role="dialog"
              aria-modal="true"
              aria-label={item.alt}
              className="relative pointer-events-auto w-full max-w-3xl flex flex-col items-center gap-4"
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-lg border border-border bg-card",
                  tileAspect(item.orientation)
                )}
                style={{
                  boxShadow:
                    "0 12px 40px -8px hsl(var(--foreground) / 0.32), 0 4px 12px -4px hsl(var(--foreground) / 0.18)",
                }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 92vw, 768px"
                  priority
                />
              </div>

              {item.caption && (
                <figcaption className="text-center normal-case tracking-normal font-normal text-sm md:text-base text-background/90 leading-relaxed max-w-[55ch]">
                  {pick(item.caption, locale)}
                </figcaption>
              )}

              <button
                type="button"
                aria-label={labels.close}
                onClick={onClose}
                className={cn(
                  "absolute top-2 right-2 z-10 flex items-center justify-center",
                  "h-9 w-9 rounded-full bg-card/85 border border-border/60 backdrop-blur-sm",
                  "text-foreground/70 hover:text-foreground transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={labels.prev}
                    onClick={onPrev}
                    className={cn(
                      "absolute left-2 md:-left-2 top-1/2 -translate-y-1/2 z-10",
                      "flex items-center justify-center h-10 w-10 rounded-full",
                      "bg-card/85 border border-border/60 backdrop-blur-sm",
                      "text-foreground/70 hover:text-foreground transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={labels.next}
                    onClick={onNext}
                    className={cn(
                      "absolute right-2 md:-right-2 top-1/2 -translate-y-1/2 z-10",
                      "flex items-center justify-center h-10 w-10 rounded-full",
                      "bg-card/85 border border-border/60 backdrop-blur-sm",
                      "text-foreground/70 hover:text-foreground transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                    )}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              )}
            </motion.figure>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
