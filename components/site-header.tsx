import Link from "next/link";
import { siteConfig } from "../config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl tracking-tight">{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/70 text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}