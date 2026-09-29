import type { Metadata } from "next";
import { WeddingsContent } from "./_content";

export const metadata: Metadata = { title: "Weddings" };

export default function Page() {
  return <WeddingsContent />;
}
