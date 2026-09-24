"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LocaleToggle } from "@/components/locale-toggle";
import { ConceptSwitcher } from "@/components/concepts/concept-switcher";
import { externalProps, useConceptNav, useContactLinks, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";

export function V2Shell({ children }: { children: React.ReactNode }) {
  const nav = useConceptNav(2);
  const contacts = useContactLinks();
  const p = usePick();
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 160 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="v2-root min-h-screen">
      <div aria-hidden="true" className="v2-progress fixed inset-x-0 top-0 z-[60] h-[2px] bg-accent" style={{ transform: "scaleX(0)" }} />
      <header data-hidden={hidden && !open} className={cn(
          "v2-header sticky top-0 border-b",
          open ? "z-[60] border-transparent bg-transparent text-primary-foreground [--foreground:40_50%_97%] [--muted-foreground:36_30%_78%]" : "z-50 border-foreground/10 bg-background/90 backdrop-blur-md"
        )}>
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 md:h-20 md:px-10">
          <div className="flex items-center gap-4">
            <LocaleToggle className="font-semibold" />
          </div>
          <Link href="/v2" className="v2-italic text-center text-2xl leading-none md:text-3xl">
            {siteConfig.name}
          </Link>
          <div className="flex items-center justify-end gap-5">
            <a href={contacts[0].href} className="v2-link hidden text-sm font-semibold md:inline">{t("cta.emailJanelle")}</a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="v2-menu"
              className="group relative z-[70] flex items-center gap-3 text-sm font-semibold"
            >
              <span className="hidden sm:inline">{p(open ? conceptCopy.close : conceptCopy.menu)}</span>
              <span className="relative block h-3 w-7" aria-hidden="true">
                <span className={cn("absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500", open && "translate-y-1.5 rotate-45")} />
                <span className={cn("absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500", open && "-translate-y-1.5 -rotate-45")} />
              </span>
              <span className="sr-only sm:hidden">{p(conceptCopy.menu)}</span>
            </button>
          </div>
        </div>
        <nav aria-label="Main" className={cn("hidden border-t border-foreground/10", !open && "lg:block")}>
          <ul className="mx-auto flex max-w-7xl items-center justify-center gap-10 py-3 text-[13px] font-medium">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={item.active ? "page" : undefined} className="v2-link">{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div id="v2-menu" data-open={open} className="v2-menu fixed inset-0 z-[55] flex flex-col bg-primary px-6 pb-10 pt-28 text-primary-foreground md:px-16" aria-hidden={!open}>
        <figure aria-hidden="true" className="absolute right-16 top-1/2 hidden w-[26vw] max-w-sm -translate-y-1/2 lg:block">
          <div className={cn("relative aspect-[4/5] overflow-hidden", open && "v2-curtain")} style={{ "--d": "0.45s" } as React.CSSProperties}>
            <Image src="/gallery/birthday-invitation.jpeg" alt="" fill sizes="26vw" className="object-cover" />
          </div>
        </figure>
        <ul className="flex flex-1 flex-col justify-center gap-1">
          {nav.map((item, i) => (
            <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={item.href}
                tabIndex={open ? 0 : -1}
                className="group flex items-baseline gap-5 py-1"
              >
                <span className="v2-italic w-8 text-base text-accent">0{i + 1}</span>
                <span className={cn("v2-serif text-5xl font-light transition-all duration-500 group-hover:translate-x-3 group-hover:italic md:text-7xl", item.active && "italic text-accent")}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {contacts.map((c) => (
            <a key={c.id} href={c.href} tabIndex={open ? 0 : -1} {...externalProps(c.external)} className="v2-link opacity-80 hover:opacity-100">{c.label}</a>
          ))}
        </div>
      </div>

      {children}

      <footer className="border-t border-foreground/10 px-4 py-14 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="v2-italic text-4xl">{siteConfig.name}</p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{p(siteConfig.hero.subheadline)}</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {nav.map((item) => <li key={item.href}><Link href={item.href} className="v2-link">{item.label}</Link></li>)}
          </ul>
          <ul className="flex flex-col gap-2 text-sm">
            {contacts.map((c) => <li key={c.id}><a href={c.href} {...externalProps(c.external)} className="v2-link">{c.label}</a></li>)}
            <li className="mt-2 text-muted-foreground">{siteConfig.contactEmail}</li>
          </ul>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-between gap-4 border-t border-foreground/10 pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          <span>{p(conceptCopy.issue)}</span>
        </div>
      </footer>
      <ConceptSwitcher />
    </div>
  );
}
