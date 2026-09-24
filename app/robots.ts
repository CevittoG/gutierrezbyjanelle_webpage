import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Keep the gated studio tools, the tokenized client portal and the hidden
    // design concepts out of indexes.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/quotes", "/quote/", "/quote-calc", "/q/", "/v1", "/v2", "/v3"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
