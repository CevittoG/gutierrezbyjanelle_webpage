import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { WeddingsContent } from "./_content";

const pageDescription = `A personal note from Janelle to brides and grooms, your wedding stationery and signage designer.`;
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
  return <WeddingsContent />;
}
