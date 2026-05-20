import { cn } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentTier } from "@/config/site";

interface PriceCardProps {
  plan: InvestmentTier;
  className?: string;
}

export function PriceCard({ plan, className }: PriceCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {plan.discount && (
        <span className="absolute top-3 right-3 rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-xs font-semibold">
          {plan.discount}% savings
        </span>
      )}
      <CardHeader>
        <CardTitle className="font-squarepeg">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-foreground">✓</span> {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
