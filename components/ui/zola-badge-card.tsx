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
        "glass relative block rounded-2xl border border-border text-card-foreground",
        className,
      )}
    >
      <ExternalLink
        aria-hidden="true"
        className="text-muted-foreground/70 absolute right-5 top-5 h-4 w-4"
      />

      <div className="flex flex-col items-center gap-6 p-8 md:flex-row md:gap-10 md:p-10">
        <div className="flex-shrink-0">
          <Image
            src="/zola.png"
            alt=""
            width={160}
            height={160}
            className="object-contain"
          />
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <span className="border-border bg-muted text-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">
            Featured on Zola
          </span>
          <h3 className="font-squarepeg text-foreground text-3xl md:text-4xl">
            Find Me on Zola
          </h3>
          <p className="text-muted-foreground max-w-prose leading-relaxed">
            Browse my work, read client reviews, and reach out, all through Zola&apos;s wedding vendor marketplace.
          </p>
        </div>
      </div>
    </a>
  );
}
