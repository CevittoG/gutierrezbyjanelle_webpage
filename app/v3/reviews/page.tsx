import type { Metadata } from "next";
import { V3Reviews } from "../_components/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <V3Reviews />;
}
