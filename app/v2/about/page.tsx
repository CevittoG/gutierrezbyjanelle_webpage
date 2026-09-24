import type { Metadata } from "next";
import { V2About } from "../_components/about";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <V2About />;
}
