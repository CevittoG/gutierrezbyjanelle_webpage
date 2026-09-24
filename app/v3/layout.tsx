import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import "@/components/concepts/concepts.css";
import "./v3.css";
import { siteConfig } from "@/config/site";
import { V3Shell } from "./_components/shell";

// Loaded only on /v3 routes — never shipped to the live pages.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: { default: `Concept V3 | ${siteConfig.name}`, template: `%s · Concept V3 | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bricolage.variable} ${instrument.variable}`}>
      <V3Shell>{children}</V3Shell>
    </div>
  );
}
