import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Keep the internal tool and the tokenized client portal out of indexes.
    rules: { userAgent: "*", allow: "/", disallow: ["/quote-calc", "/q/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
