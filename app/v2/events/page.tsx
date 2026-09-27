import type { Metadata } from "next";
import { V2Occasion } from "../_components/occasion";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return <V2Occasion kind="events" />;
}
