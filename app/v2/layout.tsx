import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "@/components/concepts/concepts.css";
import "./v2.css";
import { siteConfig } from "@/config/site";
import { V2Shell } from "./_components/shell";

// Loaded only on /v2 routes — never shipped to the live pages.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: `Concept V2 | ${siteConfig.name}`, template: `%s · Concept V2 | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${manrope.variable}`}>
      <V2Shell>{children}</V2Shell>
    </div>
  );
}
