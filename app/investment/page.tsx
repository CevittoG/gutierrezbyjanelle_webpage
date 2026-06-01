import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { InvestmentContent } from "./_content";

const pageDescription = `View investment options for custom wedding stationery and event design by ${siteConfig.name}.`;
const pageTitle = `Investment | ${siteConfig.name}`;
const pageUrl = `${siteConfig.url}/investment`;

export const metadata: Metadata = {
  title: "Investment",
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

export default function InvestmentPage() {
  return <InvestmentContent />;
}
