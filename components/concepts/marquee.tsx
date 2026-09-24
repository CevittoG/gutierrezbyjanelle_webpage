import type { CSSProperties } from "react";
import { cn } from "@/utils";

interface MarqueeProps {
  items: string[];
  className?: string;
  itemClassName?: string;
  separator?: string;
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
}

/** CSS-only infinite ticker. The track is duplicated for a seamless loop. */
export function Marquee({ items, className, itemClassName, separator = "✦", duration = 40, reverse }: MarqueeProps) {
  const row = (hidden: boolean) => (
    <ul className="concept-marquee-row" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className={cn("concept-marquee-item", itemClassName)}>
          <span>{item}</span>
          <span aria-hidden="true" className="concept-marquee-sep">{separator}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={cn("concept-marquee", reverse && "is-reverse", className)}
      style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
    >
      <div className="concept-marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
