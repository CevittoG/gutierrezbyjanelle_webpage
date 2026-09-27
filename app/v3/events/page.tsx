import type { Metadata } from "next";
import { V3Occasion } from "../_components/occasion";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return <V3Occasion kind="events" />;
}
