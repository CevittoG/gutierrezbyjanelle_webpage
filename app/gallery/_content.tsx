"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GalleryGrid } from "@/components/ui/gallery-grid";
import { Button } from "@/components/ui/button";
import { InstagramGrid } from "@/components/ui/instagram-grid";
import { siteConfig } from "@/config/site";
import type { GalleryTag } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";
import { cn } from "@/utils";

export function GalleryContent() {
  const { t, locale } = useLocale();
  const [activeFilter, setActiveFilter] = useState<GalleryTag | "all">("all");
  const activeTagDef =
    activeFilter !== "all"
      ? siteConfig.galleryTags.find((g) => g.id === activeFilter) ?? null
      : null;

  return (
    <div className="container py-12 px-4 md:px-8 space-y-24 md:space-y-28">
      {/* ── Portfolio ─────────────────────────────────────────────── */}
      <section>
        <header className="mx-auto max-w-2xl text-center mb-10 md:mb-12 space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("gallery.eyebrow")}
          </p>
          <h1 className="font-squarepeg text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
            {t("gallery.heading")}
          </h1>
          <p className="normal-case tracking-normal font-normal text-foreground/80 text-base md:text-lg leading-relaxed max-w-[55ch] mx-auto">
            {t("gallery.intro")}
          </p>
        </header>

        {/* ── Tag filter bar ────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 mb-10 md:mb-12">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 w-full justify-start md:justify-center [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t("gallery.filter.label")}
          >
            <FilterPill
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            >
              {t("gallery.filter.all")}
            </FilterPill>

            {siteConfig.galleryTags.map((tag) => (
              <FilterPill
                key={tag.id}
                active={activeFilter === tag.id}
                onClick={() => setActiveFilter(tag.id)}
              >
                {pick(tag.title, locale)}
              </FilterPill>
            ))}
          </div>

          {/* Animated tag description */}
          <AnimatePresence mode="wait">
            {activeTagDef && (
              <motion.p
                key={activeFilter}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="normal-case tracking-normal font-normal text-sm text-muted-foreground text-center max-w-[55ch] leading-relaxed"
              >
                {pick(activeTagDef.description, locale)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <GalleryGrid
          items={siteConfig.gallery}
          tagDefs={siteConfig.galleryTags}
          activeFilter={activeFilter}
          className="max-w-5xl mx-auto"
        />
      </section>

      {/* ── Inquiry CTA (inward path before the Instagram off-ramp) ── */}
      <section className="border-t border-border/40 -mx-4 md:-mx-8 px-4 md:px-8 pt-16 md:pt-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-squarepeg text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
            {t("gallery.cta.heading")}
          </h2>
          <p className="normal-case tracking-normal font-normal text-foreground/80 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
            {t("gallery.cta.body")}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <Button asChild size="lg" variant="outline">
              <Link href="/investment">
                {t("cta.seeInvestment")}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`mailto:${siteConfig.contactEmail ?? ""}`}>
                <Mail className="w-4 h-4" aria-hidden="true" />
                {t("cta.emailJanelle")}
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">{t("cta.talkSoon")}</p>
        </div>
      </section>

      {/* ── Instagram (off-ramp; intentionally last) ────────────── */}
      <section>
        <header className="mx-auto max-w-2xl text-center mb-12 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("gallery.instagram.eyebrow")}
          </p>
          <h2 className="font-squarepeg text-3xl sm:text-4xl leading-[1.05]">
            {t("gallery.instagram.heading")}
          </h2>
          <p className="normal-case tracking-normal font-normal text-sm md:text-base text-muted-foreground leading-relaxed max-w-[55ch] mx-auto">
            {t("gallery.instagram.bodyPrefix")}{" "}
            <a
              href={siteConfig.instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              @{siteConfig.instagram.handle}
            </a>
            .
          </p>
        </header>
        <InstagramGrid config={siteConfig.instagram} className="max-w-5xl mx-auto" />
      </section>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-xs tracking-widest uppercase transition-colors duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-accent border border-accent text-foreground"
          : "border border-border text-muted-foreground hover:border-accent/60"
      )}
    >
      {children}
    </button>
  );
}
