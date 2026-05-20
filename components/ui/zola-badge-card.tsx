import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { cn } from "@/utils";
import type { ZolaProfile } from "@/config/site";

interface ZolaBadgeCardProps {
  zola: ZolaProfile;
  className?: string;
}

export function ZolaBadgeCard({ zola, className }: ZolaBadgeCardProps) {
  return (
    <a
      href={zola.vendorUrl}
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
        <div className="flex-shrink-0">
          <Image
            src="/zola.png"
            alt="Featured on Zola"
            width={160}
            height={160}
            className="object-contain"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-foreground">
            Featured on Zola
          </p>
          <h3 className="font-squarepeg text-3xl md:text-4xl text-foreground flex items-center gap-2 justify-center md:justify-start">
            Find Me on Zola
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </h3>
          <p className="text-muted-foreground leading-relaxed max-w-prose">
            Browse my work, read client reviews, and reach out — all through Zola&apos;s wedding vendor marketplace.
          </p>
        </div>
      </div>

    </a>
  );
}
