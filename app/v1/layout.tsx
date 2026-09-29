import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConceptSwitcher } from "@/components/concepts/concept-switcher";
import "@/components/concepts/concepts.css";

// The previous live site ("Classic"), kept browsable at /v1 so it can be
// compared or restored. Hidden: noindex here, disallowed in robots.ts.
export const metadata: Metadata = {
  title: { default: `Classic | ${siteConfig.name}`, template: `%s · Classic | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default function ClassicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="classic-root flex min-h-screen flex-col">
      <SiteHeader basePath="/v1" />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <ConceptSwitcher />
    </div>
  );
}
