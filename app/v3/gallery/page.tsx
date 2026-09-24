import type { Metadata } from "next";
import { V3Gallery } from "../_components/gallery";

export const metadata: Metadata = { title: "Gallery" };

export default function Page() {
  return <V3Gallery />;
}
