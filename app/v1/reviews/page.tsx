import type { Metadata } from "next";
import { ReviewsContent } from "./_content";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <ReviewsContent />;
}
