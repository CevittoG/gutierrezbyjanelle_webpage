import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { HomeContent } from "./_home-content";

export const metadata: Metadata = {
  title: { absolute: siteConfig.name },
  description: siteConfig.description,
  openGraph: {
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function HomePage() {
  return <HomeContent />;
}
