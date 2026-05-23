import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EtsyStoreCard } from "@/components/ui/etsy-store-card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Weddings",
  description: `A personal note to brides from Janelle — your wedding stationery and signage designer.`,
  openGraph: {
    url: `${siteConfig.url}/weddings`,
    title: `Weddings | ${siteConfig.name}`,
    description: `A personal note to brides from Janelle — your wedding stationery and signage designer.`,
  },
};

export default function WeddingsPage() {
  return (
    <>
      <section className="container flex flex-col items-center justify-center py-24 px-4 md:px-8 text-center space-y-4">
        <h1 className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
          For the Brides
        </h1>
        <p className="max-w-[500px] text-lg text-muted-foreground">
          A little message from me to you, before we begin.
        </p>
      </section>

      <section className="bg-muted/50 border-t border-border">
        <div className="container max-w-3xl mx-auto py-20 px-4 md:px-8">
          <h2 className="font-squarepeg text-4xl md:text-5xl text-center mb-10">
            A note from Janelle
          </h2>
          <div className="space-y-6">
            {siteConfig.weddings.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-foreground/80 leading-relaxed text-lg">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Ornamental divider */}
          <div className="flex items-center gap-3 my-10" aria-hidden="true">
            <div className="flex-1 h-px bg-accent/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            <div className="w-1 h-1 rounded-full bg-accent/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            <div className="flex-1 h-px bg-accent/40" />
          </div>

          <div className="flex justify-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/investment">Invest in your event</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 px-4 md:px-8">
        <EtsyStoreCard store={siteConfig.etsyStore} className="max-w-4xl mx-auto" />
      </section>
    </>
  );
}
