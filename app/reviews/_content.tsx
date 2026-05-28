"use client";

import { ReviewCard } from "@/components/ui/review-card";
import { ZolaBadgeCard } from "@/components/ui/zola-badge-card";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/locale-context";

export function ReviewsContent() {
  const { t } = useLocale();
  const [featured, ...supporting] = siteConfig.reviews;

  return (
    <section className="container px-4 py-12 md:px-8">
      <div className="mx-auto mb-16 flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h1 className="font-squarepeg text-3xl leading-[1.1] md:text-5xl">
          {t("reviews.heading")}
        </h1>
        <p className="text-muted-foreground max-w-[85%] leading-normal sm:text-lg sm:leading-7">
          {t("reviews.intro")}
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        {featured && <ReviewCard review={featured} variant="featured" />}

        {supporting.length > 0 && (
          <div className="mt-8 grid grid-cols-1 items-start gap-6 md:mt-10 md:grid-cols-2 md:gap-8">
            {supporting.map((review) => (
              <ReviewCard key={review.id} review={review} variant="supporting" />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto mt-16 max-w-5xl">
        <ZolaBadgeCard zola={siteConfig.zola} />
      </div>
    </section>
  );
}
