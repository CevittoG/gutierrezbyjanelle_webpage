import type { Metadata } from "next";
import "@/components/concepts/concepts.css";
import "./v1.css";
import { siteConfig } from "@/config/site";
import { V1Shell } from "./_components/shell";

export const metadata: Metadata = {
  title: { default: `Concept V1 | ${siteConfig.name}`, template: `%s · Concept V1 | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return <V1Shell>{children}</V1Shell>;
}
