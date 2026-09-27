import type { SVGProps } from "react";
import { Heart, Mail, ShoppingBag } from "lucide-react";

/** Lucide dropped brand icons, so Instagram is drawn here (same stroke style). */
export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/** One icon per conversion path (see `useContactLinks`). */
export function ContactIcon({ id, className }: { id: "email" | "instagram" | "etsy" | "zola"; className?: string }) {
  if (id === "instagram") return <InstagramIcon className={className} />;
  const Icon = id === "email" ? Mail : id === "etsy" ? ShoppingBag : Heart;
  return <Icon className={className} aria-hidden="true" />;
}
