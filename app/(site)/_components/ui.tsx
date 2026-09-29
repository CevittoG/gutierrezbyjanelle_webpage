"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { ContactIcon } from "@/components/concepts/icons";
import { Reveal } from "@/components/concepts/reveal";
import { externalProps, useContactLinks, type ContactLink } from "@/components/concepts/use-concept";
import { cn } from "@/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] tracking-[0.22em] text-ring flex items-center gap-3", className)}>
      <span aria-hidden="true" className="h-px w-8 bg-accent/60" />
      {children}
    </p>
  );
}

export function SiteButton({
  href,
  children,
  variant = "solid",
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "seal";
  external?: boolean;
  className?: string;
}) {
  const styles = {
    solid: "bg-primary text-primary-foreground hover:bg-foreground",
    outline: "border border-foreground/30 bg-card/60 hover:border-accent hover:text-accent",
    seal: "bg-accent text-accent-foreground hover:bg-[hsl(var(--accent-deep))]",
  }[variant];
  const cls = cn(
    "group inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-5 py-3 text-xs tracking-[0.14em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    styles,
    className
  );
  const isInternal = href.startsWith("/") && !external;
  return isInternal ? (
    <Link href={href} className={cls}>{children}</Link>
  ) : (
    <a href={href} className={cls} {...externalProps(!!external)}>{children}</a>
  );
}

export function ContactRow({ className, only }: { className?: string; only?: ContactLink["id"][] }) {
  const links = useContactLinks().filter((l) => !only || only.includes(l.id));
  return (
    <div className={cn("flex flex-wrap justify-center gap-3", className)}>
      {links.map((l, i) => {
        return (
          <SiteButton key={l.id} href={l.href} external={l.external} variant={i === 0 ? "seal" : "outline"}>
            <ContactIcon id={l.id} className="h-4 w-4" />
            {l.label}
            {l.external && <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />}
          </SiteButton>
        );
      })}
    </div>
  );
}

/** Janelle's monogram, for pressing into a `.site-seal`. Decorative. */
export function LogoMark({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("site-logo-mark", className)} />;
}

export function CtaBlock({ heading, body, className }: { heading: ReactNode; body: string; className?: string }) {
  return (
    <section className={cn("px-4 py-24 md:py-32", className)}>
      <Reveal className="site-paper site-stitch relative mx-auto max-w-3xl rounded-[4px] border border-border px-6 py-16 text-center md:px-16">
        <div className="site-seal absolute -top-8 left-1/2 h-16 w-16 -translate-x-1/2">
          <LogoMark />
        </div>
        <h2 className="font-squarepeg text-5xl leading-none md:text-6xl">{heading}</h2>
        <p className="font-anybody-prose mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{body}</p>
        <ContactRow className="mt-10" />
      </Reveal>
    </section>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="px-4 pb-12 pt-16 text-center md:pt-24">
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-squarepeg text-6xl leading-[0.95] text-balance md:text-8xl">{title}</h1>
        {intro && <p className="font-anybody-prose max-w-[55ch] text-lg leading-relaxed text-muted-foreground">{intro}</p>}
      </Reveal>
    </header>
  );
}
