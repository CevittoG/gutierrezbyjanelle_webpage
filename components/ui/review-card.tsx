import { cn } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { Review } from "@/config/site";

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <Card className={cn("flex flex-col justify-between", className)}>
      <CardContent className="pt-6">
        <blockquote className="text-base md:text-lg leading-relaxed italic mb-8">
          &ldquo;{review.text}&rdquo;
        </blockquote>
        <div className="flex flex-col">
          <p className="font-squarepeg text-lg">{review.author}</p>
          <p className="text-sm text-muted-foreground">{review.role}</p>
        </div>
      </CardContent>
    </Card>
  );
}
