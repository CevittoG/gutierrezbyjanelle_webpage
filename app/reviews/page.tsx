import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ReviewsContent } from "./_content";

export const metadata: Metadata = {
  title: "Reviews",
  description: `Read what clients say about ${siteConfig.name}. Real experiences from real clients.`,
  openGraph: {
    url: `${siteConfig.url}/reviews`,
    title: `Client Reviews | ${siteConfig.name}`,
    description: `Read what clients say about ${siteConfig.name}. Real experiences from real clients.`,
  },
};

export default function ReviewsPage() {
  return <ReviewsContent />;
}
