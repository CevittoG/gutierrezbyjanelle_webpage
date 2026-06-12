import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Keep the gated studio tools and the tokenized client portal out of indexes.
    rules: { userAgent: "*", allow: "/", disallow: ["/quotes", "/quote/", "/quote-calc", "/q/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
