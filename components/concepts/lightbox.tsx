"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";

export type LightboxItem = { src: string; alt: string; caption?: string };

interface LightboxProps {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  className?: string;
  captionClassName?: string;
}

/**
 * Native <dialog> lightbox: focus trap, Esc and the backdrop come for free.
 * Arrow keys step through; clicking the backdrop closes.
 */
export function Lightbox({ items, index, onIndexChange, className, captionClassName }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();
  const item = index === null ? null : items[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  const step = (dir: 1 | -1) => {
    if (index === null || items.length === 0) return;
    onIndexChange((index + dir + items.length) % items.length);
  };

  return (
    <dialog
      ref={ref}
      className={cn("concept-lightbox", className)}
      onClose={() => onIndexChange(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onIndexChange(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
    >
      {item && (
        <figure className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 md:p-10" onClick={(e) => e.target === e.currentTarget && onIndexChange(null)}>
          <div key={item.src} className="concept-lightbox-img relative h-[72vh] w-full max-w-5xl">
            <Image src={item.src} alt={item.alt} fill sizes="90vw" className="object-contain" />
          </div>
          {item.caption && <figcaption className={cn("max-w-xl text-center text-sm", captionClassName)}>{item.caption}</figcaption>}
          <button type="button" onClick={() => step(-1)} aria-label={t("gallery.lightbox.prev")} className="concept-lightbox-btn left-3 top-1/2 -translate-y-1/2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t("gallery.lightbox.next")} className="concept-lightbox-btn right-3 top-1/2 -translate-y-1/2">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => onIndexChange(null)} aria-label={t("gallery.lightbox.close")} className="concept-lightbox-btn right-3 top-3" autoFocus>
            <X className="h-5 w-5" />
          </button>
        </figure>
      )}
    </dialog>
  );
}
