import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteOccasion } from "../_components/occasion";

const pageDescription = `Custom invitations, menus and signs for quinceañeras, showers, birthdays, graduations, dinner parties and corporate events by ${siteConfig.name}. Bilingual design, Austin, TX and Long Island, NY, shipping across the US.`;
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
  return <SiteOccasion kind="events" />;
}
