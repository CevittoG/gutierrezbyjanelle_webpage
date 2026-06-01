"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { cn } from "@/utils";
import type { EtsyStore } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

interface EtsyStoreCardProps {
  store: EtsyStore;
  className?: string;
}

export function EtsyStoreCard({ store, className }: EtsyStoreCardProps) {
  const { locale, t } = useLocale();
  const tagline = pick(store.tagline, locale);

  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "glass group block rounded-2xl border border-border overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="relative flex flex-col items-center gap-6 p-6 md:flex-row md:gap-10 md:p-10">
        <div className="flex-shrink-0">
          <Image
            src="/etsy.jpg"
            alt=""
            width={96}
            height={96}
            className="object-cover rounded-full aspect-square w-20 h-20 md:w-24 md:h-24"
          />
        </div>

        <div className="flex-1 space-y-1.5 text-center md:text-left">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("etsy.eyebrow")}
          </p>
          <h3 className="font-squarepeg text-2xl md:text-3xl text-foreground">
            {store.name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
            {tagline}
          </p>
        </div>

        <ExternalLink
          className="absolute right-5 top-5 w-4 h-4 text-muted-foreground/70 transition-colors duration-200 group-hover:text-foreground"
          aria-hidden="true"
        />
      </div>
    </a>
  );
}
