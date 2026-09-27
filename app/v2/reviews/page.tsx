import type { Metadata } from "next";
import { V2Reviews } from "../_components/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <V2Reviews />;
}
