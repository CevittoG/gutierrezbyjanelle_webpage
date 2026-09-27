"use client";

import Image from "next/image";
import { cn } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentTier } from "@/config/site";
import { FeaturePreviewList } from "@/components/ui/feature-preview-list";
import { getFeaturePreview } from "@/config/item-previews";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

interface PriceCardProps {
  plan: InvestmentTier;
  className?: string;
}

export function PriceCard({ plan, className }: PriceCardProps) {
  const { locale } = useLocale();
  const name = pick(plan.name, locale);
  const description = pick(plan.description, locale);
  // Showcase photo is opt-in per tier (config/site.ts). While a tier has none,
  // the card renders with no image area at all — never an empty placeholder.
  const image = plan.image;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={image.src}
            alt={pick(image.alt, locale)}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      {plan.savingsLabel && (
        <Badge
          variant="secondary"
          className={cn(
            "absolute right-3 top-3 border-accent/40 bg-accent/30 text-foreground/80 tracking-widest",
            image && "bg-card/80 backdrop-blur-sm border-border/60"
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
