"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/utils";
import type { PreviewOrientation } from "@/config/item-previews";
import { HoverPreviewItem } from "@/components/ui/hover-preview-item";

export interface FeaturePreviewListItem {
  /** Stable React key (use the source-language label so it survives locale switches) */
  key: string;
  /** Displayed text */
  label: string;
  imageSrc?: string;
  orientation?: PreviewOrientation;
}

interface FeaturePreviewListProps {
  items: FeaturePreviewListItem[];
  className?: string;
}

// Portrait frame: tall card (invites, ceremony, detail…)
const PORTRAIT  = { w: 240, h: 300 };
// Landscape frame: wide card (RSVP, save-the-date…)
const LANDSCAPE = { w: 300, h: 210 };
// Lerp factor — higher = snappier follow
const LERP = 0.18;
// Cursor offset so the preview sits to the upper-right of the pointer
const OFFSET_X = 24;
const OFFSET_Y = -120;
// Min margin from viewport edges
const EDGE_MARGIN = 12;

/**
 * FeaturePreviewList — a feature `<ul>` that shares a single cursor-following
 * image preview. As the pointer moves between rows, the active image crossfades
 * (with blur+scale) into the floating frame, which smoothly tracks the cursor
 * via per-frame lerping.
 *
 * Falls back to the per-item tap-lightbox behavior on touch / non-hover devices
 * by delegating to <HoverPreviewItem />.
 */
export function FeaturePreviewList({ items, className }: FeaturePreviewListProps) {
  const [mounted, setMounted] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSupportsHover(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  // ── Mobile / SSR fallback: existing per-item tap → lightbox ─────────────
  if (!mounted || !supportsHover) {
    return (
      <ul className={cn("grid gap-2 text-sm text-muted-foreground", className)}>
        {items.map(({ key, label, imageSrc, orientation }) => (
          <li key={key} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-foreground shrink-0" aria-hidden="true" />
            <HoverPreviewItem
              label={label}
              imageSrc={imageSrc}
              orientation={orientation}
            />
          </li>
        ))}
      </ul>
    );
  }

  return <DesktopFeaturePreviewList items={items} className={className} />;
}

function DesktopFeaturePreviewList({ items, className }: FeaturePreviewListProps) {
  const containerRef = useRef<HTMLUListElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [smooth, setSmooth] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setSmooth((p) => ({
        x: p.x + (mouse.x - p.x) * LERP,
        y: p.y + (mouse.y - p.y) * LERP,
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mouse]);

  const handleMouseMove = (e: MouseEvent<HTMLUListElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const active = hoveredIndex !== null ? items[hoveredIndex] : null;
  const visible = !!active?.imageSrc;
  const frame = active?.orientation === "landscape" ? LANDSCAPE : PORTRAIT;

  // Compute the floating frame's viewport position (origin + cursor + offset),
  // clamped so it never spills off-screen.
  const rect = containerRef.current?.getBoundingClientRect();
  let left = (rect?.left ?? 0) + smooth.x + OFFSET_X;
  let top  = (rect?.top  ?? 0) + smooth.y + OFFSET_Y;
  if (typeof window !== "undefined") {
    left = Math.max(EDGE_MARGIN, Math.min(left, window.innerWidth  - frame.w - EDGE_MARGIN));
    top  = Math.max(EDGE_MARGIN, Math.min(top,  window.innerHeight - frame.h - EDGE_MARGIN));
  }

  // Portaling escapes any ancestor containing block (e.g. Card's `.glass`
  // backdrop-filter), which would otherwise trap & clip this fixed element.
  const floatingPreview = (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed z-50 overflow-hidden rounded-xl",
        "border border-border/40 bg-card/80 backdrop-blur-sm",
        "motion-reduce:transition-none"
      )}
      style={{
        left,
        top,
        width:  frame.w,
        height: frame.h,
        opacity: visible ? 1 : 0,
        transition:
          "opacity 220ms cubic-bezier(0.16,1,0.3,1), " +
          "width 280ms cubic-bezier(0.16,1,0.3,1), " +
          "height 280ms cubic-bezier(0.16,1,0.3,1)",
        boxShadow:
          "0 12px 40px -6px hsl(var(--foreground) / 0.22), " +
          "0 4px 14px -4px hsl(var(--foreground) / 0.12)",
      }}
    >
      {items.map((it, i) => {
        if (!it.imageSrc) return null;
        const isActive = hoveredIndex === i;
        return (
          <Image
            key={it.key}
            src={it.imageSrc}
            alt=""
            fill
            sizes={`${Math.max(PORTRAIT.w, LANDSCAPE.w)}px`}
            className={cn(
              "object-cover transition-all duration-500 ease-out",
              isActive ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-110 blur-md"
            )}
          />
        );
      })}
      {/* Subtle bottom-fade overlay, mirrors the reference */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );

  return (
    <>
      {typeof document !== "undefined" && createPortal(floatingPreview, document.body)}

      <ul
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        className={cn("grid gap-2 text-sm text-muted-foreground", className)}
      >
        {items.map((it, i) => {
          const hasPreview = !!it.imageSrc;
          const isActive = hoveredIndex === i;
          return (
            <li
              key={it.key}
              onMouseEnter={() => setHoveredIndex(hasPreview ? i : null)}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-foreground shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  "transition-colors duration-200",
                  hasPreview &&
                    "underline decoration-dotted underline-offset-2 decoration-border/70 cursor-default",
                  isActive && hasPreview && "text-foreground"
                )}
              >
                {it.label}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
