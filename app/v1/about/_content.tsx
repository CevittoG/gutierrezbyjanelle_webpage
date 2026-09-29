"use client";

import { Button } from "@/components/ui/button";
import { FounderPortrait } from "@/components/ui/founder-portrait";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

export function AboutContent() {
  const { locale, t } = useLocale();

  return (
    <>
      <section className="container flex flex-col items-center justify-center pt-24 pb-12 px-4 md:px-8 text-center">
        <h1 className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance">
          {t("about.heading")}
        </h1>
      </section>

      <section className="container max-w-2xl mx-auto px-4 md:px-8 pb-20">
        <FounderPortrait className="mx-auto mb-12" />

        <div className="font-anybody-prose space-y-8 text-foreground text-lg leading-relaxed">
          {siteConfig.about.sections.map((section, i) => (
            <div key={i} className="space-y-4">
              {section.heading && (
                <h2 className="font-squarepeg text-2xl sm:text-3xl">
                  {pick(section.heading, locale)}
                </h2>
              )}
              {section.paragraphs.map((paragraph, j) => (
                <p key={j}>{pick(paragraph, locale)}</p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" variant="outline">
            <a
              href={siteConfig.instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              {t("cta.instagram")}
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
