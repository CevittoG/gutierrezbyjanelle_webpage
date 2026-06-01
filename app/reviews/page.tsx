import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ReviewsContent } from "./_content";

const pageDescription = `Read what clients say about ${siteConfig.name}. Real experiences from real clients.`;
const pageTitle = `Client Reviews | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/reviews`;

export const metadata: Metadata = {
  title: "Reviews",
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

export default function ReviewsPage() {
  return <ReviewsContent />;
}
