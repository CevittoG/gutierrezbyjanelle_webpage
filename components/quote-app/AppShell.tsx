"use client";

// Slim app chrome for the gated quote tools (dashboard, calculator, detail).
// Replaces the public marketing header/footer on these routes so the surface
// reads as an app, not a landing page. Sign-out hits the existing
// DELETE /api/quote-auth handler — no new functionality.

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils";

const NAV = [
  {
    href: "/quotes",
    label: "Dashboard",
    match: (p: string) => p === "/quotes" || (p.startsWith("/quotes/") && !p.startsWith("/quotes/prices")),
  },
  { href: "/quote/new", label: "New quote", match: (p: string) => p.startsWith("/quote/new") },
  { href: "/quotes/prices", label: "Price book", match: (p: string) => p.startsWith("/quotes/prices") },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/quote-auth", { method: "DELETE", credentials: "same-origin" });
    } catch {
      /* ignore — we refresh regardless so the gate re-asserts */
    }
    router.push("/quotes");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 sm:gap-4 px-4 md:px-6">
          <Link href="/quotes" aria-label="Studio dashboard" className="hidden sm:flex items-center gap-2 shrink-0">
            <Image src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <span className="hidden sm:inline font-squarepeg text-2xl leading-none">Studio</span>
          </Link>

          <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1 text-sm overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Quote tools">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "h-11 px-2 sm:px-3 inline-flex items-center whitespace-nowrap rounded-md normal-case tracking-normal transition-colors",
                    active
                      ? "text-foreground underline decoration-accent decoration-2 underline-offset-[6px]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden md:inline text-[11px] uppercase tracking-widest text-muted-foreground">
              {siteConfig.name}
            </span>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="h-11 w-11 sm:w-auto sm:px-3 inline-flex items-center justify-center gap-2 rounded-md border border-border text-sm normal-case tracking-normal text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
