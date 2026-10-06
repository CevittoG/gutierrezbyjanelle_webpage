import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteGallery } from "../_components/gallery";

const pageDescription =
  "Real client work by Janelle Gutiérrez: wedding welcome signs, ceremony programs, drink toppers, bar signs, shower games and invitations, each designed from scratch.";
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
  return <SiteGallery />;
}
