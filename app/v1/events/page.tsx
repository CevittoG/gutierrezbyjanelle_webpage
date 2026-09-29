import type { Metadata } from "next";
import { EventsContent } from "./_content";

export const metadata: Metadata = { title: "Events & Corporate" };

export default function Page() {
  return <EventsContent />;
}
