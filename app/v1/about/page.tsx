import type { Metadata } from "next";
import { AboutContent } from "./_content";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <AboutContent />;
}
