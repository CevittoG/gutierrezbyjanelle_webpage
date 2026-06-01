import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { GalleryContent } from "./_content";

const pageDescription =
  "Recent invitations, signage, and event pieces by Janelle. A look at the work, hand to hand.";
const pageTitle = `Gallery | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/gallery`;

export const metadata: Metadata = {
  title: "Gallery",
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

export default function GalleryPage() {
  return <GalleryContent />;
}
