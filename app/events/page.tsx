import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { EventsContent } from "./_content";

const pageDescription = `Custom stationery and signage for graduations, showers, birthdays, quinceañeras, and corporate events by ${siteConfig.name}.`;
const pageTitle = `Events & Corporate | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/events`;

export const metadata: Metadata = {
  title: "Events & Corporate",
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

export default function EventsPage() {
  return <EventsContent />;
}
