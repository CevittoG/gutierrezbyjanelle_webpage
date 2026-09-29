import type { Metadata } from "next";
import { GalleryContent } from "./_content";

export const metadata: Metadata = { title: "Gallery" };

export default function Page() {
  return <GalleryContent />;
}
