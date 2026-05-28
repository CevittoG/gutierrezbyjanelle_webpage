"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LocaleToggle } from "@/components/locale-toggle";
import { useLocale } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLocale();

  const navLabel = (item: { title: string; i18nKey?: string }) =>
    item.i18nKey ? t(item.i18nKey as TranslationKey) : item.title;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" aria-label="Go to homepage" className="flex items-center space-x-2">
          <Image
            src="/logo.svg"
            alt={siteConfig.name}
            width={48}
            height={48}
            priority
            className="h-12 w-12 object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors",
                  pathname === item.href
                    ? "text-foreground underline decoration-accent decoration-2 underline-offset-4"
                    : "text-foreground hover:text-foreground/70"
                )}
              >
                {navLabel(item)}
              </Link>
            ))}
          </nav>
          <span aria-hidden="true" className="h-5 w-px bg-border" />
          <LocaleToggle />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-6 mt-8">
              {siteConfig.mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-lg font-medium transition-colors",
                    pathname === item.href
                      ? "text-foreground underline decoration-accent decoration-2 underline-offset-4"
                      : "hover:text-foreground/70"
                  )}
                >
                  {navLabel(item)}
                </Link>
              ))}
            </nav>
            <div className="mt-10 pt-6 border-t border-border">
              <LocaleToggle />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
