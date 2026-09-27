"use client";

import Image from "next/image";
import { cn } from "@/utils";
import { siteConfig, type Founder } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

interface FounderPortraitProps {
  className?: string;
}

/**
 * FounderPortrait — Janelle's headshot, shared by the home story scroll and
 * the About page.
 *
 * Renders nothing at all while `siteConfig.founder.photo` is unset, so neither
 * surface ever shows an empty "photo coming soon" frame. Callers must lay out
 * gracefully for the absent case (see the founder scene in `_home-content.tsx`,
 * which collapses to a single centred column).
 *
 * To turn it on: drop the file at `public/founder/janelle.jpg` and uncomment
 * the `photo` line in `config/site.ts`. No component change needed.
 */
export function FounderPortrait({ className }: FounderPortraitProps) {
  const { locale } = useLocale();
  // Widen to `Founder` so `photo` stays readable while its config line is
  // commented out (`satisfies` would otherwise infer the key away).
  const { photo, alt }: Founder = siteConfig.founder;

  if (!photo) return null;

  return (
    <figure
      className={cn(
        "glass relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-sm border border-border",
        className
      )}
    >
      <Image
        src={photo}
        alt={pick(alt, locale)}
        fill
        sizes="(min-width: 768px) 320px, 80vw"
        className="object-cover"
      />
    </figure>
  );
}
