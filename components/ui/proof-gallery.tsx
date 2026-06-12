"use client";

// Client-portal proof gallery. Responsive masonry of proof images with a
// shared-element ("layoutId") zoom into a lightbox that supports drag-to-dismiss,
// keyboard nav, and prev/next. Brand-adapted from the supplied concept:
// backdrop is Deep Ink (never pure black), controls are Card White on the blur,
// and every animation is disabled under prefers-reduced-motion.
//
// Proofs are dynamic, same-origin proxy URLs of unknown aspect ratio, so raw
// <img> (not next/image) is correct here — matching the rest of the portal.

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import type { PublicQuoteFile } from "@/lib/quote-calc-portal";

const spring = { type: "spring", stiffness: 320, damping: 34, mass: 1 } as const;

export function ProofGallery({
  images,
  pdfs,
  className,
}: {
  images: PublicQuoteFile[];
  pdfs: PublicQuoteFile[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
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
    <div className={cn("space-y-6", className)}>
      {images.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`View ${img.name}`}
              className="group relative mb-4 block w-full break-inside-avoid cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted/40 transition-[box-shadow,border-color] duration-200 hover:border-accent/80 hover:[box-shadow:0_4px_20px_-4px_hsl(350_55%_86%_/_0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                layoutId={reduce ? undefined : `proof-${img.id}`}
                src={img.url}
                alt={img.name}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                transition={reduce ? { duration: 0 } : spring}
              />
            </button>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <ul className="space-y-2">
          {pdfs.map((pdf) => (
            <li key={pdf.id}>
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm normal-case tracking-normal hover:border-accent transition-colors"
              >
                <span aria-hidden className="text-accent">▢</span>
                <span className="truncate">{pdf.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        images={images}
        openIndex={openIndex}
        onClose={close}
        onNext={next}
        onPrev={prev}
        reduce={!!reduce}
      />
    </div>
  );
}

function Lightbox({
  images,
  openIndex,
  onClose,
  onNext,
  onPrev,
  reduce,
}: {
  images: PublicQuoteFile[];
  openIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  reduce: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const item = openIndex === null ? null : images[openIndex];

  return createPortal(
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            onClick={onClose}
            aria-hidden
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 pointer-events-none">
            <motion.div
              className="relative pointer-events-auto cursor-zoom-out flex items-center justify-center"
              drag={reduce ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.y) > 120 || Math.abs(info.velocity.y) > 400) onClose();
              }}
              onClick={onClose}
              role="dialog"
              aria-modal="true"
              aria-label={item.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                layoutId={reduce ? undefined : `proof-${item.id}`}
                src={item.url}
                alt={item.name}
                draggable={false}
                className="w-auto h-auto max-w-[92vw] max-h-[86vh] rounded-lg object-contain will-change-transform"
                style={{ boxShadow: "0 24px 60px -12px hsl(var(--foreground) / 0.5)" }}
                transition={reduce ? { duration: 0 } : spring}
              />
            </motion.div>
          </div>

          <motion.button
            key="close"
            type="button"
            onClick={onClose}
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.05 }}
            className="fixed top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-card/85 border border-border/60 backdrop-blur-sm text-foreground/80 hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            <X className="h-5 w-5" aria-hidden />
          </motion.button>

          {images.length > 1 && (
            <>
              <NavButton side="left" label="Previous proof" onClick={onPrev} />
              <NavButton side="right" label="Next proof" onClick={onNext} />
            </>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function NavButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-50 h-11 w-11 flex items-center justify-center rounded-full",
        "bg-card/85 border border-border/60 backdrop-blur-sm text-foreground/80 hover:text-foreground transition-colors",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="h-5 w-5" aria-hidden />
      ) : (
        <ChevronRight className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
