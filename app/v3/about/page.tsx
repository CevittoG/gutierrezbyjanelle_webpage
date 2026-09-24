import type { Metadata } from "next";
import { V3About } from "../_components/about";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <V3About />;
}
