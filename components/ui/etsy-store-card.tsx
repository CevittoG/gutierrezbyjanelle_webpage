import { ShoppingBag, ExternalLink } from "lucide-react";
import { cn } from "@/utils";
import type { EtsyStore } from "@/config/site";

interface EtsyStoreCardProps {
  store: EtsyStore;
  className?: string;
}

export function EtsyStoreCard({ store, className }: EtsyStoreCardProps) {
  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:border-accent/60",
        className
      )}
    >
      <div className="h-1 w-full bg-accent" />

      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-8 md:p-10">
        <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-accent/40">
          <ShoppingBag className="w-9 h-9 text-accent-foreground" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-foreground">
            Shop on Etsy
          </p>
          <h3 className="font-shadows text-3xl md:text-4xl text-foreground flex items-center gap-2 justify-center md:justify-start">
            {store.name}
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </h3>
          <p className="text-muted-foreground leading-relaxed max-w-prose">
            {store.tagline}
          </p>
        </div>
      </div>
    </a>
  );
}
