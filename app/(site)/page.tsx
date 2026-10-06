import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteHome } from "./_components/home";

const homeTitle = `${siteConfig.name} · Custom Wedding & Event Stationery, Austin & Long Island`;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: siteConfig.alternateLocales,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: homeTitle,
    description: siteConfig.description,
    images: siteConfig.ogImages,
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: siteConfig.description,
    images: siteConfig.twitterImages,
  },
};

export default function HomePage() {
  return <SiteHome />;
}
