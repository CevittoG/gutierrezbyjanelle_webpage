import { cn } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricePlan } from "@/config/site";

interface PriceCardProps {
  plan: PricePlan;
  className?: string;
}

export function PriceCard({ plan, className }: PriceCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl md:text-4xl font-bold mb-6">{plan.price}</div>
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
