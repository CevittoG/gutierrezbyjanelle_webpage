import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { StationeryHero } from "@/components/ui/hero-section";
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
    <div className="relative">
      {/* Fixed background logo — stays still while content scrolls over it */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none flex items-center justify-center"
        aria-hidden="true"
      >
        <Image
          src="/logo.svg"
          alt=""
          width={1100}
          height={1100}
          priority
          className="opacity-20 object-contain w-[80vw] max-w-[900px] h-auto"
        />
      </div>

      {/* Hero: two vertical invitation-style cards */}
      <StationeryHero
        title={siteConfig.hero.headline}
        description="Custom invitations, décor, signs, and digital resources crafted with love for the moments that matter most."
        buttonText="Invest in your event"
        buttonLink="/investment"
        imageUrl1="/invitation/invite-4.png"
        imageUrl2="/invitation/invite-3.png"
      />

      {/* About */}
      <section className="section-panel">
        <div className="container max-w-3xl mx-auto py-24 px-4 md:px-8">
          <h2 className="font-squarepeg text-4xl md:text-5xl text-center mb-10">
            Welcome, <span className="italic">party people!</span>
          </h2>
          <div className="space-y-6">
            {siteConfig.about.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-foreground/85 leading-relaxed text-lg">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Button asChild size="lg" variant="outline">
              <Link href={siteConfig.about.cta.href}>
                {siteConfig.about.cta.label}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-panel">
        <div className="container max-w-2xl mx-auto py-24 px-4 md:px-8 text-center">
          <h2 className="font-squarepeg text-4xl md:text-5xl mb-6">
            Let&apos;s design <span className="italic">your</span> day.
          </h2>
          <p className="text-foreground/80 text-lg mb-8">
            Browse the gallery, peek at investment options, or send a note —
            I&apos;d love to hear about your event.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="outline">
              <Link href="/investment">Choose investment</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/gallery">View gallery</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
