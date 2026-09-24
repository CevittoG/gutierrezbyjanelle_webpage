"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LocaleToggle } from "@/components/locale-toggle";
import { ConceptSwitcher } from "@/components/concepts/concept-switcher";
import { externalProps, useConceptNav, useContactLinks, usePick } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";

export function V3Shell({ children }: { children: React.ReactNode }) {
  const nav = useConceptNav(3);
  const contacts = useContactLinks();
  const p = usePick();
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="v3-root min-h-screen">
      <header className="fixed inset-x-0 top-3 z-50 px-3 md:top-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border-2 border-foreground bg-card/85 py-1.5 pl-2 pr-2 shadow-[3px_3px_0_hsl(var(--foreground))] backdrop-blur-md">
          <Link href="/v3" className="v3-wiggle flex shrink-0 items-center gap-2 rounded-full pr-2" aria-label={siteConfig.name}>
            <Image src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10 rounded-full bg-background" priority />
            <span className="v3-serif hidden text-2xl leading-none xl:inline">{siteConfig.name}</span>
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-0.5 text-sm font-semibold">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={item.active ? "page" : undefined} className="v3-navlink">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleToggle className="font-semibold" />
            <a href={contacts[0].href} className="hidden rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-rotate-2 md:inline-flex">
              {t("cta.emailJanelle")}
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="v3-menu"
              aria-label={p(open ? conceptCopy.close : conceptCopy.menu)}
              className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="v3-menu" aria-label="Mobile" className="v3-card v3-pop mx-auto mt-3 max-w-5xl bg-card p-3 lg:hidden">
            <ul className="grid grid-cols-2 gap-2">
              {nav.map((item, i) => (
                <li key={item.href} className="v3-pop" style={{ "--i": i } as React.CSSProperties}>
                  <Link
                    href={item.href}
                    className={cn("flex h-20 items-end rounded-[20px] p-4 text-xl font-bold", item.active ? "bg-foreground text-background" : i % 2 ? "bg-muted" : "bg-background")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {children}

      <footer className="mt-10 rounded-t-[40px] bg-foreground px-4 pb-10 pt-16 text-background md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="v3-serif text-[16vw] leading-[0.85] md:text-[9.5rem]">{siteConfig.name}</p>
          <div className="mt-12 grid gap-10 border-t border-background/20 pt-10 md:grid-cols-3">
            <p className="max-w-xs text-background/75">{p(siteConfig.hero.subheadline)}</p>
            <ul className="flex flex-wrap gap-2 md:flex-col md:gap-1">
              {nav.map((item) => (
                <li key={item.href}><Link href={item.href} className="rounded-full px-2 py-1 font-semibold hover:bg-background/10">{item.label}</Link></li>
              ))}
            </ul>
            <ul className="flex flex-col gap-1">
              {contacts.map((c) => (
                <li key={c.id}><a href={c.href} {...externalProps(c.external)} className="rounded-full px-2 py-1 font-semibold hover:bg-background/10">{c.label} ↗</a></li>
              ))}
              <li className="px-2 pt-2 text-sm text-background/60">{siteConfig.contactEmail}</li>
            </ul>
          </div>
          <p className="mt-12 text-sm text-background/50">© {new Date().getFullYear()} {siteConfig.name} · {t("footer.tagline")}</p>
        </div>
      </footer>
      <ConceptSwitcher />
    </div>
  );
}
