"use client";

import Link from "next/link";
import { useId, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { ContactIcon } from "@/components/concepts/icons";
import { Reveal } from "@/components/concepts/reveal";
import { externalProps, useContactLinks } from "@/components/concepts/use-concept";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";

export function Pill({ href, children, variant = "cherry", className, external }: { href: string; children: ReactNode; variant?: "cherry" | "cream" | "ink" | "blush"; className?: string; external?: boolean }) {
  const colors = {
    cherry: "bg-primary text-primary-foreground",
    cream: "bg-card text-foreground",
    ink: "bg-foreground text-background",
    blush: "bg-muted text-foreground",
  }[variant];
  const cls = cn("v3-pill", colors, className);
  if (href.startsWith("/") || href.startsWith("#")) return <Link href={href} className={cls}>{children}</Link>;
  return <a href={href} className={cls} {...externalProps(!!external)}>{children}</a>;
}

/** Circular text badge that slowly spins. */
export function Sticker({ text, center, className }: { text: string; center?: ReactNode; className?: string }) {
  const id = useId().replace(/:/g, "");
  const label = `${text} ✦ ${text} ✦ `;
  return (
    <div className={cn("v3-sticker relative grid h-28 w-28 place-items-center rounded-full border-2 border-foreground bg-card", className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full p-1">
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current text-[10.5px] font-semibold uppercase tracking-[0.12em]">
          <textPath href={`#${id}`}>{label}</textPath>
        </text>
      </svg>
      <span className="relative text-2xl">{center ?? "✦"}</span>
    </div>
  );
}

/** Tilts toward the pointer. */
export function Tilt({ children, className, rotate = 0, style }: { children: ReactNode; className?: string; rotate?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", `${x * 10}deg`);
    ref.current.style.setProperty("--rx", `${-y * 10}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--ry", "0deg");
    ref.current?.style.setProperty("--rx", "0deg");
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("v3-tilt", className)} style={{ ...style, "--rot": `${rotate}deg` } as CSSProperties}>
      {children}
    </div>
  );
}

export function ContactPills({ className, light }: { className?: string; light?: boolean }) {
  const links = useContactLinks();
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {links.map((l, i) => (
        <Pill key={l.id} href={l.href} external={l.external} variant={i === 0 ? "cherry" : light ? "cream" : "blush"}>
          <ContactIcon id={l.id} className="h-4 w-4" />
          {l.label}
        </Pill>
      ))}
    </div>
  );
}

export function V3Cta({ heading, body }: { heading?: ReactNode; body?: string }) {
  const { t } = useLocale();
  return (
    <section className="px-4 py-20 md:px-10">
      <Reveal variant="scale" className="v3-card relative mx-auto max-w-6xl overflow-hidden bg-foreground px-6 py-16 text-background md:px-16 md:py-24">
        <Sticker text={t("cta.talkSoon")} center="✉" className="absolute -right-4 -top-4 hidden text-foreground md:grid" />
        <h2 className="v3-display max-w-4xl text-6xl md:text-8xl">
          {heading ?? (
            <>
              {t("home.cta.heading")} <span className="v3-serif font-normal text-muted">{t("home.cta.headingItalic")}</span> {t("home.cta.headingTail")}
            </>
          )}
        </h2>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-background/80">{body ?? t("home.cta.body")}</p>
        <ContactPills light className="mt-10 text-foreground" />
      </Reveal>
    </section>
  );
}

export function V3PageTitle({ eyebrow, title, intro, children }: { eyebrow?: string; title: ReactNode; intro?: string; children?: ReactNode }) {
  return (
    <header className="px-4 pb-12 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-6xl">
        {eyebrow && (
          <p className="v3-pop mb-6 inline-flex rounded-full border-2 border-foreground bg-card px-4 py-1.5 text-sm font-semibold">{eyebrow}</p>
        )}
        <h1 className="v3-display v3-pop text-[15vw] md:text-[7.5rem]" style={{ "--i": 1 } as CSSProperties}>{title}</h1>
        {intro && (
          <p className="v3-pop mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground" style={{ "--i": 2 } as CSSProperties}>{intro}</p>
        )}
        {children}
      </div>
    </header>
  );
}
