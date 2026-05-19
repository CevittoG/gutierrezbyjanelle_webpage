import type { Metadata } from "next";
import { ReviewCard } from "@/components/ui/review-card";
import { ZolaBadgeCard } from "@/components/ui/zola-badge-card";
import { siteConfig } from "@/config/site";

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
  return (
    <section className="container py-12 px-4 md:px-8">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
        <h1 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">Client Stories</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          See what clients are saying about their experience.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {siteConfig.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      <div className="max-w-5xl mx-auto mt-12">
        <ZolaBadgeCard zola={siteConfig.zola} />
      </div>
    </section>
  );
}
