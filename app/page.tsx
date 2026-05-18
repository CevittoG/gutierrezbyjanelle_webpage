import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: siteConfig.name },
  description: siteConfig.description,
  openGraph: {
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function HomePage() {
  return (
    <section className="container flex flex-col items-center justify-center py-32 px-4 md:px-8 text-center space-y-6">
      <h1 className="font-shadows text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
        {siteConfig.hero.headline}
      </h1>
      <p className="max-w-[600px] text-lg text-muted-foreground">
        {siteConfig.hero.subheadline}
      </p>
      <Button asChild size="lg">
        <Link href={siteConfig.hero.cta.href}>{siteConfig.hero.cta.label}</Link>
      </Button>
    </section>
  );
}
