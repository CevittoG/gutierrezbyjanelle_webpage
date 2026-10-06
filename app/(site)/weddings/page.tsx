import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteOccasion } from "../_components/occasion";

const pageDescription = `Custom wedding invitation suites, save the dates, ceremony programs and signs, designed from scratch in English, Spanish or both. Austin, TX and Long Island, NY, shipping across the US.`;
const pageTitle = `Weddings | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/weddings`;

export const metadata: Metadata = {
  title: "Weddings",
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

export default function WeddingsPage() {
  return <SiteOccasion kind="weddings" />;
}
