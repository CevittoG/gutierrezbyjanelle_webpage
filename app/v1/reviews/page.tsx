import type { Metadata } from "next";
import { V1Reviews } from "../_components/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <V1Reviews />;
}
