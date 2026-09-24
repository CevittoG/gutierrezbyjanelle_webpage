"use client";

import { useMemo, useState } from "react";
import { siteConfig, type GalleryItem, type GalleryTag } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";
import type { LightboxItem } from "./lightbox";

// Widened so `tags.includes(tag)` accepts any GalleryTag.
const gallery: GalleryItem[] = siteConfig.gallery;

/** Shared filter + lightbox state for the three concept galleries. */
export function useGallery() {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<GalleryTag | "all">("all");
  const [open, setOpen] = useState<number | null>(null);

  const items = useMemo(
    () => (filter === "all" ? gallery : gallery.filter((g) => g.tags?.includes(filter))),
    [filter]
  );
  const tagDef = filter === "all" ? null : siteConfig.galleryTags.find((g) => g.id === filter) ?? null;
  const lightboxItems: LightboxItem[] = items.map((g) => ({
    src: g.src,
    alt: g.alt,
    caption: g.caption ? pick(g.caption, locale) : undefined,
  }));
  const countFor = (tag: GalleryTag) => gallery.filter((g) => g.tags?.includes(tag)).length;

  return { filter, setFilter: (f: GalleryTag | "all") => { setFilter(f); setOpen(null); }, items, tagDef, open, setOpen, lightboxItems, countFor };
}
