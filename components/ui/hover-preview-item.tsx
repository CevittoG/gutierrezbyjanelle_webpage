"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/utils";
import type { PreviewOrientation } from "@/config/item-previews";

// Portrait frame: tall card (invites, ceremony cards, detail cards…)
const PORTRAIT_W  = 220;
const PORTRAIT_H  = 275;
// Landscape frame: wide card (RSVP, save-the-dates…)
const LANDSCAPE_W = 280;
const LANDSCAPE_H = 196;
// Gap between the label and the floating preview
const PREVIEW_GAP = 16;
// Minimum horizontal margin from viewport edges
const EDGE_MARGIN = 12;

interface HoverPreviewItemProps {
  label: string;
  /** Portfolio image path. If omitted, renders plain text with no interaction. */
  imageSrc?: string;
  /** Controls the frame dimensions. Defaults to "portrait". */
  orientation?: PreviewOrientation;
  className?: string;
}

/**
 * HoverPreviewItem — a feature label that floats a portfolio image on hover.
 *
 * - No imageSrc → plain <span>, no visual change.
 * - Touch / non-hover devices → plain <span> (no underline affordance either).
 *   Detected via `(hover: hover) and (pointer: fine)` after hydration so the
 *   component is SSR-safe and never shows a broken fixed-position preview on
 *   phones (touch events fire synthetic mouseenter, which caused off-screen
 *   previews on mobile).
 * - Hover-capable devices → dotted underline; hovering shows a fixed-position
 *   preview anchored to the right of the element (flips left if near the
 *   viewport edge, clamped on both axes).
 *
 * The frame aspect ratio adapts to `orientation`:
 *   "portrait"  → tall frame (default — invites, cards, etc.)
 *   "landscape" → wide frame (RSVP cards, save-the-dates, etc.)
 *
 * Uses position:fixed so it escapes any parent overflow:hidden without
 * needing a React portal.
 *
 * Reusable: import wherever feature lists, captions, or inline labels
 * reference a stationery item. Pair with getFeaturePreview() from
 * config/item-previews.ts and spread the result directly:
 *   <HoverPreviewItem label={f} {...getFeaturePreview(f)} />
 */
export function HoverPreviewItem({
  label,
  imageSrc,
  orientation = "portrait",
  className,
}: HoverPreviewItemProps) {
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);
  // Start false (SSR + touch-safe). Set to true after hydration only on
  // pointer-fine / hover-capable devices (mice, trackpads — not touch screens).
  const [supportsHover, setSupportsHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setSupportsHover(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  // No image, or touch device → plain text, no interactive affordance
  if (!imageSrc || !supportsHover) {
    return <span className={className}>{label}</span>;
  }

  const PREVIEW_W = orientation === "landscape" ? LANDSCAPE_W : PORTRAIT_W;
  const PREVIEW_H = orientation === "landscape" ? LANDSCAPE_H : PORTRAIT_H;

  const handleMouseEnter = () => {
    if (ref.current) {
      setPreviewRect(ref.current.getBoundingClientRect());
    }
  };

  // Compute position: right-anchored to element, vertically centered.
  // Flips to left side if it would overflow the right edge.
  // Clamped on both axes so the preview never goes off-screen.
  let left = 0;
  let top = 0;
  if (previewRect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rightSide = previewRect.right + PREVIEW_GAP;
    const leftSide  = previewRect.left  - PREVIEW_W - PREVIEW_GAP;

    // Prefer right; flip left only when right would clip; clamp to edge margin
    const fitsRight = rightSide + PREVIEW_W <= vw - EDGE_MARGIN;
    const rawLeft   = fitsRight ? rightSide : leftSide;
    left = Math.max(EDGE_MARGIN, Math.min(rawLeft, vw - PREVIEW_W - EDGE_MARGIN));

    // Vertically centered on the anchor, clamped within viewport
    top = previewRect.top + previewRect.height / 2 - PREVIEW_H / 2;
    top = Math.max(EDGE_MARGIN, Math.min(top, vh - PREVIEW_H - EDGE_MARGIN));
  }

  return (
    <>
      <span
        ref={ref}
        className={cn(
          "underline decoration-dotted underline-offset-2 decoration-border/70 cursor-default",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setPreviewRect(null)}
      >
        {label}
      </span>

      <AnimatePresence>
        {previewRect && (
          <motion.div
            className="pointer-events-none fixed z-50 rounded-md overflow-hidden border border-border/30"
            style={{
              left,
              top,
              width:  PREVIEW_W,
              height: PREVIEW_H,
              boxShadow:
                "0 8px 32px -4px hsl(var(--foreground) / 0.18), 0 2px 8px -2px hsl(var(--foreground) / 0.10)",
            }}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={imageSrc}
              alt={label}
              fill
              className="object-cover"
              sizes={`${PREVIEW_W}px`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
