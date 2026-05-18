import { siteConfig } from "@/config/site";

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
          <div
            key={review.id}
            className="flex flex-col justify-between rounded-2xl border bg-card p-8 shadow-sm"
          >
            <blockquote className="text-lg leading-relaxed text-foreground italic">
              &ldquo;{review.text}&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex flex-col">
                <p className="font-semibold">{review.author}</p>
                <p className="text-sm text-muted-foreground">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
