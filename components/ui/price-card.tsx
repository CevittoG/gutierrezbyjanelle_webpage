"use client";

import Image from "next/image";
import { cn } from "@/utils";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentTier } from "@/config/site";
import { FeaturePreviewList } from "@/components/ui/feature-preview-list";
import { getFeaturePreview } from "@/config/item-previews";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

interface PriceCardProps {
  plan: InvestmentTier;
  /** Optional hero image displayed at the top of the card. */
  imageSrc?: string;
  /** Alt text for the hero image. */
  imageAlt?: string;
  /** When true (and no imageSrc), render a tasteful placeholder block. */
  showPlaceholder?: boolean;
  className?: string;
}

export function PriceCard({ plan, imageSrc, imageAlt, showPlaceholder, className }: PriceCardProps) {
  const { locale } = useLocale();
  const name = pick(plan.name, locale);
  const description = pick(plan.description, locale);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {imageSrc ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt ?? name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : showPlaceholder && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/60 border-b border-border/60 flex flex-col items-center justify-center gap-2 text-muted-foreground/70">
          <ImageIcon className="w-8 h-8" aria-hidden="true" strokeWidth={1.25} />
          <p className="text-[10px] uppercase tracking-widest">Photo coming soon</p>
        </div>
      )}
      {plan.savingsLabel && (
        <Badge
          variant="secondary"
          className={cn(
            "absolute right-3 border-accent/40 bg-accent/30 text-foreground/80 tracking-widest",
            (imageSrc || showPlaceholder) ? "top-3 bg-card/80 backdrop-blur-sm border-border/60" : "top-3"
          )}
        >
          {plan.savingsLabel}
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="font-squarepeg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FeaturePreviewList
          items={plan.features.map((f) => {
            // Preview lookup uses the EN key so the map stays locale-agnostic.
            const preview = getFeaturePreview(f.en);
            return {
              key: f.en,
              label: pick(f, locale),
              imageSrc: preview?.imageSrc,
              orientation: preview?.orientation,
            };
          })}
        />
      </CardContent>
    </Card>
  );
}
