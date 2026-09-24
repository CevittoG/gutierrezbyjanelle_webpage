"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/concepts/reveal";
import { externalProps, useContactLinks } from "@/components/concepts/use-concept";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";

/** Splits a line into words that rise one after another. */
export function SplitWords({ text, className, italicLast }: { text: string; className?: string; italicLast?: number }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${text}-${i}`} className="v2-word" aria-hidden="true">
          <span style={{ "--i": i } as React.CSSProperties} className={cn(italicLast && i >= words.length - italicLast && "v2-italic text-primary")}>
            {w}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("v2-kicker text-primary", className)}>{children}</p>;
}

export function Chapter({ n, title, className }: { n: string; title: string; className?: string }) {
  return (
    <Reveal className={cn("flex items-baseline gap-4", className)}>
      <span className="v2-italic text-lg text-accent">{n}</span>
      <span className="v2-rule w-12 translate-y-[-4px]" />
      <span className="v2-kicker">{title}</span>
    </Reveal>
  );
}

export function V2Button({ href, children, variant = "solid", className, external }: { href: string; children: ReactNode; variant?: "solid" | "ghost"; className?: string; external?: boolean }) {
  const cls = cn(
    "group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 text-sm font-semibold transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:bg-foreground hover:px-9"
      : "border border-foreground/25 hover:border-primary hover:bg-primary hover:text-primary-foreground",
    className
  );
  if (href.startsWith("/") || href.startsWith("#")) return <Link href={href} className={cls}>{children}</Link>;
  return <a href={href} className={cls} {...externalProps(!!external)}>{children}</a>;
}

/** The closing spread: one enormous line and every way to reach Janelle. */
export function V2Cta({ heading, body }: { heading?: ReactNode; body?: string }) {
  const { t } = useLocale();
  const [email, ...rest] = useContactLinks();
  return (
    <section className="bg-primary px-4 py-24 text-primary-foreground md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="v2-serif text-[13vw] font-light leading-[0.9] tracking-tight md:text-[8.5rem]">
          {heading ?? (
            <>
              {t("home.cta.heading")} <span className="v2-italic text-accent">{t("home.cta.headingItalic")}</span> {t("home.cta.headingTail")}
            </>
          )}
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <Reveal delay={150} as="p" className="max-w-xl text-lg leading-relaxed text-primary-foreground/80">
            {body ?? t("home.cta.body")}
          </Reveal>
          <Reveal delay={250} className="flex flex-col gap-3">
            <a href={email.href} className="v2-italic group flex items-center gap-3 text-3xl md:text-4xl">
              <span className="v2-link">{email.label}</span>
              <ArrowUpRight className="h-7 w-7 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {rest.map((l) => (
                <a key={l.id} href={l.href} {...externalProps(l.external)} className="v2-link text-primary-foreground/80 hover:text-primary-foreground">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function V2PageTitle({ kicker, title, standfirst }: { kicker?: string; title: string; standfirst?: string }) {
  return (
    <header className="px-4 pb-16 pt-14 md:px-10 md:pt-24">
      <div className="mx-auto max-w-6xl">
        {kicker && <Kicker className="mb-6">{kicker}</Kicker>}
        <h1 className="v2-serif text-[15vw] font-light leading-[0.88] tracking-tight md:text-[8rem]" key={title}>
          <SplitWords text={title} italicLast={1} />
        </h1>
        {standfirst && (
          <Reveal delay={300} as="p" className="mt-10 max-w-2xl text-xl leading-relaxed text-muted-foreground md:ml-[30%]">
            {standfirst}
          </Reveal>
        )}
      </div>
    </header>
  );
}
