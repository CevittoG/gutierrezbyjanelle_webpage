"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
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
 * HoverPreviewItem — a feature label that shows a portfolio image preview.
 *
 * - No imageSrc → plain <span>, no visual change.
 * - Hover-capable devices (desktop) → dotted underline; hovering shows a
 *   fixed-position preview anchored to the right of the element (flips left
 *   if near the viewport edge, clamped on both axes).
 * - Touch / non-hover devices (mobile) → dotted underline; tapping opens a
 *   centered lightbox modal via React portal. Dismissible via tap-outside,
 *   X button, or Escape key.
 *
 * The frame aspect ratio adapts to `orientation`:
 *   "portrait"  → tall frame (default — invites, cards, etc.)
 *   "landscape" → wide frame (RSVP cards, save-the-dates, etc.)
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
  // Start false (SSR-safe). Set after hydration — true only on hover-capable
  // devices (mice, trackpads — not touch screens).
  const [supportsHover, setSupportsHover] = useState(false);
  // SSR guard: portal requires a mounted DOM; stay false on server.
  const [mounted, setMounted] = useState(false);
  // Mobile lightbox open state.
  const [modalOpen, setModalOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Hydration: detect hover capability and mark component as mounted
  useEffect(() => {
    setMounted(true);
    setSupportsHover(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  // Body scroll-lock + Escape key dismiss while mobile lightbox is open
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  // ── No image → plain text on all devices ──────────────────────────────────
  if (!imageSrc) {
    return <span className={className}>{label}</span>;
  }

  // ── MOBILE BRANCH (touch / non-hover device) ───────────────────────────────
  if (!supportsHover) {
    // Before hydration: render plain text (SSR-safe, avoids mismatch)
    if (!mounted) return <span className={className}>{label}</span>;

    return (
      <>
        {/* Tappable trigger — <button> for semantics; styled as inline text */}
        <button
          type="button"
          aria-label={`View preview of ${label}`}
          onClick={() => setModalOpen(true)}
          className={cn(
            "underline decoration-dotted underline-offset-2 decoration-border/70",
            "cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit",
            "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
            className
          )}
        >
          {label}
        </button>

        {/* Portal: renders into document.body to escape any parent overflow:hidden */}
        {createPortal(
          <AnimatePresence>
            {modalOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="mobile-backdrop"
                  className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={() => setModalOpen(false)}
                  aria-hidden="true"
                />

                {/* Centered card wrapper — pointer-events-none lets backdrop clicks through */}
                <motion.div
                  key="mobile-card-wrapper"
                  className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label={label}
                    className={cn(
                      "relative pointer-events-auto bg-card border border-border rounded-lg overflow-hidden",
                      orientation === "landscape"
                        ? "w-[min(80vw,320px)]"
                        : "w-[min(70vw,260px)]"
                    )}
                    style={{
                      aspectRatio:
                        orientation === "landscape"
                          ? `${LANDSCAPE_W} / ${LANDSCAPE_H}`
                          : `${PORTRAIT_W} / ${PORTRAIT_H}`,
                      boxShadow:
                        "0 8px 32px -4px hsl(var(--foreground) / 0.22), 0 2px 8px -2px hsl(var(--foreground) / 0.12)",
                    }}
                    initial={{ scale: 0.92, y: 24 }}
                    animate={{ scale: 1,    y: 0  }}
                    exit={{    scale: 0.88, y: 16 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src={imageSrc}
                      alt={label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 480px) 70vw, 260px"
                    />

                    {/* Close button */}
                    <button
                      type="button"
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      aria-label="Close preview"
                      onClick={() => setModalOpen(false)}
                      className={cn(
                        "absolute top-2 right-2 z-10 flex items-center justify-center",
                        "h-7 w-7 rounded-full bg-card/80 border border-border/60 backdrop-blur-sm",
                        "text-foreground/70 hover:text-foreground transition-colors duration-150",
                        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                      )}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  // ── DESKTOP BRANCH (hover-capable devices) ────────────────────────────────

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
