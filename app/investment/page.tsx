import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { InvestmentContent } from "./_content";

export const metadata: Metadata = {
  title: "Investment",
  description: `View investment options for custom wedding stationery and event design by ${siteConfig.name}.`,
  openGraph: {
    url: `${siteConfig.url}/investment`,
    title: `Investment | ${siteConfig.name}`,
    description: `View investment options for custom wedding stationery and event design by ${siteConfig.name}.`,
  },
};

export default function InvestmentPage() {
  return <InvestmentContent />;
}
