import { Instagram } from "lucide-react";
import { siteConfig } from "../config/site";

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-8">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} {siteConfig.name}. Designed for creatives.
        </p>
        <a
          href={siteConfig.instagram.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Instagram className="w-4 h-4" />
          @{siteConfig.instagram.handle}
        </a>
      </div>
    </footer>
  );
}
