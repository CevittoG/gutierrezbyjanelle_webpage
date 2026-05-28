"use client";

import { cn } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { Review } from "@/config/site";
import { useLocale } from "@/lib/locale-context";
import { pick } from "@/lib/i18n";

interface ReviewCardProps {
  review: Review;
  variant?: "featured" | "supporting";
  className?: string;
}

export function ReviewCard({
  review,
  variant = "supporting",
  className,
}: ReviewCardProps) {
  const { locale } = useLocale();
  const isFeatured = variant === "featured";
  const text = pick(review.text, locale);
  const role = pick(review.role, locale);
  // Mark the quote with the locale we're displaying so screen readers / browsers
  // pronounce it correctly. Falls back to the original language if known.
  const quoteLang = locale ?? review.originalLang;

  return (
    <Card className={cn("relative", className)}>
      <CardContent
        className={cn(
          "flex flex-col",
          isFeatured ? "gap-8 p-6 md:gap-10 md:p-10" : "gap-6 p-6",
        )}
      >
        {isFeatured && (
          <span
            aria-hidden="true"
            className="font-squarepeg pointer-events-none absolute left-4 top-2 select-none text-[6rem] leading-none text-foreground/15 md:left-8 md:text-[8rem]"
          >
            &ldquo;
          </span>
        )}

        <blockquote
          {...(quoteLang ? { lang: quoteLang } : {})}
          className={cn(
            "font-anybody-prose relative",
            isFeatured
              ? "text-lg leading-relaxed md:text-2xl md:leading-[1.5] md:pl-16"
              : "text-base leading-relaxed",
            "max-w-[68ch]",
          )}
        >
          {text}
        </blockquote>

        <footer
          className={cn(
            "flex flex-col",
            isFeatured && "md:pl-16",
          )}
        >
          <p
            className={cn(
              "font-squarepeg leading-none",
              isFeatured ? "text-3xl md:text-4xl" : "text-xl",
            )}
          >
            {review.author}
          </p>
          <p
            className={cn(
              "text-muted-foreground mt-2",
              isFeatured ? "text-sm" : "text-xs",
            )}
          >
            {role}
          </p>
        </footer>
      </CardContent>
    </Card>
  );
}
