import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { WeddingsContent } from "./_content";

export const metadata: Metadata = {
  title: "Weddings",
  description: `A personal note from Janelle to brides and grooms, your wedding stationery and signage designer.`,
  openGraph: {
    url: `${siteConfig.url}/weddings`,
    title: `Weddings | ${siteConfig.name}`,
    description: `A personal note from Janelle to brides and grooms, your wedding stationery and signage designer.`,
  },
};

export default function WeddingsPage() {
  return <WeddingsContent />;
}
