"use client";

// Slim app chrome for the gated quote tools (dashboard, calculator, detail).
// Replaces the public marketing header/footer on these routes so the surface
// reads as an app, not a landing page. Sign-out hits the existing
// DELETE /api/quote-auth handler — no new functionality.

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils";

const NAV = [
  { href: "/quotes", label: "Dashboard", match: (p: string) => p === "/quotes" || p.startsWith("/quotes/") },
  { href: "/quote/new", label: "New quote", match: (p: string) => p.startsWith("/quote/new") },
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
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/quotes" aria-label="Studio dashboard" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <span className="hidden sm:inline font-squarepeg text-2xl leading-none">Studio</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm" aria-label="Quote tools">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "h-9 px-3 inline-flex items-center rounded-md normal-case tracking-normal transition-colors",
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

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden md:inline text-[11px] uppercase tracking-widest text-muted-foreground">
              {siteConfig.name}
            </span>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="h-9 px-3 rounded-md border border-border text-sm normal-case tracking-normal text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
