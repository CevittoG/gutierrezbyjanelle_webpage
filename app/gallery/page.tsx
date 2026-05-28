import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { GalleryContent } from "./_content";

const galleryDescription =
  "Recent invitations, signage, and event pieces by Janelle. A look at the work, hand to hand.";

export const metadata: Metadata = {
  title: "Gallery",
  description: galleryDescription,
  openGraph: {
    url: `${siteConfig.url}/gallery`,
    title: `Gallery | ${siteConfig.name}`,
    description: galleryDescription,
  },
};

export default function GalleryPage() {
  return <GalleryContent />;
}
