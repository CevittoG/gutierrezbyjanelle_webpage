import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { AboutContent } from "./_content";

const pageDescription = `Meet Janelle Gutiérrez, the designer and founder behind ${siteConfig.name}.`;
const pageTitle = `About | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/about`;

export const metadata: Metadata = {
  title: "About",
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

export default function AboutPage() {
  return <AboutContent />;
}
