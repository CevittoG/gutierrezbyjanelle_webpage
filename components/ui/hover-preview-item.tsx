"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/utils";

const PREVIEW_W = 160;
const PREVIEW_H = 200;

interface HoverPreviewItemProps {
  label: string;
  /** Portfolio image path. If omitted, renders plain text with no interaction. */
  imageSrc?: string;
  className?: string;
}

/**
 * HoverPreviewItem — a feature label that floats a portfolio image on hover.
 *
 * - No imageSrc → plain <span>, no visual change.
 * - With imageSrc → dotted underline; hovering shows a fixed-position
 *   portrait preview anchored to the right of the element (flips left if
 *   near the viewport edge).
 *
 * Uses position:fixed so it escapes any parent overflow:hidden without
 * needing a React portal.
 *
 * Reusable: import wherever feature lists, captions, or inline labels
 * reference a stationery item. Pair with getFeaturePreview() from
 * config/item-previews.ts to auto-resolve images from labels.
 */
export function HoverPreviewItem({
  label,
  imageSrc,
  className,
}: HoverPreviewItemProps) {
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  if (!imageSrc) {
    return <span className={className}>{label}</span>;
  }

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
    const rightSide = previewRect.right + 12;
    const leftSide = previewRect.left - PREVIEW_W - 12;
    left =
      rightSide + PREVIEW_W > window.innerWidth - 16 ? leftSide : rightSide;
    top =
      previewRect.top +
      previewRect.height / 2 -
      PREVIEW_H / 2;
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
              width: PREVIEW_W,
              height: PREVIEW_H,
              boxShadow:
                "0 8px 32px -4px hsl(var(--foreground) / 0.18), 0 2px 8px -2px hsl(var(--foreground) / 0.10)",
            }}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
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
