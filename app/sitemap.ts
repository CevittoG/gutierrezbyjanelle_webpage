import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    // Order and priority mirror siteConfig.mainNav.
    { path: "/",         priority: 1.0, changeFrequency: "monthly" as const },
    { path: "/about",    priority: 0.9, changeFrequency: "yearly"  as const },
    { path: "/weddings", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/events",   priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/gallery",  priority: 0.6, changeFrequency: "weekly"  as const },
    { path: "/reviews",  priority: 0.7, changeFrequency: "weekly"  as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
