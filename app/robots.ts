import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// The gated studio tools, the tokenized client portal and the hidden design
// concepts stay out of every index.
const privatePaths = ["/quotes", "/quote/", "/quote-calc", "/q/", "/v1", "/v2", "/v3"];

// AI crawlers and assistants, named so the welcome is explicit (search,
// answer and training bots alike: for a small studio, being cited beats
// being withheld). A named group replaces `*` for that bot, so every group
// must repeat `privatePaths`.
const aiAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: aiAgents, allow: "/", disallow: privatePaths },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
