"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/utils";

type RevealVariant = "up" | "fade" | "mask" | "scale" | "left" | "right";

interface RevealProps {
  as?: ElementType;
  variant?: RevealVariant;
  /** Stagger delay in ms. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
}

/**
 * Tiny scroll-reveal: one IntersectionObserver per element flips
 * `data-inview` once; the transition itself is plain CSS (concepts.css).
 * Reduced motion shows everything immediately.
 */
export function Reveal({ as: Tag = "div", variant = "up", delay = 0, className, style, children, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.inview = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.inview = "true";
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={variant}
      className={cn("reveal", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
