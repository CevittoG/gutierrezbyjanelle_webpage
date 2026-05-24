"use client";

import { useState, useRef } from "react";
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
const PREVIEW_GAP = 20;

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
 * - With imageSrc → dotted underline; hovering shows a fixed-position
 *   preview anchored to the right of the element (flips left if near the
 *   viewport edge).
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
  const ref = useRef<HTMLSpanElement>(null);

  if (!imageSrc) {
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
  // Flips to left side if it would overflow the viewport.
  let left = 0;
  let top = 0;
  if (previewRect) {
    const rightSide = previewRect.right + PREVIEW_GAP;
    const leftSide  = previewRect.left - PREVIEW_W - PREVIEW_GAP;
    left = rightSide + PREVIEW_W > window.innerWidth - 16 ? leftSide : rightSide;
    top  = previewRect.top + previewRect.height / 2 - PREVIEW_H / 2;
    // Clamp vertically
    top = Math.max(16, Math.min(top, window.innerHeight - PREVIEW_H - 16));
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
