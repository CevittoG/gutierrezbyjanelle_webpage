import { ShoppingBag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import type { EtsyStore } from "@/config/site";

interface EtsyStoreCardProps {
  store: EtsyStore;
  className?: string;
}

export function EtsyStoreCard({ store, className }: EtsyStoreCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
        className
      )}
    >
      {/* Etsy orange accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: "#F1641E" }} />

      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-8 md:p-10">
        {/* Icon badge */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full"
          style={{ backgroundColor: "#FFF0EB" }}
        >
          <ShoppingBag className="w-9 h-9" style={{ color: "#F1641E" }} />
        </div>

        {/* Text */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#F1641E" }}
          >
            Shop on Etsy
          </p>
          <h3 className="font-shadows text-3xl md:text-4xl text-foreground">
            {store.name}
          </h3>
          <p className="text-muted-foreground leading-relaxed max-w-prose">
            {store.tagline}
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <Button asChild size="lg">
            <a
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Visit My Shop
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
