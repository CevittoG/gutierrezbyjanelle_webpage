import type { Metadata } from "next";
import { V1About } from "../_components/about";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <V1About />;
}
