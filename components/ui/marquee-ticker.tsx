"use client";

import { cn } from "@/utils";

interface MarqueeTickerProps {
  items: string[];
  /** Separator glyph between items. Default: bullet • */
  separator?: string;
  /** Full animation cycle in seconds. Default: 40 */
  speed?: number;
  className?: string;
}

/**
 * MarqueeTicker — a slow horizontal scrolling list of text items.
 *
 * Content is duplicated so translateX(-50%) loops seamlessly.
 * Animation is pure CSS (@keyframes marquee-scroll in globals.css).
 * Pauses on hover; respects prefers-reduced-motion via globals.css.
 *
 * Reusable: drop anywhere with any items/speed/separator.
 *   <MarqueeTicker items={features} speed={60} separator="✦" />
 */
export function MarqueeTicker({
  items,
  separator = "•",
  speed = 40,
  className,
}: MarqueeTickerProps) {
  const track = (
    <span className="inline-flex items-center">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="px-3">{item}</span>
          <span
            className="text-foreground/30 text-sm select-none"
            aria-hidden="true"
          >
            {separator}
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={cn("relative overflow-hidden w-full py-3", className)}>
      {/* Left fade */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10"
        style={{
          background:
            "linear-gradient(to right, hsl(var(--background)), transparent)",
        }}
        aria-hidden="true"
      />
      {/* Right fade */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10"
        style={{
          background:
            "linear-gradient(to left, hsl(var(--background)), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Scrolling track — duplicated for seamless loop */}
      <div
        className="flex whitespace-nowrap items-center text-xs uppercase tracking-widest text-foreground/60 will-change-transform hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-scroll ${speed}s linear infinite`,
        }}
      >
        {track}
        <span aria-hidden="true">{track}</span>
      </div>
    </div>
  );
}
