"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { conceptVersions } from "@/config/concepts";
import { conceptHref, stripConcept } from "./use-concept";
import { cn } from "@/utils";

/**
 * Floating pill that jumps to the same page in another concept (or the live
 * site). Only exists to make side-by-side comparison easy.
 */
export function ConceptSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const page = stripConcept(pathname);
  const current = pathname?.match(/^\/v([123])/)?.[1];

  return (
    <nav aria-label="Design concepts" className={cn("concept-switcher", className)}>
      <span className="px-2 opacity-70">Concept</span>
      <Link href={page} className="concept-switcher-link">Live</Link>
      {conceptVersions.map(({ version, name }) => (
        <Link
          key={version}
          href={conceptHref(version, page)}
          title={name}
          aria-current={current === String(version) ? "page" : undefined}
          className="concept-switcher-link"
        >
          V{version}
        </Link>
      ))}
    </nav>
  );
}
