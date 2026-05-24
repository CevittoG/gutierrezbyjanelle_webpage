import { cn } from "@/utils";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentTier } from "@/config/site";
import { HoverPreviewItem } from "@/components/ui/hover-preview-item";
import { getFeaturePreview } from "@/config/item-previews";

interface PriceCardProps {
  plan: InvestmentTier;
  className?: string;
}

export function PriceCard({ plan, className }: PriceCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {plan.savingsLabel && (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 border-accent/40 bg-accent/30 text-foreground/80 tracking-widest"
        >
          {plan.savingsLabel}
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="font-squarepeg">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-foreground shrink-0" aria-hidden="true" />
              <HoverPreviewItem label={f} {...getFeaturePreview(f)} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
