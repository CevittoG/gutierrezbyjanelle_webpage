import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { StructuredData } from "@/components/structured-data";
import { faqJsonLd } from "@/lib/structured-data";
import { SiteFaq } from "../_components/faq";

const pageDescription = `Answers about ${siteConfig.name}: custom wedding and event stationery from Austin, TX and Long Island, NY, bilingual English–Spanish design, what a suite includes, how quotes work and US-wide shipping.`;
const pageTitle = `Questions, answered | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/faq`;

export const metadata: Metadata = {
  title: "Questions, answered",
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: siteConfig.alternateLocales,
    url: pageUrl,
    siteName: siteConfig.name,
    title: pageTitle,
    description: pageDescription,
    images: siteConfig.ogImages,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: siteConfig.twitterImages,
  },
};

export default function FaqPage() {
  return (
    <>
      <StructuredData data={faqJsonLd()} />
      <SiteFaq />
    </>
  );
}
