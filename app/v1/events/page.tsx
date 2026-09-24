import type { Metadata } from "next";
import { V1Occasion } from "../_components/occasion";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return <V1Occasion kind="events" />;
}
