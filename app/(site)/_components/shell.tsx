"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Mail } from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/concepts/icons";
import { usePathname } from "next/navigation";
import { LocaleToggle } from "@/components/locale-toggle";
import { useConceptNav, useContactLinks, usePick, externalProps } from "@/components/concepts/use-concept";
import { conceptCopy } from "@/config/concepts";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/utils";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const nav = useConceptNav();
  const contacts = useContactLinks();
  const p = usePick();
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [email, instagram] = contacts;

  return (
    <div className="site-root min-h-screen pb-20 md:pb-0">
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500",
          scrolled ? "border-b border-border bg-background/85 backdrop-blur-md" : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label={siteConfig.name}>
            <Image src="/logo.svg" alt="" width={44} height={44} className="h-10 w-10 md:h-11 md:w-11" priority />
            <span className="hidden font-squarepeg text-3xl leading-none sm:inline">{siteConfig.name}</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[11px] tracking-[0.18em] lg:flex" aria-label="Main">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className="site-navlink">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <a
              href={email.href}
              className="hidden rounded-[3px] bg-accent px-4 py-2.5 text-[11px] tracking-[0.16em] text-accent-foreground transition-colors hover:bg-[hsl(var(--accent-deep))] md:inline-flex"
            >
              {t("cta.emailJanelle")}
            </a>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-border lg:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={p(open ? conceptCopy.close : conceptCopy.menu)}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div
          id="site-menu"
          className={cn(
            "grid overflow-hidden border-border bg-background/95 backdrop-blur-md transition-all duration-500 lg:hidden",
            open ? "grid-rows-[1fr] border-b" : "grid-rows-[0fr]"
          )}
        >
          <nav className="min-h-0" aria-label="Mobile">
            <ul className="flex flex-col px-6 py-2">
              {nav.map((item, i) => (
                <li key={item.href} className="border-b border-border/60 last:border-0">
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className="flex items-baseline justify-between py-4 font-squarepeg text-4xl"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    {item.label}
                    <span className="font-anybody text-[10px] tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {children}

      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
          <div>
            <p className="font-squarepeg text-6xl leading-none">{t("cta.talkSoon")}</p>
            <p className="font-anybody-prose mt-4 max-w-sm text-primary-foreground/75">{p(siteConfig.hero.subheadline)}</p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-3 text-[11px] tracking-[0.18em]">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="w-fit hover:text-[hsl(var(--accent-light))]">{item.label}</Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 text-[11px] tracking-[0.18em]">
            {contacts.map((c) => (
              <a key={c.id} href={c.href} {...externalProps(c.external)} className="w-fit hover:text-[hsl(var(--accent-light))]">
                {c.label}
              </a>
            ))}
            <span className="mt-2 normal-case tracking-normal text-primary-foreground/60">{siteConfig.contactEmail}</span>
          </div>
        </div>
        <div className="border-t border-primary-foreground/15 px-4 py-6 text-center text-[10px] tracking-[0.2em] text-primary-foreground/60">
          © {new Date().getFullYear()} {siteConfig.name} · {t("footer.tagline")}
        </div>
      </footer>

      {/* Sticky mobile CTA — the two ways to start a conversation, always in reach */}
      <div className="site-sticky fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-border bg-background/90 p-3 backdrop-blur-md md:hidden">
        <a href={email.href} className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-accent text-[11px] tracking-[0.14em] text-accent-foreground">
          <Mail className="h-4 w-4" aria-hidden="true" /> {email.short}
        </a>
        <a href={instagram.href} {...externalProps(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-foreground/25 text-[11px] tracking-[0.14em]">
          <Instagram className="h-4 w-4" aria-hidden="true" /> {instagram.short}
        </a>
      </div>
    </div>
  );
}
