import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { ZolaBadgeCard } from "@/components/ui/zola-badge-card";
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
    <>
      <section className="container flex flex-col items-center justify-center py-16 md:py-32 px-4 md:px-8 text-center space-y-6">
        <h1 className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
          {siteConfig.hero.headline}
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground">
          {siteConfig.hero.subheadline}
        </p>
        <Button asChild size="lg">
          <Link href={siteConfig.hero.cta.href}>{siteConfig.hero.cta.label}</Link>
        </Button>
      </section>

      <section className="bg-muted/50 border-t border-border">
        <div className="container max-w-3xl mx-auto py-20 px-4 md:px-8">
          <h2 className="font-squarepeg text-4xl md:text-5xl text-center mb-10">
            A note from Janelle
          </h2>
          <div className="space-y-6">
            {siteConfig.about.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-foreground/80 leading-relaxed text-lg">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Button asChild size="lg" variant="outline">
              <Link href={siteConfig.about.cta.href}>{siteConfig.about.cta.label}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 px-4 md:px-8">
        <ZolaBadgeCard zola={siteConfig.zola} className="max-w-4xl mx-auto" />
      </section>

      <section className="container py-16 px-4 md:px-8">
        <EtsyStoreCard store={siteConfig.etsyStore} className="max-w-4xl mx-auto" />
      </section>

    </>
  );
}
